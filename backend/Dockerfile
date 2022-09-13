###
# Base stage.
###
FROM python:3.10-slim AS base

# Setup env.
# - Locales
# - Stop Python from generating `.pyc` files
# - Enable tracebacks on segfaults
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONFAULTHANDLER 1

###
# Build stage.
###
FROM base as build

# Install pipenv and compilation dependencies.
RUN python -m pip install pipenv
RUN apt-get update && apt-get install -y --no-install-recommends gcc

# Install dependencies into /.venv
COPY Pipfile .
COPY Pipfile.lock .
RUN PIPENV_VENV_IN_PROJECT=1 pipenv install --deploy

###
# Runtime stage.
###
FROM base as runtime

# Copy virtual environmnet into /.venv
COPY --from=build /.venv /.venv
ENV PATH="/.venv/bin:$PATH"

# Create and switch to a new user (because root is a security risk).
RUN useradd --create-home appuser
WORKDIR /home/appuser
USER appuser

# Install application into container.
COPY . .

# CMD ["gunicorn", "--bind", "0.0.0.0:5000", "wsgi:app"]
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--worker-class uvicorn.workers.UvicornWorker", "app.api:api"]