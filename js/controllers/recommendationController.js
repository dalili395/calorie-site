window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createRecommendationController = function createRecommendationController(options) {
  const {
    foods,
    categories,
    elements,
    searchService,
    portionService,
    formatNumber,
    onAddToPlan
  } = options;

  const mealLabels = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "宵夜"
  };
  const mealWeights = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.3,
    snack: 0.1
  };
  const mealOrder = ["breakfast", "lunch", "dinner", "snack"];
  const defaultCategories = ["chinese", "fastfood"];
  const categoryOptions = categories.filter((category) => category.id !== "all");
  const selectedCategories = new Set(
    defaultCategories.filter((categoryId) => categoryOptions.some((category) => category.id === categoryId))
  );
  const selectedMeals = new Set(["breakfast", "lunch", "dinner"]);
  let recommendations = [];

  function getBudget() {
    const budget = Number(elements.chooserBudget.value);
    return Number.isFinite(budget) && budget > 0 ? budget : 0;
  }

  function getSelectedMeals() {
    return mealOrder.filter((mealId) => selectedMeals.has(mealId));
  }

  function createEntry(food, meal) {
    const unit = portionService.getDefaultUnit(food);
    const amount = Number(unit.defaultAmount) || 1;
    const baseUnit = portionService.getBaseUnit(food);
    const baseAmount = portionService.getBaseAmount(food, amount, unit.id);
    const baseLabel = portionService.getBaseLabel(baseUnit);
    const calories = portionService.calculate(food, amount, unit.id);

    if (!Number.isFinite(calories) || calories <= 0) return undefined;

    return {
      id: `${Date.now()}-${meal}-${food.id}`,
      meal,
      foodId: food.id,
      name: food.name,
      amount,
      unitLabel: unit.label,
      baseAmount,
      baseLabel,
      quantityLabel: `${formatNumber(amount)}${unit.label}`,
      calories
    };
  }

  function getCandidates() {
    return foods
      .filter((food) => selectedCategories.has(searchService.getCategory(food)))
      .map((food) => createEntry(food, ""))
      .filter(Boolean);
  }

  function pickCandidate(candidates, maxCalories, usedFoodIds) {
    const unused = candidates.filter((entry) => entry.calories <= maxCalories && !usedFoodIds.has(entry.foodId));
    const fallback = candidates.filter((entry) => entry.calories <= maxCalories);
    const pool = unused.length > 0 ? unused : fallback;
    if (pool.length === 0) return undefined;

    const target = maxCalories * 0.72;
    const ranked = [...pool].sort((a, b) => Math.abs(a.calories - target) - Math.abs(b.calories - target));
    const top = ranked.slice(0, Math.min(8, ranked.length));
    return top[Math.floor(Math.random() * top.length)];
  }

  function getMealBudget(totalBudget, meals, meal) {
    const totalWeight = meals.reduce((sum, mealId) => sum + mealWeights[mealId], 0);
    return totalWeight > 0 ? totalBudget * (mealWeights[meal] / totalWeight) : totalBudget;
  }

  function setStatus(message, type = "") {
    elements.chooserStatus.textContent = message;
    elements.chooserStatus.classList.toggle("error", type === "error");
  }

  function renderCategoryChoices() {
    elements.chooserCategories.innerHTML = "";

    categoryOptions.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = selectedCategories.has(category.id) ? "active" : "";
      button.textContent = category.label;
      button.addEventListener("click", () => {
        if (selectedCategories.has(category.id)) {
          selectedCategories.delete(category.id);
        } else {
          selectedCategories.add(category.id);
        }
        renderCategoryChoices();
      });
      elements.chooserCategories.appendChild(button);
    });
  }

  function renderMealChoices() {
    elements.chooserMeals.forEach((button) => {
      button.classList.toggle("active", selectedMeals.has(button.dataset.meal));
    });
  }

  function renderResults() {
    const total = recommendations.reduce((sum, entry) => sum + entry.calories, 0);
    elements.recommendationResult.innerHTML = "";
    elements.recommendationSummary.hidden = recommendations.length === 0;
    elements.addRecommendationToPlan.hidden = recommendations.length === 0;

    if (recommendations.length === 0) {
      elements.recommendationSummary.textContent = "0 kcal";
      return;
    }

    elements.recommendationSummary.textContent = `${formatNumber(total)} kcal`;

    recommendations.forEach((entry) => {
      const card = document.createElement("article");
      const meal = document.createElement("span");
      const name = document.createElement("strong");
      const portion = document.createElement("p");
      const calories = document.createElement("em");

      card.className = "recommendation-card";
      meal.className = "meal-tag";
      meal.textContent = mealLabels[entry.meal];
      name.textContent = entry.name;
      portion.textContent = `${entry.quantityLabel} · 约 ${formatNumber(entry.baseAmount)}${entry.baseLabel}`;
      calories.textContent = `${formatNumber(entry.calories)} kcal`;

      card.append(meal, name, portion, calories);
      elements.recommendationResult.appendChild(card);
    });
  }

  function generate() {
    const budget = getBudget();
    const meals = getSelectedMeals();
    const candidates = getCandidates();
    const usedFoodIds = new Set();
    let remainingBudget = budget;

    recommendations = [];

    if (budget <= 0) {
      setStatus("请输入大于 0 的热量预算。", "error");
      renderResults();
      return;
    }
    if (selectedCategories.size === 0) {
      setStatus("请至少选择一个想吃的品类。", "error");
      renderResults();
      return;
    }
    if (meals.length === 0) {
      setStatus("请至少选择一个餐次。", "error");
      renderResults();
      return;
    }
    if (candidates.length === 0) {
      setStatus("当前品类里没有可推荐的食物。", "error");
      renderResults();
      return;
    }

    meals.forEach((meal) => {
      const mealBudget = Math.min(remainingBudget, getMealBudget(budget, meals, meal));
      const entry = pickCandidate(candidates, mealBudget, usedFoodIds) || pickCandidate(candidates, remainingBudget, usedFoodIds);
      if (!entry) return;

      const mealEntry = { ...entry, meal };
      recommendations.push(mealEntry);
      usedFoodIds.add(entry.foodId);
      remainingBudget -= entry.calories;
    });

    if (recommendations.length === 0) {
      setStatus("当前预算太低，没有找到不超标的推荐。", "error");
      renderResults();
      return;
    }

    const total = recommendations.reduce((sum, entry) => sum + entry.calories, 0);
    const skippedMeals = meals.length - recommendations.length;
    const suffix = skippedMeals > 0 ? `，有 ${skippedMeals} 个餐次因预算太低未推荐` : "";
    setStatus(`已推荐 ${recommendations.length} 个餐次，总热量 ${formatNumber(total)} kcal，未超过预算${suffix}。`);
    renderResults();
  }

  function addRecommendationsToPlan() {
    if (recommendations.length === 0) return;
    onAddToPlan(recommendations);
    setStatus("推荐结果已加入今日计划。");
  }

  elements.chooserMeals.forEach((button) => {
    button.addEventListener("click", () => {
      if (selectedMeals.has(button.dataset.meal)) {
        selectedMeals.delete(button.dataset.meal);
      } else {
        selectedMeals.add(button.dataset.meal);
      }
      renderMealChoices();
    });
  });
  elements.generateRecommendation.addEventListener("click", generate);
  elements.addRecommendationToPlan.addEventListener("click", addRecommendationsToPlan);

  function render() {
    renderCategoryChoices();
    renderMealChoices();
    renderResults();
  }

  return {
    render
  };
};
