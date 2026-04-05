CREATE TABLE IF NOT EXISTS test (
    id SERIAL PRIMARY KEY,
    name TEXT
);

INSERT INTO test (name) VALUES ('Hello from Postgres');

-- student: id/name/age map to 32-bit uint, 40-char string, 32-bit uint, 8-bit uint, bool, float4
CREATE TABLE IF NOT EXISTS student (
    id INTEGER PRIMARY KEY CHECK (id >= 0),
    name VARCHAR(40) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0),
    grade SMALLINT NOT NULL CHECK (grade >= 0 AND grade <= 255),
    alive BOOLEAN NOT NULL,
    gpa REAL
);

INSERT INTO student (id, name, age, grade, alive, gpa)
VALUES (1, 'Ada Lovelace', 17, 12, true, 3.85)
ON CONFLICT (id) DO NOTHING;
