import { t, type Lang } from "@/lib/i18n/site";

export function SourceLink({ url, lang }: { url: string; lang: Lang }) {
  return (
    <a
      className="source-link"
      data-source-link
      href={url}
      rel="noopener noreferrer nofollow"
      target="_blank"
      aria-label={t(lang, "card.sourceAria")}
      title={t(lang, "card.sourceAria")}
    >
      <svg className="source-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07L10.86 5.14" />
        <path d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 7 20l1.14-1.14" />
      </svg>
    </a>
  );
}
