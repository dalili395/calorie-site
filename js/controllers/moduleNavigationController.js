window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createModuleNavigationController = function createModuleNavigationController(options) {
  const { buttons } = options;

  function activate(button) {
    const target = document.querySelector(`#${button.dataset.target}`);
    buttons.forEach((current) => current.classList.toggle("active", current === button));
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("highlight");
    window.setTimeout(() => target.classList.remove("highlight"), 800);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => activate(button));
  });
};
