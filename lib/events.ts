import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * 在线状态的唯一存储：追加式事件。写一次就是一个新条目，键里带时间戳与随机后缀，
 * 因此没有读改写、没有并发覆盖，也不需要事务。
 * 本地与 CI 落文件系统（.data/events），线上落 Redis（REDIS_URL）——两边接口一致。
 * 事实源（offers / amendments / snapshots / index）不在此列，那仍是 Git。
 */
const rootDir = () => process.env.EVENTS_DIR || join(process.cwd(), ".data", "events");
const ns = () => process.env.EVENTS_PREFIX || "airadar";

interface Store {
  append(key: string, value: string): Promise<void>;
  /** Atomically append an event once for an idempotency key. */
  appendOnce(idempotencyKey: string, key: string, value: string): Promise<boolean>;
  /** 按前缀取回全部事件（键序即时间序）。 */
  scan(prefix?: string): Promise<{ key: string; value: string }[]>;
  close?(): void;
}

async function fsStore(): Promise<Store> {
  const walk = async (dir: string, out: string[]) => {
    for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await walk(p, out);
      else if (p.endsWith(".json")) out.push(p);
    }
  };
  return {
    async append(key, value) {
      const path = join(rootDir(), key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, value);
    },
    async appendOnce(_idempotencyKey, key, value) {
      const path = join(rootDir(), key);
      await mkdir(dirname(path), { recursive: true });
      try {
        await writeFile(path, value, { flag: "wx" });
        return true;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "EEXIST") return false;
        throw e;
      }
    },
    async scan(prefix) {
      const files: string[] = [];
      const root = rootDir();
      await walk(existsSync(root) ? root : "", files);
      const out: { key: string; value: string }[] = [];
      for (const f of files.sort()) {
        const key = f.slice(root.length + 1).replace(/^[/\\]/, "");
        if (prefix && !key.startsWith(prefix)) continue;
        out.push({ key, value: await readFile(f, "utf8") });
      }
      return out;
    },
  };
}

/** Redis：每个 group 一个 list，SMEMBERS 记 group 名，键序即写入序。 */
async function redisStore(): Promise<Store> {
  const { default: Redis } = await import("ioredis");
  const client = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 2 });
  return {
    async append(key, value) {
      const group = key.split("/")[0];
      await client
        .multi()
        .sadd(`${ns()}:groups`, group)
        .rpush(`${ns()}:ev:${group}`, value)
        .exec();
    },
    async appendOnce(idempotencyKey, key, value) {
      const group = key.split("/")[0];
      const script = `
        if redis.call("SET", KEYS[1], ARGV[1], "NX") then
          redis.call("SADD", KEYS[2], ARGV[2])
          redis.call("RPUSH", KEYS[3], ARGV[1])
          return 1
        end
        return 0
      `;
      const result = await client.eval(
        script,
        3,
        `${ns()}:once:${hash(idempotencyKey)}`,
        `${ns()}:groups`,
        `${ns()}:ev:${group}`,
        value,
        group,
      );
      return Number(result) === 1;
    },
    async scan(prefix) {
      const groups = await client.smembers(`${ns()}:groups`);
      const hit = groups.filter((g) => !prefix || `${g}/`.startsWith(prefix)).sort();
      const out: { key: string; value: string }[] = [];
      for (const g of hit) {
        for (const value of await client.lrange(`${ns()}:ev:${g}`, 0, -1)) {
          try {
            out.push({ key: JSON.parse(value).key, value });
          } catch {
            /* 半个对象不算事件 */
          }
        }
      }
      return out;
    },
    close: () => client.disconnect(),
  };
}

let store: Store | null = null;
const getStore = async () =>
  (store ??= process.env.REDIS_URL ? await redisStore() : await fsStore());

/** 换后端用（测试与本地开发）：断开旧连接，避免进程退不出去。 */
export function resetStore() {
  store?.close?.();
  store = null;
}

const eventLocks = new Map<string, Promise<void>>();

/** 单进程内串行化依赖同一事件桶的读-判定-写操作。Redis 的 appendOnce 负责跨进程去重。 */
export async function withEventLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = eventLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  eventLocks.set(key, current);
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (eventLocks.get(key) === current) eventLocks.delete(key);
  }
}

export interface Ev<T = unknown> {
  key: string;
  at: string;
  type: string;
  data: T;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

let lastEventMs = 0;

function nextEventDate() {
  const ms = Math.max(Date.now(), lastEventMs + 1);
  lastEventMs = ms;
  return new Date(ms);
}

function stamp(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}.${String(d.getUTCMilliseconds()).padStart(3, "0")}Z`;
}

export async function append<T>(type: string, data: T): Promise<string> {
  const group = type.split(".")[0];
  const at = nextEventDate();
  const key = `${group}/${type}-${stamp(at)}-${randomBytes(6).toString("hex")}.json`;
  await (await getStore()).append(key, JSON.stringify({ key, at: at.toISOString(), type, data }));
  return key;
}

/** 为能力凭证、确认和消费标记提供跨请求的 exactly-once 事件写入。 */
export async function appendOnce<T>(type: string, idempotencyKey: string, data: T): Promise<string | null> {
  const group = type.split(".")[0];
  const key = `${group}/${type}-once-${hash(idempotencyKey).slice(0, 32)}.json`;
  const value = JSON.stringify({ key, at: nextEventDate().toISOString(), type, data });
  const created = await (await getStore()).appendOnce(idempotencyKey, key, value);
  return created ? key : null;
}

export async function readAll<T = unknown>(prefix?: string): Promise<Ev<T>[]> {
  const out: Ev<T>[] = [];
  for (const { value } of await (await getStore()).scan(prefix)) {
    try {
      out.push(JSON.parse(value));
    } catch {
      /* 半个对象不算事件 */
    }
  }
  return out.sort((a, b) => a.at.localeCompare(b.at) || a.key.localeCompare(b.key));
}

export const hash = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(24).toString("base64url");

export function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
