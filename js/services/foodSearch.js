window.CalorieServices = window.CalorieServices || {};

window.CalorieServices.foodSearch = (function createFoodSearchService() {
  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function foodText(food) {
    return [food.id, food.name, ...(food.aliases || [])].join(" ").toLowerCase();
  }

  function matches(food, query) {
    const normalized = normalize(query);
    return normalized ? foodText(food).includes(normalized) : true;
  }

  function getCategory(food) {
    const text = foodText(food);
    const rules = window.CalorieData.categoryRules || [];
    const match = rules.find((rule) => rule.pattern.test(text));
    return match ? match.id : "other";
  }

  function getBestMatch(foods, query) {
    const normalized = normalize(query);
    if (!normalized) return undefined;

    return (
      foods.find((food) => normalize(food.name).startsWith(normalized)) ||
      foods.find((food) => (food.aliases || []).some((alias) => normalize(alias) === normalized)) ||
      foods.find((food) => matches(food, normalized))
    );
  }

  function filterFoods(foods, query, categoryId) {
    return foods.filter((food) => {
      const matchesCategory = categoryId === "all" || getCategory(food) === categoryId;
      return matchesCategory && matches(food, query);
    });
  }

  return {
    filterFoods,
    getBestMatch,
    getCategory,
    matches
  };
})();
