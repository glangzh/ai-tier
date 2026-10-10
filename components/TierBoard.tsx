"use client";

import { useEffect, useState } from "react";
import { loadDimensions, loadEvents, loadIndex, loadSnapshot } from "@/lib/tier/data";
import type { Dimensions, EventStream, Index, Snapshot } from "@/lib/tier/types";
import { setLang, t, translate, useLang } from "@/lib/tier/i18n";
import SnapshotSwitcher from "@/components/tier/SnapshotSwitcher";
import TierBands from "@/components/tier/TierBands";
import TierRuler from "@/components/tier/TierRuler";
import FullTable from "@/components/tier/FullTable";
import Notes from "@/components/tier/Notes";
import Compare from "@/components/tier/Compare";
import Trend from "@/components/tier/Trend";
import CompanyCompare from "@/components/tier/CompanyCompare";
import OpenGap from "@/components/tier/OpenGap";
import ModelTiers from "@/components/tier/ModelTiers";
import CompanyDetail from "@/components/tier/CompanyDetail";
import { TooltipHost } from "@/components/tier/HoverCard";

type Tab = "overview" | "compare" | "trend" | "company" | "open-gap" | "models" | "notes";

const TABS: [Tab, string][] = [
  ["overview", "nav.overview"],
  ["compare", "nav.compare"],
  ["trend", "nav.trend"],
  ["company", "nav.company"],
  ["models", "nav.models"],
  ["open-gap", "nav.openGap"],
  ["notes", "nav.notes"],
];

export default function TierBoard({ lang: siteLang }: { lang: "zh-CN" | "en" }) {
  const lang = useLang();
  const [index, setIndex] = useState<Index | null>(null);
  const [snaps, setSnaps] = useState<Record<string, Snapshot>>({});
  const [dims, setDims] = useState<Dimensions | null>(null);
  const [events, setEvents] = useState<EventStream | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [detailId, setDetailId] = useState<string>("");
  const [viewAsOf, setViewAsOf] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  // 站内语言是唯一语言源：注入榜自己的 i18n（它已有完整中英表），榜内不再放切换
  useEffect(() => {
    setLang(siteLang === "en" ? "en" : "zh");
    document.documentElement.lang = siteLang === "en" ? "en" : "zh-CN";
  }, [siteLang]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setIndex(null);
    setSnaps({});
    setViewAsOf("");

    loadIndex()
      .then(async (idx) => {
        const latest = idx.snapshots.find((s) => s.latest) ?? idx.snapshots[0];
        if (!latest) throw new Error(t("app.noSnapshot"));

        const map: Record<string, Snapshot> = {};
        const [loadedDims, loadedEvents] = await Promise.all([
          loadDimensions(),
          loadEvents(),
          ...idx.snapshots.map(async (s) => {
            map[s.as_of] = await loadSnapshot(s.file);
          }),
        ]);

        if (!active) return;
        setIndex(idx);
        setViewAsOf(latest.as_of);
        setSnaps(map);
        setDims(loadedDims);
        setEvents(loadedEvents);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "数据加载失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  const view = viewAsOf ? snaps[viewAsOf] : null;

  if (error)
    return (
      <p className="note" role="alert">
        {t("app.loadFailedDetail", { error })}{" "}
        <button className="chip" type="button" onClick={() => setRetry((n) => n + 1)}>
          {t("app.retry")}
        </button>
      </p>
    );

  if (loading || !index || !view)
    return (
      <p className="note" role="status" aria-live="polite">
        {translate("app.loading", undefined, siteLang === "en" ? "en" : "zh")}
      </p>
    );

  return (
    <TooltipHost>
      <div className="tier-board">
        <div className="tier-bar">
          <SnapshotSwitcher
            index={index}
            value={viewAsOf}
            onPick={(v) => {
              setViewAsOf(v);
              setDetailId("");
            }}
          />
        </div>

        <TierBands snap={view} onOpen={(id) => { setTab("overview"); setDetailId(id); }} />

        <nav className="filters" aria-label={t("app.navLabel")}>
          {TABS.map(([key, label]) => (
            <button
              key={key}
              className={`chip${tab === key ? " on" : ""}`}
              type="button"
              aria-current={tab === key ? "page" : undefined}
              onClick={() => {
                setTab(key);
                setDetailId("");
              }}
            >
              {t(label)}
            </button>
          ))}
        </nav>

        <div className="tier-body">
          {tab === "overview" && !detailId && (
            <>
              <TierRuler snap={view} onOpen={setDetailId} />
              <FullTable snap={view} onOpen={setDetailId} />
            </>
          )}
          {tab === "notes" && <Notes snap={view} />}
          {tab === "overview" && detailId && (
            <CompanyDetail
              row={view.rows.find((r) => r.company_id === detailId || r.name === detailId) ?? view.rows[0]}
              reference={view.company_benchmarks?.references.find((r) => r.id === detailId || r.name === detailId)}
              frontierName={view.frontier.name}
              snapBenchmark={view.benchmark}
              dimensions={dims}
              events={events}
              frontier={Object.entries(view.pools.main ?? {}).map(([model, [score, date]]) => ({ model, score, date }))}
              onBack={() => setDetailId("")}
            />
          )}
          {tab === "compare" && <Compare index={index} snaps={snaps} />}
          {tab === "trend" && <Trend index={index} snaps={snaps} eventStream={events} />}
          {tab === "company" && <CompanyCompare snap={view} />}
          {tab === "open-gap" && <OpenGap key={view.as_of} snap={view} />}
          {tab === "models" && <ModelTiers snap={view} />}
        </div>
      </div>
    </TooltipHost>
  );
}
