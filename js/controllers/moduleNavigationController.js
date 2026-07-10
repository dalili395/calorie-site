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
    collab: "collabSection",
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
    const scrollPosition = window.scrollY;

    pages.forEach((page) => {
      const isActive = page === target;
      page.hidden = !isActive;
      page.classList.toggle("active-page", isActive);
      if (!isActive) page.style.minHeight = "";
    });

    if (scrollPosition > 0) {
      const requiredHeight = window.innerHeight + scrollPosition - target.offsetTop;
      target.style.minHeight = `${Math.max(requiredHeight, 0)}px`;
    } else {
      target.style.minHeight = "";
    }

    buttons.forEach((button) => {
      const isActive = button.dataset.target === target.id;
      button.classList.toggle("active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    const activeButton = buttons.find((button) => button.dataset.target === target.id);
    const pageName = activeButton ? activeButton.querySelector("strong").textContent : "热量计算";
    document.title = `${pageName} · 热量计算`;

    if (shouldUpdateHash) {
      window.history.pushState(null, "", `#${getRouteName(target.id)}`);
    }

    requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
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
