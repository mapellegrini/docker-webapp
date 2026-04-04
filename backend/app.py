from flask import Flask, jsonify
import psycopg2
import os

app = Flask(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

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
