# docker-webapp

## Overview

This project is a full-stack Dockerized web application with:

* A Flask backend (Python)
* A React frontend (Create React App)
* A Postgres database

You can run it either with Docker Compose or using plain `docker run` commands.

---

## Project Structure

* backend/            Flask API
  * app.py
  * Dockerfile
  * requirements.txt
* frontend/           React app
  * Dockerfile
  * package.json
* db/
  * init.sql          Optional DB initialization script
* docker-compose.yml  Compose setup for local dev

---

## Requirements

* Docker installed
* (Optional) Python 3.x and Node.js for running parts locally

---

## Running with docker run (without Compose)

1. Create a user-defined network (containers can resolve each other by name)

```bash
docker network create webapp-net || true
```

2. Start Postgres

```bash
docker run -d --name postgres_db \
  --network webapp-net \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app_db \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -v /home/mark/code/docker-webapp/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro \
  postgres:15
```

3. Build and run the backend (Flask)

```bash
# Build image
docker build -t flask-backend /home/mark/code/docker-webapp/backend

# Run container
docker run -d --name flask_backend \
  --network webapp-net \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres_db:5432/app_db \
  -p 5000:5000 \
  flask-backend
```

4. Build and run the frontend (React)

```bash
# Build image
docker build -t react-frontend /home/mark/code/docker-webapp/frontend

# Run container
docker run -d --name react_frontend \
  --network webapp-net \
  -e HOST=0.0.0.0 \
  -e PORT=3000 \
  -e CHOKIDAR_USEPOLLING=true \
  -p 3000:3000 \
  react-frontend
```

5. Open in your browser

* Backend API: http://localhost:5000
* Frontend UI: http://localhost:3000

---

## Running with Docker Compose (alternative)

1. Start all services (db, backend, frontend)

```bash
docker compose up --build
```

* Backend API: http://localhost:5000
* Frontend UI: http://localhost:3000

2. Run in the background (detached)

```bash
docker compose up --build -d
```

3. View logs

```bash
docker compose logs -f
# or a single service
docker compose logs -f backend
```

4. Rebuild a single service after changes

```bash
docker compose up --build backend
```

5. Stop and remove containers (preserve DB volume)

```bash
docker compose down
```

6. Stop and remove containers + named volumes (wipes DB)

```bash
docker compose down -v
```

Notes
* The compose file mounts `./backend` and `./frontend` into containers for rapid local development.
* Postgres data persists in the named volume `postgres_data` unless removed with `-v`.

---

## Development tips (optional)

* Rebuild an image after code changes:

```bash
docker build -t flask-backend /home/mark/code/docker-webapp/backend
docker build -t react-frontend /home/mark/code/docker-webapp/frontend
```

* Mount local source for rapid backend iteration (no restart strategy included here):

```bash
docker run --rm --name flask_backend_dev \
  --network webapp-net \
  -e DATABASE_URL=postgresql://postgres:postgres@postgres_db:5432/app_db \
  -p 5000:5000 \
  -v /home/mark/code/docker-webapp/backend:/app \
  flask-backend
```

---

## Configuration

* Backend listens on port 5000
* Frontend listens on port 3000
* Database URL for backend:

```text
postgresql://postgres:postgres@postgres_db:5432/app_db
```

---

## Notes

* The `webapp-net` network lets containers talk by their `--name` (e.g., `postgres_db`).
* If you prefer using a host Postgres, set `DATABASE_URL` hostname to `localhost` and ensure port `5432` is accessible from the container (e.g., use `--network host` on Linux with care for port collisions).

---

## Future Improvements

* Use a production WSGI server for Flask (e.g., Gunicorn)
* Add CI/CD integration

---

## License

Add your license information here

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.
