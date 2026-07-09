from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
import json
import os
import sqlite3
import time
import uuid


ROOT = os.path.dirname(__file__)
DB_PATH = os.environ.get("CALORIE_DB_PATH", os.path.join(ROOT, "calorie_site.sqlite3"))
COLLAB_PASSWORD = os.environ.get("CALORIE_COLLAB_PASSWORD", "calorie-admin")


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
        conn.executescript(
            """
            create table if not exists custom_foods (
              id text primary key,
              name text not null,
              calories real not null,
              unit text not null default 'serving',
              created_at text not null
            );

            create table if not exists custom_exercises (
              id text primary key,
              name text not null,
              calories real not null,
              created_at text not null
            );

            create table if not exists calorie_records (
              date text primary key,
              intake real not null,
              tef_factor real not null,
              bmr real not null,
              daily_factor real not null,
              exercise real not null,
              difference real not null,
              status text not null,
              saved_at text not null
            );
            """
        )


def now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def parse_body(handler):
    length = int(handler.headers.get("Content-Length", "0") or 0)
    if length == 0:
        return {}
    raw = handler.rfile.read(length)
    return json.loads(raw.decode("utf-8"))


def row_to_food(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "calories": row["calories"],
        "unit": row["unit"],
        "sourceType": "custom",
        "aliases": [row["name"]],
        "createdAt": row["created_at"],
    }


def row_to_exercise(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "calories": row["calories"],
        "createdAt": row["created_at"],
    }


def row_to_record(row):
    return {
        "date": row["date"],
        "calories": row["intake"],
        "tefFactor": row["tef_factor"],
        "bmr": row["bmr"],
        "dailyFactor": row["daily_factor"],
        "metabolism": row["exercise"],
        "difference": row["difference"],
        "status": row["status"],
        "savedAt": row["saved_at"],
    }


def require_password(handler):
    password = handler.headers.get("X-Collab-Password", "")
    return password == COLLAB_PASSWORD


def mifflin_st_jeor(payload):
    sex = str(payload.get("sex", "female"))
    weight = float(payload.get("weightKg") or 0)
    height = float(payload.get("heightCm") or 0)
    age = float(payload.get("age") or 0)
    sex_offset = 5 if sex == "male" else -161
    return 10 * weight + 6.25 * height - 5 * age + sex_offset


def calculate_difference(payload):
    intake = float(payload.get("intakeCalories") or 0)
    tef_factor = float(payload.get("tefFactor") or 0.93)
    daily_factor = float(payload.get("dailyFactor") or 1.2)
    exercise = float(payload.get("exerciseCalories") or 0)
    bmr = mifflin_st_jeor(payload)
    difference = intake * tef_factor - bmr * daily_factor - exercise
    return {
        "intake": intake,
        "tefFactor": tef_factor,
        "bmr": bmr,
        "dailyFactor": daily_factor,
        "exercise": exercise,
        "difference": difference,
        "status": "今天瘦了" if difference < 0 else "还需加油哦",
    }


class Handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,X-Collab-Password")
        super().end_headers()

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self.send_json({"ok": True})
            return

        if path == "/api/custom-foods":
            with connect_db() as conn:
                rows = conn.execute("select * from custom_foods order by created_at desc").fetchall()
            self.send_json({"foods": [row_to_food(row) for row in rows]})
            return

        if path == "/api/custom-exercises":
            with connect_db() as conn:
                rows = conn.execute("select * from custom_exercises order by created_at desc").fetchall()
            self.send_json({"exercises": [row_to_exercise(row) for row in rows]})
            return

        if path == "/api/records":
            query = parse_qs(parsed.query)
            start = query.get("start", [""])[0]
            end = query.get("end", [""])[0]
            sql = "select * from calorie_records where 1=1"
            params = []
            if start:
                sql += " and date >= ?"
                params.append(start)
            if end:
                sql += " and date <= ?"
                params.append(end)
            sql += " order by date asc"
            with connect_db() as conn:
                rows = conn.execute(sql, params).fetchall()
            self.send_json({"records": [row_to_record(row) for row in rows]})
            return

        self.send_json({"error": "not found"}, 404)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            payload = parse_body(self)
        except Exception:
            self.send_json({"error": "invalid json"}, 400)
            return

        if path == "/api/auth":
            self.send_json({"ok": payload.get("password") == COLLAB_PASSWORD})
            return

        if path == "/api/calculate-difference":
            self.send_json(calculate_difference(payload))
            return

        if path == "/api/custom-foods":
            if not require_password(self):
                self.send_json({"error": "wrong password"}, 403)
                return
            name = str(payload.get("name", "")).strip()
            calories = float(payload.get("calories") or 0)
            unit = str(payload.get("unit", "serving"))
            if not name or calories <= 0:
                self.send_json({"error": "name and calories are required"}, 400)
                return
            row = {
                "id": "custom-food-" + uuid.uuid4().hex[:12],
                "name": name,
                "calories": calories,
                "unit": unit,
                "created_at": now_iso(),
            }
            with connect_db() as conn:
                conn.execute(
                    "insert into custom_foods (id, name, calories, unit, created_at) values (?, ?, ?, ?, ?)",
                    (row["id"], row["name"], row["calories"], row["unit"], row["created_at"]),
                )
            self.send_json({"food": row_to_food(row)})
            return

        if path == "/api/custom-exercises":
            if not require_password(self):
                self.send_json({"error": "wrong password"}, 403)
                return
            name = str(payload.get("name", "")).strip()
            calories = float(payload.get("calories") or 0)
            if not name or calories <= 0:
                self.send_json({"error": "name and calories are required"}, 400)
                return
            row = {
                "id": "custom-exercise-" + uuid.uuid4().hex[:12],
                "name": name,
                "calories": calories,
                "created_at": now_iso(),
            }
            with connect_db() as conn:
                conn.execute(
                    "insert into custom_exercises (id, name, calories, created_at) values (?, ?, ?, ?)",
                    (row["id"], row["name"], row["calories"], row["created_at"]),
                )
            self.send_json({"exercise": row_to_exercise(row)})
            return

        if path == "/api/records":
            result = calculate_difference(payload)
            date = str(payload.get("date", "")).strip()
            if not date:
                self.send_json({"error": "date is required"}, 400)
                return
            with connect_db() as conn:
                conn.execute(
                    """
                    insert into calorie_records
                      (date, intake, tef_factor, bmr, daily_factor, exercise, difference, status, saved_at)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    on conflict(date) do update set
                      intake=excluded.intake,
                      tef_factor=excluded.tef_factor,
                      bmr=excluded.bmr,
                      daily_factor=excluded.daily_factor,
                      exercise=excluded.exercise,
                      difference=excluded.difference,
                      status=excluded.status,
                      saved_at=excluded.saved_at
                    """,
                    (
                        date,
                        result["intake"],
                        result["tefFactor"],
                        result["bmr"],
                        result["dailyFactor"],
                        result["exercise"],
                        result["difference"],
                        result["status"],
                        now_iso(),
                    ),
                )
            self.send_json({"record": {"date": date, **result}})
            return

        self.send_json({"error": "not found"}, 404)


def main():
    init_db()
    host = os.environ.get("CALORIE_HOST", "127.0.0.1")
    port = int(os.environ.get("CALORIE_PORT", "8787"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Calorie backend running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
