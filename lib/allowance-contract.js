/** 套餐价格和模型月额度必须分别指向已有的逐字证据。 */
export function allowanceErrors(offer) {
  const errors = [];
  const plan = offer.allowance;
  if (offer.promotionType !== "allowance") {
    if (plan) errors.push("allowance 字段只适用于额度优惠");
    return errors;
  }
  if (offer.category !== "creditsPromotion" || !offer.appliesTo?.includes("subscription"))
    errors.push("额度优惠必须是订阅类 creditsPromotion");
  if (!plan || !offer.planName?.trim()) return [...errors, "额度优惠缺少套餐名称或 allowance"];
  const norm = (s) => String(s).replace(/[\s　]/g, "").toLowerCase();
  const check = (entry, model = false) => {
    if (!entry || !Number.isFinite(entry.value) || entry.value <= 0 || entry.currency !== "USD" || entry.period !== "month") {
      errors.push("价格与额度必须为正数，并声明 USD / month");
      return;
    }
    const fact = Number.isInteger(entry.fact) ? offer.facts?.[entry.fact] : null;
    if (!fact?.quote || !entry.text || !norm(fact.quote).includes(norm(entry.text)))
      errors.push("价格或额度缺少对应的逐字证据");
    const dollars = [...String(entry.text).matchAll(/\$\s*(\d[\d,]*(?:\.\d+)?)/g)];
    if (dollars.length !== 1 || Number(dollars[0][1].replaceAll(",", "")) !== entry.value)
      errors.push("价格或额度数字与证据文本不一致");
    if (model) {
      if (!entry.model?.trim() || !norm(fact?.quote).includes(norm(entry.model)))
        errors.push("模型额度必须在同一条证据中命中模型名称");
      const values = [...String(fact?.quote).matchAll(/\$\s*(\d[\d,]*(?:\.\d+)?)/g)];
      if (!values.length || Number(values.at(-1)[1].replaceAll(",", "")) !== entry.value)
        errors.push("模型月额度必须对应证据行最后的额度值");
    }
  };
  check(plan.price);
  if (!Array.isArray(plan.models) || !plan.models.length) errors.push("额度优惠必须给出适用模型及月额度");
  else {
    const names = new Set();
    for (const entry of plan.models) {
      check(entry, true);
      if (names.has(entry.model)) errors.push("套餐模型额度重复");
      names.add(entry.model);
    }
    if (!plan.models.some((entry) => entry.value > plan.price?.value))
      errors.push("没有可证明的额度增益，不能记为额度优惠");
  }
  if (plan.extraCredit) check(plan.extraCredit);
  for (const field of ["limits", "notes"])
    if (!plan[field]?.zh || !plan[field]?.en) errors.push(`额度优惠缺少 ${field} 双语说明`);
  return errors;
}
