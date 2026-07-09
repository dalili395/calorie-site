window.CalorieServices = window.CalorieServices || {};

window.CalorieServices.backendApi = (function createBackendApi() {
  const baseKey = "calorieApiBase";
  const passwordKey = "calorieCollabPassword";
  const defaultBase = "http://127.0.0.1:8787";

  function getBaseUrl() {
    return localStorage.getItem(baseKey) || defaultBase;
  }

  function setBaseUrl(value) {
    localStorage.setItem(baseKey, value || defaultBase);
  }

  function getPassword() {
    return sessionStorage.getItem(passwordKey) || "";
  }

  function setPassword(value) {
    sessionStorage.setItem(passwordKey, value || "");
  }

  async function request(path, options = {}) {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.password ? { "X-Collab-Password": options.password } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "后端请求失败");
    }
    return data;
  }

  function getCustomFoods() {
    return request("/api/custom-foods").then((data) => data.foods || []);
  }

  function createCustomFood(payload, password = getPassword()) {
    return request("/api/custom-foods", {
      method: "POST",
      password,
      body: JSON.stringify(payload)
    }).then((data) => data.food);
  }

  function getCustomExercises() {
    return request("/api/custom-exercises").then((data) => data.exercises || []);
  }

  function createCustomExercise(payload, password = getPassword()) {
    return request("/api/custom-exercises", {
      method: "POST",
      password,
      body: JSON.stringify(payload)
    }).then((data) => data.exercise);
  }

  function calculateDifference(payload) {
    return request("/api/calculate-difference", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  function saveRecord(payload) {
    return request("/api/records", {
      method: "POST",
      body: JSON.stringify(payload)
    }).then((data) => data.record);
  }

  function getRecords(start, end) {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const query = params.toString();
    return request(`/api/records${query ? `?${query}` : ""}`).then((data) => data.records || []);
  }

  function auth(password) {
    return request("/api/auth", {
      method: "POST",
      body: JSON.stringify({ password })
    }).then((data) => {
      if (data.ok) setPassword(password);
      return data.ok;
    });
  }

  return {
    auth,
    calculateDifference,
    createCustomExercise,
    createCustomFood,
    getBaseUrl,
    getCustomExercises,
    getCustomFoods,
    getPassword,
    getRecords,
    saveRecord,
    setBaseUrl,
    setPassword
  };
})();
