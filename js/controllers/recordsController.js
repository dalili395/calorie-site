window.CalorieControllers = window.CalorieControllers || {};

window.CalorieControllers.createRecordsController = function createRecordsController(options) {
  const { elements, formatNumber } = options;
  const storageKey = "calorieDiffRecords";

  function formatLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getToday() {
    return formatLocalDate();
  }

  function shiftDate(date, days) {
    const next = new Date(`${date}T00:00:00`);
    next.setDate(next.getDate() + days);
    return formatLocalDate(next);
  }

  function loadRecords() {
    try {
      const records = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(records) ? records : [];
    } catch {
      return [];
    }
  }

  function getRange() {
    const start = elements.recordStartDate.value;
    const end = elements.recordEndDate.value;
    if (!start || !end) return { start, end };
    return start <= end ? { start, end } : { start: end, end: start };
  }

  function getVisibleRecords() {
    const { start, end } = getRange();
    return loadRecords()
      .filter((record) => (!start || record.date >= start) && (!end || record.date <= end))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function renderEmpty(message) {
    elements.recordChart.innerHTML = `<p class="empty-chart">${message}</p>`;
    elements.recordList.innerHTML = "";
    elements.recordsSummary.textContent = "0 条记录";
  }

  function renderChart(records) {
    if (records.length === 0) {
      renderEmpty("这段时间还没有保存记录。");
      return;
    }

    const width = 680;
    const height = 280;
    const padding = 36;
    const values = records.map((record) => record.difference);
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(0, ...values);
    const range = maxValue - minValue || 1;
    const xStep = records.length > 1 ? (width - padding * 2) / (records.length - 1) : 0;

    const points = records.map((record, index) => {
      const x = padding + xStep * index;
      const y = height - padding - ((record.difference - minValue) / range) * (height - padding * 2);
      return { x, y, record };
    });
    const zeroY = height - padding - ((0 - minValue) / range) * (height - padding * 2);
    const pointList = points.map((point) => `${point.x},${point.y}`).join(" ");
    const dots = points.map((point) => `
      <g>
        <circle cx="${point.x}" cy="${point.y}" r="5"></circle>
        <text x="${point.x}" y="${point.y - 12}" text-anchor="middle">${formatNumber(point.record.difference)}</text>
      </g>
    `).join("");
    const labels = points.map((point, index) => {
      if (records.length > 8 && index % Math.ceil(records.length / 6) !== 0 && index !== records.length - 1) return "";
      return `<text class="date-label" x="${point.x}" y="${height - 10}" text-anchor="middle">${point.record.date.slice(5)}</text>`;
    }).join("");

    elements.recordsSummary.textContent = `${records.length} 条记录`;
    elements.recordChart.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="热量差值曲线">
        <line class="zero-line" x1="${padding}" y1="${zeroY}" x2="${width - padding}" y2="${zeroY}"></line>
        <polyline points="${pointList}"></polyline>
        ${dots}
        ${labels}
      </svg>
    `;
  }

  function renderList(records) {
    elements.recordList.innerHTML = "";
    records.forEach((record) => {
      const item = document.createElement("article");
      const date = document.createElement("strong");
      const meta = document.createElement("span");
      const diff = document.createElement("em");

      item.className = "record-item";
      date.textContent = record.date;
      meta.textContent = `代谢值 ${formatNumber(record.metabolism)} kcal · 热量值 ${formatNumber(record.calories)} kcal`;
      diff.textContent = `${formatNumber(record.difference)} kcal`;

      item.append(date, meta, diff);
      elements.recordList.appendChild(item);
    });
  }

  function render() {
    const records = getVisibleRecords();
    renderChart(records);
    renderList(records);
  }

  elements.recordEndDate.value = getToday();
  elements.recordStartDate.value = shiftDate(getToday(), -6);
  elements.refreshRecords.addEventListener("click", render);
  elements.recordStartDate.addEventListener("change", render);
  elements.recordEndDate.addEventListener("change", render);
  window.addEventListener("calorie-records-updated", render);

  return {
    render
  };
};
