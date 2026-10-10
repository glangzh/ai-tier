/** 浏览器侧的匿名会话与待投喂食物；token 是一次性能力凭证，服务端校验。 */
export function session(): string {
  const k = "airadar-session";
  let s = localStorage.getItem(k);
  if (!s) {
    s = crypto.randomUUID();
    localStorage.setItem(k, s);
  }
  return s;
}

export function foods(): string[] {
  try {
    return JSON.parse(localStorage.getItem("airadar-food") ?? "[]");
  } catch {
    return [];
  }
}

function writeFoods(list: string[]) {
  localStorage.setItem("airadar-food", JSON.stringify(list));
  window.dispatchEvent(new Event(FOOD_EVENT));
}

export function addFood(token: string) {
  writeFoods([...new Set([...foods(), token])]);
}

export function useFood(token: string) {
  writeFoods(foods().filter((t) => t !== token));
}

/** 卡片打卡过哪些活动：只在本机，用于刷新后不把"我领到了"再摆一次。 */
const claimList = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem("airadar-claims") ?? "[]");
  } catch {
    return [];
  }
};
export const claimed = (offerKey: string) => claimList().includes(offerKey);

export function markClaimed(offerKey: string) {
  localStorage.setItem("airadar-claims", JSON.stringify([...new Set([...claimList(), offerKey])]));
}

/** 卡片打卡与右下角宠物角之间的唯一耦合：一个 DOM 事件，没有全局 store。 */
export const FOOD_EVENT = "airadar:food";

/** 打开宠物面板：打卡后卡片上的"去投喂"用。 */
export const OPEN_PETS = "airadar:open-pets";
export const openPets = () => window.dispatchEvent(new Event(OPEN_PETS));
