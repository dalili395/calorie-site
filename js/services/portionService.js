window.CalorieServices = window.CalorieServices || {};

window.CalorieServices.portionService = (function createPortionService() {
  const rules = [
    { pattern: /bubble tea|milk tea|latte|cappuccino|coffee|tea|cola|juice|soda|beer|wine|drink/, baseUnit: "ml", defaultAmount: 500, units: [{ id: "ml", label: "毫升", baseAmount: 1 }, { id: "cup", label: "杯", baseAmount: 500, defaultAmount: 1 }] },
    { pattern: /hamburger|burger|cheeseburger/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 180 }] },
    { pattern: /pizza/, baseUnit: "g", defaultAmount: 1, units: [{ id: "slice", label: "片", baseAmount: 100 }, { id: "piece", label: "个", baseAmount: 750 }] },
    { pattern: /fried chicken wing|chicken wing/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "只", baseAmount: 70 }] },
    { pattern: /fried chicken thigh|chicken thigh|drumstick/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "只", baseAmount: 120 }] },
    { pattern: /chicken nuggets/, baseUnit: "g", defaultAmount: 6, units: [{ id: "piece", label: "块", baseAmount: 16 }] },
    { pattern: /popcorn chicken|fried chicken fillet|fried chicken|salted chicken/, baseUnit: "g", defaultAmount: 1, units: [{ id: "serving", label: "份", baseAmount: 180 }] },
    { pattern: /egg tart/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 60 }] },
    { pattern: /egg/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 50 }] },
    { pattern: /baozi|bun|mantou/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 100 }] },
    { pattern: /dumpling|potsticker/, baseUnit: "g", defaultAmount: 10, units: [{ id: "piece", label: "个", baseAmount: 25 }] },
    { pattern: /wonton/, baseUnit: "g", defaultAmount: 12, units: [{ id: "piece", label: "个", baseAmount: 15 }] },
    { pattern: /tangyuan|yuanxiao/, baseUnit: "g", defaultAmount: 6, units: [{ id: "piece", label: "个", baseAmount: 25 }] },
    { pattern: /shumai|siu mai/, baseUnit: "g", defaultAmount: 4, units: [{ id: "piece", label: "个", baseAmount: 35 }] },
    { pattern: /mooncake/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 100 }] },
    { pattern: /zongzi/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 180 }] },
    { pattern: /sandwich|wrap|hot dog|taco|burrito/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 180 }] },
    { pattern: /apple/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 180 }] },
    { pattern: /banana/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "根", baseAmount: 118 }] },
    { pattern: /orange|mandarin|tangerine/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 130 }] },
    { pattern: /pear/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 178 }] },
    { pattern: /peach/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 150 }] },
    { pattern: /kiwi/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "个", baseAmount: 75 }] },
    { pattern: /rice|fried rice/, baseUnit: "g", defaultAmount: 1, units: [{ id: "serving", label: "份", baseAmount: 300 }, { id: "bowl", label: "碗", baseAmount: 200 }] },
    { pattern: /noodle|ramen|lamian|luosifen|liangpi/, baseUnit: "g", defaultAmount: 1, units: [{ id: "serving", label: "份", baseAmount: 450 }] },
    { pattern: /hot pot|malatang|maocai|mala fragrant pot/, baseUnit: "g", defaultAmount: 1, units: [{ id: "serving", label: "份", baseAmount: 500 }] },
    { pattern: /cake|brownie|cheesecake|muffin|waffle|pancake|cookie/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "块", baseAmount: 100 }] },
    { pattern: /skewer/, baseUnit: "g", defaultAmount: 1, units: [{ id: "piece", label: "串", baseAmount: 50 }] },
    { pattern: /soup|congee|porridge/, baseUnit: "g", defaultAmount: 1, units: [{ id: "bowl", label: "碗", baseAmount: 300 }] },
    { pattern: /chinese|stir|braised|boiled|roast|fried|curry|grilled|spicy|tofu|pork|beef|chicken|duck|fish|lamb/, baseUnit: "g", defaultAmount: 1, units: [{ id: "serving", label: "份", baseAmount: 250 }] }
  ];

  function normalize(food) {
    return [food.id, food.name, ...(food.aliases || [])].join(" ").toLowerCase();
  }

  function getRule(food) {
    if (food.sourceType === "custom" && food.unit === "serving") {
      return {
        baseUnit: "serving",
        defaultAmount: 1,
        units: [{ id: "serving", label: "份", baseAmount: 1, defaultAmount: 1 }]
      };
    }
    const text = normalize(food);
    return rules.find((rule) => rule.pattern.test(text));
  }

  function getBaseUnit(food) {
    return getRule(food)?.baseUnit || "g";
  }

  function getBaseLabel(baseUnit) {
    if (baseUnit === "serving") return "份";
    return baseUnit === "ml" ? "毫升" : "克";
  }

  function getUnits(food) {
    const rule = getRule(food);
    const baseUnit = getBaseUnit(food);
    const baseOption = baseUnit === "serving"
      ? { id: "serving", label: "份", baseAmount: 1, defaultAmount: 1 }
      : baseUnit === "ml"
      ? { id: "ml", label: "毫升", baseAmount: 1, defaultAmount: rule?.defaultAmount || 500 }
      : { id: "g", label: "克", baseAmount: 1, defaultAmount: 100 };
    if (baseUnit === "serving") return [baseOption];
    const gramFallback = baseUnit === "ml"
      ? [{ id: "g", label: "克", baseAmount: 1, defaultAmount: 100 }]
      : [];
    const unitOptions = rule?.units || [{ id: "serving", label: "份", baseAmount: 250, defaultAmount: 1 }];
    return [baseOption, ...unitOptions.map((unit) => ({ defaultAmount: rule?.defaultAmount || 1, ...unit })), ...gramFallback];
  }

  function getDefaultUnit(food) {
    const units = getUnits(food);
    const rule = getRule(food);
    if (!rule) return units.find((unit) => unit.id === "g") || units[0];
    if (rule.baseUnit === "ml") return units.find((unit) => unit.id === "ml") || units[0];
    return units.find((unit) => unit.id !== "g") || units[0];
  }

  function getUnit(food, unitId) {
    return getUnits(food).find((unit) => unit.id === unitId) || getDefaultUnit(food);
  }

  function getBaseAmount(food, amount, unitId) {
    const unit = getUnit(food, unitId);
    return amount * unit.baseAmount;
  }

  function calculate(food, amount, unitId) {
    if (food.sourceType === "custom" && food.unit === "serving") {
      return food.calories * amount;
    }
    return food.calories * (getBaseAmount(food, amount, unitId) / 100);
  }

  return {
    calculate,
    getBaseAmount,
    getBaseLabel,
    getBaseUnit,
    getDefaultUnit,
    getUnit,
    getUnits
  };
})();
