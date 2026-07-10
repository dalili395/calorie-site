window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createFeedbackController = function createFeedbackController(options) {
  const { toast } = options;
  let hideTimer;

  function pulse(element) {
    if (!element) return;
    element.classList.remove("feedback-pulse");
    void element.offsetWidth;
    element.classList.add("feedback-pulse");
  }

  function show(message, type = "success") {
    if (!toast || !message) return;
    window.clearTimeout(hideTimer);
    toast.textContent = message;
    toast.className = `app-toast ${type}`;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("visible"));
    hideTimer = window.setTimeout(() => {
      toast.classList.remove("visible");
      window.setTimeout(() => {
        toast.hidden = true;
      }, 220);
    }, 2200);
  }

  return {
    pulse,
    show
  };
};
