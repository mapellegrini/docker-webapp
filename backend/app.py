from flask import Flask, jsonify
import json
import os
from pathlib import Path
from urllib.parse import quote_plus

import psycopg2

app = Flask(__name__)


def _configuration_path():
    if env := os.getenv("CONFIG_PATH"):
        return Path(env)
    here = Path(__file__).resolve().parent
    for candidate in (here / "configuration.json", here.parent / "configuration.json"):
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(
        "configuration.json not found; set CONFIG_PATH or place it next to app.py or the repo root."
    )


def _database_url():
    if url := os.getenv("DATABASE_URL"):
        return url
    with _configuration_path().open(encoding="utf-8") as f:
        cfg = json.load(f)
    db = cfg["database"]
    user = quote_plus(str(db["username"]))
    password = quote_plus(str(db["password"]))
    host = os.getenv("DB_HOST", db.get("host", "localhost"))
    port = int(os.getenv("DB_PORT", db.get("port", 5432)))
    name = quote_plus(str(os.getenv("DB_NAME", db.get("name", "app_db"))))
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


DATABASE_URL = _database_url()


def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

@app.route("/")
def home():
    return jsonify({"message": "Flask is running!"})

@app.route("/data")
def data():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT NOW();")
    result = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"time": result[0].isoformat()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
