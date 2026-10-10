/** 宠物池：6 只内置，各自成长；与业务数据零映射，纯装饰层。 */
export const PETS = [
  { id: "mo", name: "阿墨", nameEn: "Amo", kind: "猫", kindEn: "Cat", emoji: "🐱" },
  { id: "qi", name: "七喜", nameEn: "Qixi", kind: "柴犬", kindEn: "Shiba Inu", emoji: "🐶" },
  { id: "dou", name: "豆芽", nameEn: "Sprout", kind: "兔子", kindEn: "Rabbit", emoji: "🐰" },
  { id: "ta", name: "塔塔", nameEn: "Tata", kind: "企鹅", kindEn: "Penguin", emoji: "🐧" },
  { id: "lu", name: "鹿鹿", nameEn: "Lulu", kind: "小鹿", kindEn: "Fawn", emoji: "🦌" },
  { id: "xing", name: "星星", nameEn: "Star", kind: "水獭", kindEn: "Otter", emoji: "🦦" },
];

export const PET_IDS = PETS.map((p) => p.id);

/** 成长与饱食只由投喂事件重放得出，不存第二份状态。 */
export function petView(petId: string, feeds: number, feedsToday: number) {
  const growth = Math.min(100, feeds * 5);
  const stage = growth < 30 ? 1 : growth < 70 ? 2 : 3;
  const fullness = Math.min(100, feedsToday * 25);
  const mood = fullness >= 60 ? "开心" : fullness >= 25 ? "还行" : "饿";
  return { petId, feeds, feedsToday, growth, stage, fullness, mood };
}
