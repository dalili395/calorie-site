(function initApp() {
  const foods = window.CalorieData.foods || [];
  const categories = window.CalorieData.categories || [];
  const searchService = window.CalorieServices.foodSearch;
  const portionService = window.CalorieServices.portionService;
  const formatNumber = window.CalorieUtils.formatNumber;

  const elements = {
    foodSearch: document.querySelector("#foodSearch"),
    amount: document.querySelector("#amount"),
    unitSelect: document.querySelector("#unitSelect"),
    portionHint: document.querySelector("#portionHint"),
    matchName: document.querySelector("#matchName"),
    calories: document.querySelector("#calories"),
    foodCount: document.querySelector("#foodCount"),
    backToCategory: document.querySelector("#backToCategory"),
    categoryTabs: document.querySelector("#categoryTabs"),
    foodGrid: document.querySelector("#foodGrid"),
    moduleButtons: Array.from(document.querySelectorAll(".module-tile")),
    mealButtons: Array.from(document.querySelectorAll("#mealPicker button")),
    addToPlan: document.querySelector("#addToPlan"),
    targetCalories: document.querySelector("#targetCalories"),
    planTotal: document.querySelector("#planTotal"),
    planTotalBadge: document.querySelector("#planTotalBadge"),
    planProgress: document.querySelector("#planProgress"),
    planWarning: document.querySelector("#planWarning"),
    breakfastList: document.querySelector("#breakfastList"),
    lunchList: document.querySelector("#lunchList"),
    dinnerList: document.querySelector("#dinnerList"),
    snackList: document.querySelector("#snackList")
  };

  const calculator = window.CalorieControllers.createCalculatorController({
    foods,
    elements,
    searchService,
    portionService,
    formatNumber
  });

  const library = window.CalorieControllers.createLibraryController({
    foods,
    categories,
    elements,
    searchService,
    onFoodSelect: calculator.selectFood
  });

  window.CalorieControllers.createModuleNavigationController({
    buttons: elements.moduleButtons
  });

  const planner = window.CalorieControllers.createPlannerController({
    elements,
    formatNumber,
    getCurrentEntry: calculator.getEntry
  });

  elements.foodSearch.addEventListener("input", () => calculator.render());

  library.render();
  calculator.render();
  planner.render();
})();
