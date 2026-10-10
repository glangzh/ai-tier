import { t, type Lang, type UIKey } from "@/lib/i18n/site";
import type { TierChange } from "@/lib/tier/types";

const TIER_LABEL_KEYS: Record<string, UIKey> = {
  T1: "ranking.tier.T1",
  T2: "ranking.tier.T2",
  T3: "ranking.tier.T3",
  T4: "ranking.tier.T4",
};

function tierLabel(lang: Lang, tier: string) {
  const key = TIER_LABEL_KEYS[tier];
  return key ? t(lang, key) : tier;
}

export default function TierUpdateBadge({ lang, changes }: { lang: Lang; changes: TierChange[] }) {
  return (
    <aside className="hero-badge tier-update-badge">
      <span className="tier-update-list">
        {changes.length === 0
          ? t(lang, "ranking.update.none")
          : changes.map((change) => (
              <span className="tier-update-change" key={`${change.company}-${change.asOf}`}>
                {t(lang, "ranking.update.change", {
                  company: change.company,
                  fromName: tierLabel(lang, change.fromTier),
                  fromTier: change.fromTier,
                  toName: tierLabel(lang, change.toTier),
                  toTier: change.toTier,
                })}
              </span>
            ))}
      </span>
    </aside>
  );
}
