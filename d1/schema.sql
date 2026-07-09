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
