import { redirect } from "next/navigation";
import { isLang } from "@/lib/i18n/site";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${isLang(lang) ? lang : "zh-CN"}/deals`);
}
