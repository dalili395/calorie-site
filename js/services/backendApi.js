window.CalorieServices = window.CalorieServices || {};

window.CalorieServices.backendApi = (function createBackendApi() {
  const baseKey = "calorieApiBase";
  const defaultBase = "";
  let activePassword = "";

  function isLocalPage() {
    return ["", "localhost", "127.0.0.1"].includes(window.location.hostname)
      || window.location.protocol === "file:";
  }

  function isLegacyLocalBase(value) {
    return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(value || "");
  }

  function getBaseUrl() {
    const saved = localStorage.getItem(baseKey);
    if (saved && !(isLegacyLocalBase(saved) && !isLocalPage())) return saved;
    return defaultBase;
  }

  function setBaseUrl(value) {
    const nextValue = (value || "").trim();
    if (nextValue) {
      localStorage.setItem(baseKey, nextValue);
    } else {
      localStorage.removeItem(baseKey);
    }
  }

  function getPassword() {
    return activePassword;
  }

  function setPassword(value) {
    activePassword = value || "";
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
    const contentType = response.headers.get("Content-Type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: "后端返回了非 JSON 内容" };
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

  function deleteCustomFood(id, password = getPassword()) {
    return request(`/api/custom-foods/${encodeURIComponent(id)}`, {
      method: "DELETE",
      password
    });
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

  function deleteCustomExercise(id, password = getPassword()) {
    return request(`/api/custom-exercises/${encodeURIComponent(id)}`, {
      method: "DELETE",
      password
    });
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
    deleteCustomExercise,
    deleteCustomFood,
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
