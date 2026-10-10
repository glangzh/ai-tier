"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { PETS } from "@/lib/pets";
import { FOOD_EVENT, OPEN_PETS, foods, useFood } from "@/lib/client";
import { useLang, useT } from "@/components/LangProvider";

interface View { petId: string; feeds: number; feedsToday: number; growth: number; stage: number; fullness: number; mood: string }
interface State { date: string; fedToday: number; pets: View[] }

/** 右下角的宠物角：卡片打卡攒下的食物在这里喂给指定的那一只。 */
export function PetCorner() {
  const lang = useLang();
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [st, setSt] = useState<State | null>(null);
  const [held, setHeld] = useState(0);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  const reload = useCallback(async () => {
    try {
      const r = await fetch("/api/pet/state");
      if (r.ok) setSt(await r.json());
    } catch {
      /* 拿不到状态就不显示角标，不影响主功能 */
    }
  }, []);

  useEffect(() => {
    setHeld(foods().length);
    reload();
    const onFood = () => setHeld(foods().length);
    const onOpen = () => setOpen(true);
    window.addEventListener(FOOD_EVENT, onFood);
    window.addEventListener(OPEN_PETS, onOpen);
    const t = setInterval(reload, 60_000);
    return () => {
      window.removeEventListener(FOOD_EVENT, onFood);
      window.removeEventListener(OPEN_PETS, onOpen);
      clearInterval(t);
    };
  }, [reload]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const name = (id: string) => PETS.find((p) => p.id === id);
  const emoji = (id: string) => name(id)?.emoji ?? "🐾";
  const petName = (id: string) => {
    const pet = name(id);
    return lang === "en" ? pet?.nameEn ?? pet?.name : pet?.name;
  };
  const petKind = (id: string) => {
    const pet = name(id);
    return lang === "en" ? pet?.kindEn ?? pet?.kind : pet?.kind;
  };
  const moodText = (mood: string) =>
    lang === "en" ? ({ 开心: "Happy", 还行: "Okay", 饿: "Hungry" }[mood] ?? mood) : mood;
  const hungriest = st?.pets.slice().sort((a, b) => a.fullness - b.fullness || b.feeds - a.feeds)[0];

  async function feed(petId: string) {
    const token = foods()[0];
    if (!token) return setNote(tr("pet.needFood"));
    setBusy(petId);
    setNote("");
    try {
      const r = await fetch("/api/feed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ foodToken: token, petId }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok || (r.status === 409 && j.error === "这份食物已经用过了")) useFood(token);
      if (!r.ok) setNote(j.error === "这份食物已经用过了" ? tr("pet.used") : j.error ?? `http ${r.status}`);
      else setNote(j.snack ? tr("pet.ateSnack", { name: petName(petId) ?? "" }) : tr("pet.ate", { name: petName(petId) ?? "" }));
      await reload();
    } catch {
      setNote(tr("pet.net"));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="pet-corner">
      {open && (
        <section className="pet-panel" role="dialog" aria-label={tr("pet.panelTitle")}>
          <h2>
            {tr("pet.panelTitle")} <b>{held}</b> {tr("pet.pending", { n: held }).replace(/^\S+\s/, "")}
          </h2>
          <ul>
            {st?.pets.map((p) => (
              <li key={p.petId} className="pet-row">
                <span className="pet-emoji">{emoji(p.petId)}</span>
                <span className="pet-name">
                  {petName(p.petId)}
                  <small>
                    {petKind(p.petId)} · {tr("pet.level", { n: p.stage })} · {tr("pet.today", { n: p.feedsToday })}
                  </small>
                </span>
                <span className="pet-bars">
                  <i className="bar growth" style={{ "--w": `${p.growth}%` } as CSSProperties} />
                  <i className="bar full" style={{ "--w": `${p.fullness}%` } as CSSProperties} />
                </span>
                <span className={`mood ${p.mood === "饿" ? "bad" : ""}`}>{moodText(p.mood)}</span>
                <button className="chip" type="button" disabled={!held || busy === p.petId} onClick={() => feed(p.petId)}>
                  {busy === p.petId ? tr("pet.feeding") : tr("pet.feed")}
                </button>
              </li>
            ))}
          </ul>
          <p className="pet-note">
            {note || tr("pet.moodPool", { n: st?.fedToday ?? 0 })}
          </p>
        </section>
      )}
      <button
        className="chip pet-badge"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {emoji(hungriest?.petId ?? "")}{" "}
        {held
          ? tr("pet.foods", { n: held, name: petName(hungriest?.petId ?? "") ?? "", mood: moodText(hungriest?.mood ?? "") })
          : tr("pet.pool", { n: st?.fedToday ?? 0 })}
      </button>
    </div>
  );
}
