window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createLibraryController = function createLibraryController(options) {
  const { foods, categories, elements, searchService, onFoodSelect } = options;
  let activeCategory = "all";
  let activeSource = "all";
  let selectedFoodId = "";
  let returnCategory = "all";

  function setActiveCategoryFromQuery() {
    const query = elements.foodSearch.value.trim();
    const bestMatch = searchService.getBestMatch(foods, query);
    if (!query) {
      activeCategory = "all";
      selectedFoodId = "";
      return;
    }
    if (bestMatch) {
      activeCategory = searchService.getCategory(bestMatch);
      selectedFoodId = bestMatch.id;
    }
  }

  function renderTabs() {
    elements.categoryTabs.innerHTML = "";

    categories.forEach((category) => {
      const count = category.id === "all"
        ? foods.length
        : foods.filter((food) => searchService.getCategory(food) === category.id).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = category.id === activeCategory ? "active" : "";
      button.textContent = `${category.label} ${count}`;
      button.addEventListener("click", () => {
        activeCategory = category.id;
        selectedFoodId = "";
        render();
      });
      elements.categoryTabs.appendChild(button);
    });
  }

  function getCategoryLabel(categoryId) {
    return categories.find((category) => category.id === categoryId)?.label || "分类";
  }

  function renderBackButton() {
    const hasQuery = Boolean(elements.foodSearch.value.trim());
    elements.backToCategory.hidden = !hasQuery;
    elements.backToCategory.textContent = `返回${getCategoryLabel(returnCategory)}`;
  }

  function createFoodCard(food) {
    const card = document.createElement("button");
    const name = document.createElement("strong");
    const calories = document.createElement("span");
    card.type = "button";
    const sourceType = food.sourceType === "custom" ? "custom" : "system";
    card.className = food.id === selectedFoodId ? `food-card selected ${sourceType}` : `food-card ${sourceType}`;
    card.dataset.foodId = food.id;
    name.textContent = food.name;
    calories.textContent = food.unit === "serving"
      ? `${food.calories} kcal / 份 · 自定义`
      : `${food.calories} kcal / 100g · 系统`;
    card.append(name, calories);
    card.addEventListener("click", () => {
      returnCategory = activeCategory === "all" ? searchService.getCategory(food) : activeCategory;
      selectedFoodId = food.id;
      onFoodSelect(food);
      setActiveCategoryFromQuery();
      render();
    });
    return card;
  }

  function scrollToSelected() {
    if (!selectedFoodId) return;
    const selected = elements.foodGrid.querySelector(`[data-food-id="${selectedFoodId}"]`);
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }

  function renderGrid() {
    const visibleFoods = searchService
      .filterFoods(foods, elements.foodSearch.value, activeCategory)
      .filter((food) => activeSource === "all" || (food.sourceType || "system") === activeSource);
    elements.foodCount.textContent = `${foods.length} 种`;
    elements.foodGrid.innerHTML = "";

    if (visibleFoods.length === 0) {
      const empty = document.createElement("p");
      empty.className = "no-foods";
      empty.textContent = "当前分类里没有匹配食物。";
      elements.foodGrid.appendChild(empty);
      return;
    }

    visibleFoods.forEach((food) => {
      elements.foodGrid.appendChild(createFoodCard(food));
    });

    window.requestAnimationFrame(scrollToSelected);
  }

  function render() {
    renderTabs();
    renderBackButton();
    renderSourceFilters();
    renderGrid();
  }

  function renderSourceFilters() {
    elements.sourceFilterButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.source === activeSource);
    });
  }

  function handleSearchInput() {
    setActiveCategoryFromQuery();
    if (selectedFoodId && elements.foodSearch.value.trim()) {
      const selectedFood = foods.find((food) => food.id === selectedFoodId);
      returnCategory = selectedFood ? searchService.getCategory(selectedFood) : activeCategory;
    }
    render();
  }

  function backToCategory() {
    elements.foodSearch.value = "";
    activeCategory = returnCategory;
    selectedFoodId = "";
    elements.foodSearch.dispatchEvent(new Event("input", { bubbles: true }));
    activeCategory = returnCategory;
    render();
  }

  elements.foodSearch.addEventListener("input", handleSearchInput);
  elements.backToCategory.addEventListener("click", backToCategory);
  elements.sourceFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeSource = button.dataset.source;
      render();
    });
  });

  return {
    render
  };
};
