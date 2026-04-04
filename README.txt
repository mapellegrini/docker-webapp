# docker-webapp

## Overview

This project is a simple Dockerized web application. It demonstrates how to package a lightweight web app into a Docker container for easy deployment and portability.

The application includes a basic backend (likely Python-based), along with static files and HTML templates.

---

## Project Structure

* app.py              Main application entry point
* Dockerfile          Instructions to build the Docker image
* requirements.txt    Python dependencies
* static/             Static assets (CSS, JavaScript, images)
* templates/          HTML templates

---

## Requirements

* Docker installed
* (Optional) Python 3.x for running locally

---

## Running with Docker

1. Clone the repository

   git clone [https://github.com/mapellegrini/docker-webapp.git](https://github.com/mapellegrini/docker-webapp.git)
   cd docker-webapp

2. Build the Docker image

   docker build -t docker-webapp .

3. Run the container

   docker run -d -p 5000:5000 docker-webapp

4. Open in your browser

   [http://localhost:5000](http://localhost:5000)

---

## Running Locally (Without Docker)

1. Install dependencies

   pip install -r requirements.txt

2. Run the application

   python app.py

---

## Configuration

* Default port is 5000
* To use a different port:

  docker run -p 8080:5000 docker-webapp

---

## Notes

* Rebuild the Docker image after making code changes
* You can mount the current directory for development:

  docker run -p 5000:5000 -v %cd%:/app docker-webapp

---

## Future Improvements

* Add Docker Compose support
* Add environment variable configuration
* Use a production server (e.g., Gunicorn)
* Add CI/CD integration

---

## License

Add your license information here

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.
