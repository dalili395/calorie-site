window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createCalculatorController = function createCalculatorController(options) {
  const { foods, elements, searchService, portionService, formatNumber, onEntryChange } = options;
  let currentFood;
  let currentFoodId = "";

  function getAmount() {
    const amount = Number(elements.amount.value);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
  }

  function renderUnitOptions(food) {
    const units = portionService.getUnits(food);
    const defaultUnit = portionService.getDefaultUnit(food);
    elements.unitSelect.innerHTML = "";

    units.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit.id;
      option.textContent = unit.label;
      elements.unitSelect.appendChild(option);
    });

    elements.unitSelect.value = defaultUnit.id;
    elements.amount.value = defaultUnit.defaultAmount;
  }

  function syncFood(food) {
    if (!food || currentFoodId === food.id) return;
    currentFoodId = food.id;
    renderUnitOptions(food);
  }

  function getEntry() {
    if (!currentFood) return undefined;
    const amount = getAmount();
    const unit = portionService.getUnit(currentFood, elements.unitSelect.value);
    const baseUnit = portionService.getBaseUnit(currentFood);
    const baseAmount = portionService.getBaseAmount(currentFood, amount, unit.id);
    const baseLabel = portionService.getBaseLabel(baseUnit);
    return {
      id: `${Date.now()}-${currentFood.id}`,
      foodId: currentFood.id,
      name: currentFood.name,
      amount,
      unitLabel: unit.label,
      baseAmount,
      baseLabel,
      quantityLabel: `${formatNumber(amount)}${unit.label}`,
      calories: portionService.calculate(currentFood, amount, unit.id)
    };
  }

  function notifyEntryChange() {
    if (typeof onEntryChange === "function") {
      onEntryChange(getEntry());
    }
  }

  function render(food = searchService.getBestMatch(foods, elements.foodSearch.value)) {
    currentFood = food;

    if (!food) {
      currentFoodId = "";
      elements.matchName.textContent = elements.foodSearch.value.trim() ? "暂未收录这个食物" : "请输入食物名称";
      elements.calories.textContent = "0";
      elements.unitSelect.innerHTML = "";
      elements.portionHint.textContent = "选择食物后显示换算";
      notifyEntryChange();
      return;
    }

    syncFood(food);

    const amount = getAmount();
    const unit = portionService.getUnit(food, elements.unitSelect.value);
    const baseUnit = portionService.getBaseUnit(food);
    const baseAmount = portionService.getBaseAmount(food, amount, unit.id);
    const baseLabel = portionService.getBaseLabel(baseUnit);
    const calories = portionService.calculate(food, amount, unit.id);
    const baseUnitText = baseUnit === "ml" ? "100 毫升" : baseUnit === "serving" ? "1 份" : "100 克";
    const amountText = unit.id === baseUnit
      ? `${formatNumber(amount)}${unit.label}`
      : `${formatNumber(amount)}${unit.label} ≈ ${formatNumber(baseAmount)}${baseLabel}`;

    elements.matchName.textContent = `${food.name} · 每 ${baseUnitText} ${food.calories} kcal`;
    elements.portionHint.textContent = amountText;
    elements.calories.textContent = formatNumber(calories);
    notifyEntryChange();
  }

  function selectFood(food) {
    elements.foodSearch.value = food.name;
    render(food);
  }

  elements.amount.addEventListener("input", () => render());
  elements.unitSelect.addEventListener("change", () => {
    const unit = currentFood ? portionService.getUnit(currentFood, elements.unitSelect.value) : undefined;
    if (unit) elements.amount.value = unit.defaultAmount;
    render();
  });

  return {
    getEntry,
    render,
    selectFood
  };
};
