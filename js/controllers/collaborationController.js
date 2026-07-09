window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createCollaborationController = function createCollaborationController(options) {
  const {
    foods,
    elements,
    backendApi,
    formatNumber,
    onFoodsChange,
    onExercisesChange
  } = options;
  let customExercises = [];

  function setMessage(message, type = "") {
    elements.collabMessage.textContent = message;
    elements.collabMessage.classList.toggle("error", type === "error");
  }

  function setBackendStatus(text, isReady) {
    elements.backendStatus.textContent = text;
    elements.backendStatus.classList.toggle("positive", Boolean(isReady));
    elements.backendStatus.classList.toggle("negative", !isReady);
  }

  function addCustomFood(food) {
    if (!food || foods.some((current) => current.id === food.id)) return;
    foods.push({ sourceType: "custom", unit: "serving", ...food });
  }

  function replaceCustomFoods(customFoods) {
    for (let index = foods.length - 1; index >= 0; index -= 1) {
      if (foods[index].sourceType === "custom") foods.splice(index, 1);
    }
    customFoods.forEach(addCustomFood);
    onFoodsChange();
  }

  function renderExerciseOptions() {
    onExercisesChange(customExercises);
  }

  function loadSharedData() {
    elements.apiBaseUrl.value = backendApi.getBaseUrl();
    Promise.all([
      backendApi.getCustomFoods(),
      backendApi.getCustomExercises()
    ]).then(([customFoods, exercises]) => {
      replaceCustomFoods(customFoods);
      customExercises = exercises;
      renderExerciseOptions();
      setBackendStatus("后端已连接", true);
      setMessage(`已加载 ${customFoods.length} 个自定义食物，${exercises.length} 个自定义运动。`);
    }).catch(() => {
      setBackendStatus("未连接后端", false);
      setMessage("Python 后端未启动时，系统数据仍可使用；共创数据需启动后端后同步。");
    });
  }

  function login() {
    backendApi.setBaseUrl(elements.apiBaseUrl.value.trim());
    backendApi.auth(elements.collabPassword.value)
      .then((ok) => {
        elements.collabForms.hidden = !ok;
        if (!ok) {
          setMessage("密码不正确。", "error");
          return;
        }
        setMessage("已进入共创模式，可以保存自定义数据。");
        loadSharedData();
      })
      .catch(() => {
        elements.collabForms.hidden = true;
        setBackendStatus("未连接后端", false);
        setMessage("无法连接 Python 后端，请先启动 backend/app.py。", "error");
      });
  }

  function saveFood() {
    const name = elements.customFoodName.value.trim();
    const calories = Number(elements.customFoodCalories.value);
    if (!name || !Number.isFinite(calories) || calories <= 0) {
      setMessage("请填写食物名称和大于 0 的热量。", "error");
      return;
    }
    backendApi.createCustomFood({ name, calories, unit: "serving" })
      .then((food) => {
        addCustomFood(food);
        onFoodsChange();
        elements.customFoodName.value = "";
        elements.customFoodCalories.value = "";
        setMessage(`已保存：${food.name}，${formatNumber(food.calories)} kcal / 份。`);
      })
      .catch((error) => setMessage(error.message, "error"));
  }

  function saveExercise() {
    const name = elements.customExerciseName.value.trim();
    const calories = Number(elements.customExerciseSavedCalories.value);
    if (!name || !Number.isFinite(calories) || calories <= 0) {
      setMessage("请填写运动名称和大于 0 的消耗热量。", "error");
      return;
    }
    backendApi.createCustomExercise({ name, calories })
      .then((exercise) => {
        customExercises.unshift(exercise);
        renderExerciseOptions();
        elements.customExerciseName.value = "";
        elements.customExerciseSavedCalories.value = "";
        setMessage(`已保存：${exercise.name}，${formatNumber(exercise.calories)} kcal。`);
      })
      .catch((error) => setMessage(error.message, "error"));
  }

  elements.collabLogin.addEventListener("click", login);
  elements.saveCustomFood.addEventListener("click", saveFood);
  elements.saveCustomExercise.addEventListener("click", saveExercise);

  return {
    loadSharedData
  };
};
