window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createPlannerController = function createPlannerController(options) {
  const { elements, formatNumber, getCurrentEntry } = options;
  const mealLabels = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "宵夜"
  };
  const mealLists = {
    breakfast: elements.breakfastList,
    lunch: elements.lunchList,
    dinner: elements.dinnerList,
    snack: elements.snackList
  };
  let selectedMeal = "breakfast";
  let plan = loadPlan();

  function loadPlan() {
    try {
      const saved = JSON.parse(localStorage.getItem("caloriePlan") || "{}");
      return {
        breakfast: saved.breakfast || [],
        lunch: saved.lunch || [],
        dinner: saved.dinner || [],
        snack: saved.snack || []
      };
    } catch {
      return { breakfast: [], lunch: [], dinner: [], snack: [] };
    }
  }

  function savePlan() {
    localStorage.setItem("caloriePlan", JSON.stringify(plan));
  }

  function getTarget() {
    const target = Number(elements.targetCalories.value);
    return Number.isFinite(target) && target > 0 ? target : 0;
  }

  function getTotal() {
    return Object.values(plan)
      .flat()
      .reduce((sum, entry) => sum + entry.calories, 0);
  }

  function renderMealList(mealId) {
    const list = mealLists[mealId];
    list.innerHTML = "";

    if (plan[mealId].length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty-meal";
      empty.textContent = `还没有添加${mealLabels[mealId]}。`;
      list.appendChild(empty);
      return;
    }

    plan[mealId].forEach((entry) => {
      const item = document.createElement("li");
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      const remove = document.createElement("button");
      const quantity = entry.quantityLabel || `${entry.grams || entry.baseAmount || 0}g`;
      const base = entry.baseAmount && entry.baseLabel
        ? ` · 约${formatNumber(entry.baseAmount)}${entry.baseLabel}`
        : "";

      title.textContent = entry.name;
      meta.textContent = `${quantity}${base} · ${formatNumber(entry.calories)} kcal`;
      remove.type = "button";
      remove.className = "remove-entry";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `删除${entry.name}`);
      remove.addEventListener("click", () => {
        plan[mealId] = plan[mealId].filter((current) => current.id !== entry.id);
        savePlan();
        render();
      });

      copy.append(title, meta);
      item.append(copy, remove);
      list.appendChild(item);
    });
  }

  function renderTotals() {
    const total = getTotal();
    const target = getTarget();
    const percent = target > 0 ? Math.min((total / target) * 100, 120) : 0;
    const isOver = target > 0 && total > target;

    elements.planTotal.textContent = `${formatNumber(total)} / ${formatNumber(target)} kcal`;
    elements.planTotalBadge.textContent = `${formatNumber(total)} kcal`;
    elements.planProgress.style.width = `${percent}%`;
    elements.planProgress.classList.toggle("over", isOver);
    elements.planWarning.hidden = !isOver;
  }

  function renderMealButtons() {
    elements.mealButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.meal === selectedMeal);
    });
  }

  function render() {
    Object.keys(mealLists).forEach(renderMealList);
    renderMealButtons();
    renderTotals();
  }

  function addCurrentEntry() {
    const entry = getCurrentEntry();
    if (!entry) return;
    plan[selectedMeal].push(entry);
    savePlan();
    render();
  }

  function addEntries(entries) {
    entries.forEach((entry, index) => {
      if (!plan[entry.meal]) return;
      plan[entry.meal].push({
        ...entry,
        id: `${Date.now()}-${entry.meal}-${entry.foodId}-${index}`
      });
    });
    savePlan();
    render();
  }

  elements.mealButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedMeal = button.dataset.meal;
      renderMealButtons();
    });
  });
  elements.addToPlan.addEventListener("click", addCurrentEntry);
  elements.targetCalories.addEventListener("input", renderTotals);

  return {
    addEntries,
    render
  };
};
