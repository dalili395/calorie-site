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
  let customFoods = [];
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

  function removeCustomFood(id) {
    const index = foods.findIndex((food) => food.id === id && food.sourceType === "custom");
    if (index >= 0) foods.splice(index, 1);
  }

  function replaceCustomFoods(nextFoods) {
    for (let index = foods.length - 1; index >= 0; index -= 1) {
      if (foods[index].sourceType === "custom") foods.splice(index, 1);
    }
    customFoods = nextFoods;
    customFoods.forEach(addCustomFood);
    onFoodsChange();
    renderFoodList();
  }

  function renderExerciseOptions() {
    onExercisesChange(customExercises);
  }

  function renderFoodList() {
    elements.customFoodCount.textContent = `${customFoods.length} 个`;
    elements.customFoodList.innerHTML = "";

    if (customFoods.length === 0) {
      elements.customFoodList.innerHTML = '<p class="empty-chart">还没有自定义食物。</p>';
      return;
    }

    customFoods.forEach((food) => {
      const item = document.createElement("article");
      const content = document.createElement("div");
      const name = document.createElement("strong");
      const meta = document.createElement("span");
      const button = document.createElement("button");

      item.className = "collab-item";
      name.textContent = food.name;
      meta.textContent = `${formatNumber(food.calories)} kcal / 份`;
      button.className = "danger-action";
      button.type = "button";
      button.textContent = "删除";
      button.addEventListener("click", () => deleteFood(food));

      content.append(name, meta);
      item.append(content, button);
      elements.customFoodList.appendChild(item);
    });
  }

  function renderExerciseList() {
    elements.customExerciseCount.textContent = `${customExercises.length} 个`;
    elements.customExerciseList.innerHTML = "";

    if (customExercises.length === 0) {
      elements.customExerciseList.innerHTML = '<p class="empty-chart">还没有自定义运动。</p>';
      return;
    }

    customExercises.forEach((exercise) => {
      const item = document.createElement("article");
      const content = document.createElement("div");
      const name = document.createElement("strong");
      const meta = document.createElement("span");
      const button = document.createElement("button");

      item.className = "collab-item";
      name.textContent = exercise.name;
      meta.textContent = `${formatNumber(exercise.calories)} kcal`;
      button.className = "danger-action";
      button.type = "button";
      button.textContent = "删除";
      button.addEventListener("click", () => deleteExercise(exercise));

      content.append(name, meta);
      item.append(content, button);
      elements.customExerciseList.appendChild(item);
    });
  }

  function loadSharedData() {
    elements.apiBaseUrl.value = backendApi.getBaseUrl();
    Promise.all([
      backendApi.getCustomFoods(),
      backendApi.getCustomExercises()
    ]).then(([nextFoods, exercises]) => {
      replaceCustomFoods(nextFoods);
      customExercises = exercises;
      renderExerciseOptions();
      renderExerciseList();
      setBackendStatus("云端 API 已连接", true);
      setMessage(`已加载 ${nextFoods.length} 个自定义食物，${exercises.length} 个自定义运动。`);
    }).catch(() => {
      setBackendStatus("云端 API 未连接", false);
      setMessage("云端 API 或 D1 还没有配置完成时，系统食物仍可使用；共创数据需要配置后同步。");
    });
  }

  function login() {
    const password = elements.collabPassword.value.trim();
    backendApi.setBaseUrl(elements.apiBaseUrl.value.trim());

    if (!password) {
      elements.collabForms.hidden = true;
      backendApi.setPassword("");
      setMessage("请先输入共创密码。", "error");
      return;
    }

    backendApi.auth(password)
      .then((ok) => {
        elements.collabForms.hidden = !ok;
        if (!ok) {
          backendApi.setPassword("");
          setMessage("密码不正确，或 Cloudflare 还没有设置 CALORIE_COLLAB_PASSWORD。", "error");
          return;
        }
        setMessage("已进入共创模式，可以新增或删除自定义数据。");
        loadSharedData();
      })
      .catch(() => {
        elements.collabForms.hidden = true;
        backendApi.setPassword("");
        setBackendStatus("云端 API 未连接", false);
        setMessage("无法连接云端 API，请先完成 Cloudflare D1 绑定并重新部署。", "error");
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
        customFoods.unshift(food);
        addCustomFood(food);
        onFoodsChange();
        renderFoodList();
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
        renderExerciseList();
        elements.customExerciseName.value = "";
        elements.customExerciseSavedCalories.value = "";
        setMessage(`已保存：${exercise.name}，${formatNumber(exercise.calories)} kcal。`);
      })
      .catch((error) => setMessage(error.message, "error"));
  }

  function deleteFood(food) {
    if (!window.confirm(`确定删除「${food.name}」吗？`)) return;
    backendApi.deleteCustomFood(food.id)
      .then(() => {
        customFoods = customFoods.filter((current) => current.id !== food.id);
        removeCustomFood(food.id);
        onFoodsChange();
        renderFoodList();
        setMessage(`已删除：${food.name}`);
      })
      .catch((error) => setMessage(error.message, "error"));
  }

  function deleteExercise(exercise) {
    if (!window.confirm(`确定删除「${exercise.name}」吗？`)) return;
    backendApi.deleteCustomExercise(exercise.id)
      .then(() => {
        customExercises = customExercises.filter((current) => current.id !== exercise.id);
        renderExerciseOptions();
        renderExerciseList();
        setMessage(`已删除：${exercise.name}`);
      })
      .catch((error) => setMessage(error.message, "error"));
  }

  elements.collabForms.hidden = true;
  backendApi.setPassword("");
  renderFoodList();
  renderExerciseList();
  elements.collabLogin.addEventListener("click", login);
  elements.saveCustomFood.addEventListener("click", saveFood);
  elements.saveCustomExercise.addEventListener("click", saveExercise);

  return {
    loadSharedData
  };
};
