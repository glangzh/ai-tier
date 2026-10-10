"use client";

import { useEffect, useState } from "react";
import { FOOD_EVENT, addFood, claimed, foods, markClaimed, openPets, session } from "@/lib/client";
import { useT } from "@/components/LangProvider";

/** 打卡只是本机记一笔：换一份食物喂宠物。不代表官方确认，AIRadar 也不代领。 */
export function ClaimButton({ offerKey }: { offerKey: string }) {
  const tr = useT();
  const [state, setState] = useState<"idle" | "busy" | "done" | "dup" | "fail">("idle");
  const [detail, setDetail] = useState("");
  const [held, setHeld] = useState(0);

  useEffect(() => {
    const sync = () => setHeld(foods().length);
    sync();
    if (claimed(offerKey)) setState("done");
    window.addEventListener(FOOD_EVENT, sync);
    return () => window.removeEventListener(FOOD_EVENT, sync);
  }, [offerKey]);

  async function claim() {
    setState("busy");
    try {
      const r = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offerKey, session: session() }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) {
        markClaimed(offerKey);
        return setState("dup");
      }
      if (!r.ok) {
        setDetail(j.error ?? `http ${r.status}`);
        return setState("fail");
      }
      addFood(j.foodToken);
      markClaimed(offerKey);
      setState("done");
    } catch {
      setDetail("网络不通");
      setState("fail");
    }
  }

  if (state === "done")
    return (
      <>
        <span className="chip on" aria-live="polite">
          {tr("claim.done")}
        </span>
        <button className="chip" type="button" onClick={openPets}>
          {tr("claim.feed")} <b>{held}</b>
        </button>
      </>
    );

  const label =
    state === "busy"
      ? tr("claim.busy")
      : state === "dup"
        ? tr("claim.dup")
        : state === "fail"
          ? `${tr("claim.net")}：${detail}`
          : tr("claim.mine");

  return (
    <button
      className="chip"
      type="button"
      onClick={claim}
      disabled={state === "busy" || state === "dup"}
      title={tr("claim.title")}
    >
      {label}
    </button>
  );
}
