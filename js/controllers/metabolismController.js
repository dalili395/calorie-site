window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createMetabolismController = function createMetabolismController(options) {
  const { elements, formatNumber, getCurrentEntry } = options;
  const storageKey = "calorieDiffRecords";
  let lastResult = {
    calories: 0,
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
    return walking + cycling;
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

  function render() {
    const calories = getCurrentCalories();
    const metabolism = calculateMetabolism();
    const difference = metabolism - calories;
    const status = difference > 0 ? "今天瘦了" : "还需加油哦";

    lastResult = { calories, metabolism, difference, status };
    elements.comparisonCalories.textContent = formatNumber(calories);
    elements.metabolismValue.textContent = formatNumber(metabolism);
    elements.calorieDifference.textContent = formatNumber(difference);
    elements.metabolismStatus.textContent = status;
    elements.metabolismStatus.classList.toggle("positive", difference > 0);
    elements.metabolismStatus.classList.toggle("negative", difference <= 0);
  }

  function saveDailyRecord() {
    const date = elements.recordDate.value || getToday();
    const records = loadRecords().filter((record) => record.date !== date);
    records.push({
      date,
      calories: lastResult.calories,
      metabolism: lastResult.metabolism,
      difference: lastResult.difference,
      status: lastResult.status,
      savedAt: new Date().toISOString()
    });
    records.sort((a, b) => a.date.localeCompare(b.date));
    saveRecords(records);
    elements.metabolismStatus.textContent = "已保存";
  }

  [
    elements.bodyWeight,
    elements.walkMinutes,
    elements.walkMet,
    elements.bikeMinutes,
    elements.bikeMet
  ].forEach((element) => {
    element.addEventListener("input", render);
    element.addEventListener("change", render);
  });
  elements.saveDailyRecord.addEventListener("click", saveDailyRecord);
  elements.recordDate.value = getToday();

  return {
    render
  };
};
