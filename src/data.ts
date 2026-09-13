import { Index, Snapshot } from './types'

const base = import.meta.env.BASE_URL

export async function loadIndex(): Promise<Index> {
  const r = await fetch(`${base}data/history_index.json`)
  if (!r.ok) throw new Error(`加载 history_index.json 失败：${r.status}`)
  return r.json()
}

export async function loadSnapshot(file: string): Promise<Snapshot> {
  const r = await fetch(`${base}data/${file}`)
  if (!r.ok) throw new Error(`加载 ${file} 失败：${r.status}`)
  return r.json()
}
