window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createMetabolismController = function createMetabolismController(options) {
  const { elements, formatNumber, getCurrentEntry, backendApi } = options;
  const storageKey = "calorieDiffRecords";
  let renderToken = 0;
  let lastResult = {
    calories: 0,
    tefFactor: 0.93,
    bmr: 0,
    dailyFactor: 1.2,
    metabolism: 0,
    difference: 0,
    status: "还需加油哦"
  };

  function formatLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getToday() {
    return formatLocalDate();
  }

  function getPositiveNumber(element) {
    const value = Number(element.value);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function getMinutes(element) {
    const value = Number(element.value);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function calculateActivityCalories(met, weightKg, minutes) {
    // MET energy estimate: kcal = MET * 3.5 * body weight kg / 200 * minutes.
    return met * 3.5 * weightKg * minutes / 200;
  }

  function calculateMetabolism() {
    const weightKg = getPositiveNumber(elements.bodyWeight);
    const walking = calculateActivityCalories(Number(elements.walkMet.value), weightKg, getMinutes(elements.walkMinutes));
    const cycling = calculateActivityCalories(Number(elements.bikeMet.value), weightKg, getMinutes(elements.bikeMinutes));
    const custom = getPositiveNumber(elements.customExerciseCalories);
    return walking + cycling + custom;
  }

  function calculateBmr() {
    const sexOffset = elements.biologicalSex.value === "male" ? 5 : -161;
    return 10 * getPositiveNumber(elements.bodyWeight)
      + 6.25 * getPositiveNumber(elements.heightCm)
      - 5 * getPositiveNumber(elements.ageYears)
      + sexOffset;
  }

  function getPayload() {
    const calories = getCurrentCalories();
    const metabolism = calculateMetabolism();
    const bmr = calculateBmr();
    const tefFactor = getPositiveNumber(elements.tefFactor) || 0.93;
    const dailyFactor = getPositiveNumber(elements.dailyFactor) || 1.2;
    return {
      date: elements.recordDate.value || getToday(),
      intakeCalories: calories,
      tefFactor,
      sex: elements.biologicalSex.value,
      age: getPositiveNumber(elements.ageYears),
      heightCm: getPositiveNumber(elements.heightCm),
      weightKg: getPositiveNumber(elements.bodyWeight),
      dailyFactor,
      exerciseCalories: metabolism,
      bmr
    };
  }

  function loadRecords() {
    try {
      const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(records) ? records : [];
    } catch {
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(storageKey, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent("calorie-records-updated"));
  }

  function getCurrentCalories() {
    const entry = getCurrentEntry();
    return entry ? entry.calories : 0;
  }

  function applyResult(result) {
    lastResult = {
      calories: result.intake,
      tefFactor: result.tefFactor,
      bmr: result.bmr,
      dailyFactor: result.dailyFactor,
      metabolism: result.exercise,
      difference: result.difference,
      status: result.status
    };
    elements.comparisonCalories.textContent = formatNumber(result.intake);
    elements.bmrValue.textContent = formatNumber(result.bmr);
    elements.metabolismValue.textContent = formatNumber(result.exercise);
    elements.calorieDifference.textContent = formatNumber(result.difference);
    elements.metabolismStatus.textContent = result.status;
    elements.metabolismStatus.classList.toggle("positive", result.difference < 0);
    elements.metabolismStatus.classList.toggle("negative", result.difference >= 0);
  }

  function calculateLocal(payload) {
    const difference = payload.intakeCalories * payload.tefFactor
      - payload.bmr * payload.dailyFactor
      - payload.exerciseCalories;
    return {
      intake: payload.intakeCalories,
      tefFactor: payload.tefFactor,
      bmr: payload.bmr,
      dailyFactor: payload.dailyFactor,
      exercise: payload.exerciseCalories,
      difference,
      status: difference < 0 ? "今天瘦了" : "还需加油哦"
    };
  }

  function render() {
    const token = ++renderToken;
    const payload = getPayload();
    applyResult(calculateLocal(payload));

    if (!backendApi) return;
    backendApi.calculateDifference(payload)
      .then((result) => {
        if (token === renderToken) applyResult(result);
      })
      .catch(() => {});
  }

  function saveDailyRecord() {
    const date = elements.recordDate.value || getToday();
    const records = loadRecords().filter((record) => record.date !== date);
    records.push({
      date,
      calories: lastResult.calories,
      tefFactor: lastResult.tefFactor,
      bmr: lastResult.bmr,
      dailyFactor: lastResult.dailyFactor,
      metabolism: lastResult.metabolism,
      difference: lastResult.difference,
      status: lastResult.status,
      savedAt: new Date().toISOString()
    });
    records.sort((a, b) => a.date.localeCompare(b.date));
    saveRecords(records);
    if (backendApi) {
      backendApi.saveRecord(getPayload()).catch(() => {});
    }
    elements.metabolismStatus.textContent = "已保存";
  }

  function setCustomExercises(exercises) {
    elements.customExerciseSelect.innerHTML = '<option value="">不使用自定义</option>';
    exercises.forEach((exercise) => {
      const option = document.createElement("option");
      option.value = String(exercise.calories);
      option.textContent = `${exercise.name} · ${formatNumber(exercise.calories)} kcal`;
      elements.customExerciseSelect.appendChild(option);
    });
  }

  [
    elements.bodyWeight,
    elements.biologicalSex,
    elements.ageYears,
    elements.heightCm,
    elements.dailyFactor,
    elements.tefFactor,
    elements.walkMinutes,
    elements.walkMet,
    elements.bikeMinutes,
    elements.bikeMet,
    elements.customExerciseCalories,
    elements.customExerciseSelect
  ].forEach((element) => {
    element.addEventListener("input", render);
    element.addEventListener("change", render);
  });
  elements.customExerciseSelect.addEventListener("change", () => {
    elements.customExerciseCalories.value = elements.customExerciseSelect.value || "0";
    render();
  });
  elements.saveDailyRecord.addEventListener("click", saveDailyRecord);
  elements.recordDate.value = getToday();

  return {
    render,
    setCustomExercises
  };
};
