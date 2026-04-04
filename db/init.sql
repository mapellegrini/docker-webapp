CREATE TABLE IF NOT EXISTS test (
    id SERIAL PRIMARY KEY,
    name TEXT
);

INSERT INTO test (name) VALUES ('Hello from Postgres');
