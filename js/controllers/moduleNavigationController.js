window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createModuleNavigationController = function createModuleNavigationController(options) {
  const { buttons } = options;
  const pages = buttons
    .map((button) => document.querySelector(`#${button.dataset.target}`))
    .filter(Boolean);
  const routes = {
    calculator: "calculatorSection",
    plan: "planSection",
    selector: "selectorSection",
    records: "recordsSection",
    library: "librarySection"
  };

  function getRouteName(targetId) {
    return Object.keys(routes).find((route) => routes[route] === targetId) || "calculator";
  }

  function getInitialTarget() {
    const routeName = window.location.hash.replace("#", "");
    return routes[routeName] || "calculatorSection";
  }

  function show(targetId, shouldUpdateHash = true) {
    const target = document.querySelector(`#${targetId}`) || document.querySelector("#calculatorSection");
    if (!target) return;

    pages.forEach((page) => {
      const isActive = page === target;
      page.hidden = !isActive;
      page.classList.toggle("active-page", isActive);
    });

    buttons.forEach((button) => {
      button.classList.toggle("active", button.dataset.target === target.id);
    });

    if (shouldUpdateHash) {
      window.history.pushState(null, "", `#${getRouteName(target.id)}`);
    }

  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => show(button.dataset.target));
  });

  window.addEventListener("hashchange", () => {
    show(getInitialTarget(), false);
  });

  show(getInitialTarget(), false);

  return {
    show
  };
};
