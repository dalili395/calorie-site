const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS custom_foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  calories REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'serving',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  calories REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS calorie_records (
  date TEXT PRIMARY KEY,
  intake REAL NOT NULL,
  tef_factor REAL NOT NULL,
  bmr REAL NOT NULL,
  daily_factor REAL NOT NULL,
  exercise REAL NOT NULL,
  difference REAL NOT NULL,
  status TEXT NOT NULL,
  saved_at TEXT NOT NULL
);
`;

let schemaReady = false;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Collab-Password"
  };
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

async function readJson(request) {
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text);
}

function nowIso() {
  return new Date().toISOString();
}

function getRoute(request) {
  const path = new URL(request.url).pathname;
  return path.replace(/^\/api\/?/, "/");
}

function getPassword(env) {
  return env.CALORIE_COLLAB_PASSWORD || env.COLLAB_PASSWORD || "";
}

function hasValidPassword(request, env) {
  const expected = getPassword(env);
  return Boolean(expected) && request.headers.get("X-Collab-Password") === expected;
}

async function getDb(env) {
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured");
  }
  if (!schemaReady) {
    await env.DB.exec(SCHEMA_SQL);
    schemaReady = true;
  }
  return env.DB;
}

function rowToFood(row) {
  return {
    id: row.id,
    name: row.name,
    calories: row.calories,
    unit: row.unit,
    sourceType: "custom",
    aliases: [row.name],
    createdAt: row.created_at
  };
}

function rowToExercise(row) {
  return {
    id: row.id,
    name: row.name,
    calories: row.calories,
    createdAt: row.created_at
  };
}

function rowToRecord(row) {
  return {
    date: row.date,
    calories: row.intake,
    tefFactor: row.tef_factor,
    bmr: row.bmr,
    dailyFactor: row.daily_factor,
    metabolism: row.exercise,
    difference: row.difference,
    status: row.status,
    savedAt: row.saved_at
  };
}

function mifflinStJeor(payload) {
  const sexOffset = payload.sex === "male" ? 5 : -161;
  const weight = Number(payload.weightKg) || 0;
  const height = Number(payload.heightCm) || 0;
  const age = Number(payload.age) || 0;
  return 10 * weight + 6.25 * height - 5 * age + sexOffset;
}

function calculateDifference(payload) {
  const intake = Number(payload.intakeCalories) || 0;
  const tefFactor = Number(payload.tefFactor) || 0.93;
  const dailyFactor = Number(payload.dailyFactor) || 1.2;
  const exercise = Number(payload.exerciseCalories) || 0;
  const bmr = mifflinStJeor(payload);
  const difference = intake * tefFactor - bmr * dailyFactor - exercise;
  return {
    intake,
    tefFactor,
    bmr,
    dailyFactor,
    exercise,
    difference,
    status: difference < 0 ? "今天瘦了" : "还需加油哦"
  };
}

async function getRows(statement, params = []) {
  const result = params.length
    ? await statement.bind(...params).all()
    : await statement.all();
  return result.results || [];
}

async function handleGet(request, env) {
  const route = getRoute(request);

  if (route === "/health") {
    return json({
      ok: Boolean(env.DB),
      storage: "cloudflare-d1",
      passwordConfigured: Boolean(getPassword(env))
    });
  }

  if (route === "/custom-foods") {
    const db = await getDb(env);
    const rows = await getRows(db.prepare("SELECT * FROM custom_foods ORDER BY created_at DESC"));
    return json({ foods: rows.map(rowToFood) });
  }

  if (route === "/custom-exercises") {
    const db = await getDb(env);
    const rows = await getRows(db.prepare("SELECT * FROM custom_exercises ORDER BY created_at DESC"));
    return json({ exercises: rows.map(rowToExercise) });
  }

  if (route === "/records") {
    const db = await getDb(env);
    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const conditions = [];
    const params = [];

    if (start) {
      conditions.push("date >= ?");
      params.push(start);
    }
    if (end) {
      conditions.push("date <= ?");
      params.push(end);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await getRows(
      db.prepare(`SELECT * FROM calorie_records ${where} ORDER BY date ASC`),
      params
    );
    return json({ records: rows.map(rowToRecord) });
  }

  return json({ error: "not found" }, 404);
}

async function handlePost(request, env) {
  let payload;
  try {
    payload = await readJson(request);
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const route = getRoute(request);

  if (route === "/auth") {
    return json({
      ok: Boolean(getPassword(env)) && payload.password === getPassword(env),
      passwordConfigured: Boolean(getPassword(env))
    });
  }

  if (route === "/calculate-difference") {
    return json(calculateDifference(payload));
  }

  if (route === "/custom-foods") {
    if (!hasValidPassword(request, env)) return json({ error: "wrong password" }, 403);
    const name = String(payload.name || "").trim();
    const calories = Number(payload.calories) || 0;
    const unit = String(payload.unit || "serving");
    if (!name || calories <= 0) {
      return json({ error: "name and calories are required" }, 400);
    }

    const row = {
      id: `custom-food-${crypto.randomUUID()}`,
      name,
      calories,
      unit,
      created_at: nowIso()
    };
    const db = await getDb(env);
    await db.prepare(
      "INSERT INTO custom_foods (id, name, calories, unit, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(row.id, row.name, row.calories, row.unit, row.created_at).run();
    return json({ food: rowToFood(row) });
  }

  if (route === "/custom-exercises") {
    if (!hasValidPassword(request, env)) return json({ error: "wrong password" }, 403);
    const name = String(payload.name || "").trim();
    const calories = Number(payload.calories) || 0;
    if (!name || calories <= 0) {
      return json({ error: "name and calories are required" }, 400);
    }

    const row = {
      id: `custom-exercise-${crypto.randomUUID()}`,
      name,
      calories,
      created_at: nowIso()
    };
    const db = await getDb(env);
    await db.prepare(
      "INSERT INTO custom_exercises (id, name, calories, created_at) VALUES (?, ?, ?, ?)"
    ).bind(row.id, row.name, row.calories, row.created_at).run();
    return json({ exercise: rowToExercise(row) });
  }

  if (route === "/records") {
    const date = String(payload.date || "").trim();
    if (!date) return json({ error: "date is required" }, 400);

    const result = calculateDifference(payload);
    const savedAt = nowIso();
    const db = await getDb(env);
    await db.prepare(`
      INSERT INTO calorie_records
        (date, intake, tef_factor, bmr, daily_factor, exercise, difference, status, saved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        intake = excluded.intake,
        tef_factor = excluded.tef_factor,
        bmr = excluded.bmr,
        daily_factor = excluded.daily_factor,
        exercise = excluded.exercise,
        difference = excluded.difference,
        status = excluded.status,
        saved_at = excluded.saved_at
    `).bind(
      date,
      result.intake,
      result.tefFactor,
      result.bmr,
      result.dailyFactor,
      result.exercise,
      result.difference,
      result.status,
      savedAt
    ).run();

    return json({ record: { date, ...result, savedAt } });
  }

  return json({ error: "not found" }, 404);
}

export async function onRequest(context) {
  const { request, env } = context;
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method === "GET") return handleGet(request, env);
    if (request.method === "POST") return handlePost(request, env);
    return json({ error: "method not allowed" }, 405);
  } catch (error) {
    return json({ error: error.message || "server error" }, 500);
  }
}
