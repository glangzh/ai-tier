// 构建时决定是否提供需要持久化存储的互动功能。
export const INTERACTIONS_ENABLED = process.env.NEXT_PUBLIC_INTERACTIONS_ENABLED !== "0";
