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
    snackList: document.querySelector("#snackList"),
    chooserBudget: document.querySelector("#chooserBudget"),
    chooserCategories: document.querySelector("#chooserCategories"),
    chooserMeals: Array.from(document.querySelectorAll("#chooserMeals button")),
    chooserStatus: document.querySelector("#chooserStatus"),
    generateRecommendation: document.querySelector("#generateRecommendation"),
    recommendationSummary: document.querySelector("#recommendationSummary"),
    recommendationResult: document.querySelector("#recommendationResult"),
    addRecommendationToPlan: document.querySelector("#addRecommendationToPlan")
  };

  const calculator = window.CalorieControllers.createCalculatorController({
    foods,
    elements,
    searchService,
    portionService,
    formatNumber
  });

  const navigation = window.CalorieControllers.createModuleNavigationController({
    buttons: elements.moduleButtons
  });

  const library = window.CalorieControllers.createLibraryController({
    foods,
    categories,
    elements,
    searchService,
    onFoodSelect: (food) => {
      calculator.selectFood(food);
      navigation.show("calculatorSection");
    }
  });

  const planner = window.CalorieControllers.createPlannerController({
    elements,
    formatNumber,
    getCurrentEntry: calculator.getEntry
  });

  const recommender = window.CalorieControllers.createRecommendationController({
    foods,
    categories,
    elements,
    searchService,
    portionService,
    formatNumber,
    onAddToPlan: planner.addEntries
  });

  elements.foodSearch.addEventListener("input", () => calculator.render());

  library.render();
  calculator.render();
  planner.render();
  recommender.render();
})();
