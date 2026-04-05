from flask import Flask, jsonify, request
import json
import os
from pathlib import Path
from urllib.parse import quote_plus

import psycopg2
from psycopg2 import errors as pg_errors
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def _configuration_path():
    if env := os.getenv("CONFIG_PATH"):
        return Path(env)
    here = Path(__file__).resolve().parent
    # Prefer repo-root configuration.json so a stray backend/configuration.json
    # (e.g. empty placeholder) does not override the file Compose mounts at /app/.
    root_cfg = here.parent / "configuration.json"
    local_cfg = here / "configuration.json"
    if root_cfg.is_file():
        return root_cfg
    if local_cfg.is_file():
        return local_cfg
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


def _parse_create_student_payload(data):
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object"
    sid = data.get("id")
    name = data.get("name")
    age = data.get("age")
    grade = data.get("grade")
    alive = data.get("alive")
    gpa = data.get("gpa", None)

    if sid is None or not isinstance(sid, int) or isinstance(sid, bool):
        return None, "id must be a non-negative integer"
    if sid < 0 or sid > 2147483647:
        return None, "id out of range"

    if not isinstance(name, str):
        return None, "name must be a string"
    name = name.strip()
    if not name or len(name) > 40:
        return None, "name must be 1–40 characters"

    if age is None or not isinstance(age, int) or isinstance(age, bool):
        return None, "age must be a non-negative integer"
    if age < 0 or age > 2147483647:
        return None, "age out of range"

    if grade is None or not isinstance(grade, int) or isinstance(grade, bool):
        return None, "grade must be an integer from 0 to 255"
    if grade < 0 or grade > 255:
        return None, "grade must be an integer from 0 to 255"

    if not isinstance(alive, bool):
        return None, "alive must be a boolean"

    if gpa is not None:
        if isinstance(gpa, bool) or not isinstance(gpa, (int, float)):
            return None, "gpa must be a number or null"
        gpa = float(gpa)

    return (sid, name, age, grade, alive, gpa), None


def _parse_update_student_payload(data):
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object"
    columns = []
    values = []

    if "name" in data:
        name = data["name"]
        if not isinstance(name, str):
            return None, "name must be a string"
        name = name.strip()
        if not name or len(name) > 40:
            return None, "name must be 1–40 characters"
        columns.append("name = %s")
        values.append(name)

    if "age" in data:
        age = data["age"]
        if not isinstance(age, int) or isinstance(age, bool):
            return None, "age must be a non-negative integer"
        if age < 0 or age > 2147483647:
            return None, "age out of range"
        columns.append("age = %s")
        values.append(age)

    if "grade" in data:
        grade = data["grade"]
        if not isinstance(grade, int) or isinstance(grade, bool):
            return None, "grade must be an integer from 0 to 255"
        if grade < 0 or grade > 255:
            return None, "grade must be an integer from 0 to 255"
        columns.append("grade = %s")
        values.append(grade)

    if "alive" in data:
        alive = data["alive"]
        if not isinstance(alive, bool):
            return None, "alive must be a boolean"
        columns.append("alive = %s")
        values.append(alive)

    if "gpa" in data:
        gpa = data["gpa"]
        if gpa is None:
            columns.append("gpa = %s")
            values.append(None)
        else:
            if isinstance(gpa, bool) or not isinstance(gpa, (int, float)):
                return None, "gpa must be a number or null"
            columns.append("gpa = %s")
            values.append(float(gpa))

    if not columns:
        return None, "No fields to update"
    return (columns, values), None


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


@app.route("/students", methods=["GET"])
def list_students():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, name, age, grade, alive, gpa
        FROM student
        ORDER BY id
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    students = [
        {
            "id": _id,
            "name": name,
            "age": age,
            "grade": grade,
            "alive": alive,
            "gpa": float(gpa) if gpa is not None else None,
        }
        for _id, name, age, grade, alive, gpa in rows
    ]
    return jsonify(students)


@app.route("/students", methods=["POST"])
def create_student():
    data = request.get_json(silent=True)
    parsed = _parse_create_student_payload(data)
    if parsed[1]:
        return jsonify({"error": parsed[1]}), 400
    sid, name, age, grade, alive, gpa = parsed[0]
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO student (id, name, age, grade, alive, gpa)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (sid, name, age, grade, alive, gpa),
        )
        conn.commit()
    except pg_errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "A student with this id already exists"}), 409
    except pg_errors.CheckViolation:
        conn.rollback()
        return jsonify({"error": "Data violates database constraints"}), 400
    finally:
        cur.close()
        conn.close()
    return (
        jsonify(
            {
                "id": sid,
                "name": name,
                "age": age,
                "grade": grade,
                "alive": alive,
                "gpa": gpa,
            }
        ),
        201,
    )


@app.route("/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    if student_id < 0:
        return jsonify({"error": "Invalid student id"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, name, age, grade, alive, gpa
        FROM student
        WHERE id = %s
        """,
        (student_id,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row is None:
        return jsonify({"error": "Student not found"}), 404
    _id, name, age, grade, alive, gpa = row
    return jsonify(
        {
            "id": _id,
            "name": name,
            "age": age,
            "grade": grade,
            "alive": alive,
            "gpa": float(gpa) if gpa is not None else None,
        }
    )


@app.route("/students/<int:student_id>", methods=["PATCH"])
def update_student(student_id):
    if student_id < 0:
        return jsonify({"error": "Invalid student id"}), 400
    data = request.get_json(silent=True)
    parsed = _parse_update_student_payload(data)
    if parsed[1]:
        return jsonify({"error": parsed[1]}), 400
    columns, values = parsed[0]
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        sql = f"UPDATE student SET {', '.join(columns)} WHERE id = %s"
        cur.execute(sql, (*values, student_id))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Student not found"}), 404
        cur.execute(
            """
            SELECT id, name, age, grade, alive, gpa
            FROM student
            WHERE id = %s
            """,
            (student_id,),
        )
        row = cur.fetchone()
        conn.commit()
    except pg_errors.CheckViolation:
        conn.rollback()
        return jsonify({"error": "Data violates database constraints"}), 400
    finally:
        cur.close()
        conn.close()
    _id, name, age, grade, alive, gpa = row
    return jsonify(
        {
            "id": _id,
            "name": name,
            "age": age,
            "grade": grade,
            "alive": alive,
            "gpa": float(gpa) if gpa is not None else None,
        }
    )


@app.route("/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    if student_id < 0:
        return jsonify({"error": "Invalid student id"}), 400
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM student WHERE id = %s", (student_id,))
        if cur.rowcount == 0:
            conn.rollback()
            return jsonify({"error": "Student not found"}), 404
        conn.commit()
    finally:
        cur.close()
        conn.close()
    return "", 204


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
