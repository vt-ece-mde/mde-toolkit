# mde-toolkit

Collection of tools useful for Virginia Tech ECE MDE course administration.

## Installation Instructions

The following is required to fully run this toolkit.

- Docker
- Google API keys
- Canvas API keys

### Docker Setup

By far the easiest way to get up and running with this tool is through Docker. Doing so means you do not need to install any additional packages or software; just build the associated Docker images and you're done. This also allows the toolkit to be deployed on the cloud if necessary.

1. Install Docker (see <https://docs.docker.com/get-docker/>)
    - Ensure that the `docker compose` command is installed
2. Build containers using `docker compose build`
    - See [docker-compose.yml](./docker-compose.yml) for configuration options
3. Run containers in detached mode using `docker compose up -d`
4. Open a web browser and navigate to <http://localhost:3000> to run the toolkit front-end web UI.
    - The web-app code lives within the `frontend` container
    - Some Python back-end code lives within the `backend` container
5. (optional) A lot of tools have associated backend REST API calls. If you know what you're doing, you are welcome to call these using external tools as well. However, be aware that some API endpoint require access tokens for Google and Canvas APIs and add these to the REST headers as necessary.

#### Container Overview

The following is a description of what each Docker container does. Refer to [docker-compose.yml](./docker-compose.yml) for specific configuration details.

| Container | Description |
| --------- | ----------- |
| `frontend` | The primary web application codebase written using `NextJS`. This contains both the front-end UI and back-end REST API routes. |
| `backend` | Legacy REST API endpoints written in Python `FastAPI` and served using `gunicorn`. This is carryover from previous toolkit development that implemented a standalone CLI. We keep it around to support those legacy calls, and adds flexibility for Python-specific implementations in the future. |
| `db` | The toolkit database. Note that future deployments could opt for a cloud-hosted database solution if desired. |

## Canvas Development Guide

### Basics

- Need access token from Canvas directly. See guide on how to manually request a token: <https://kb.iu.edu/d/aaja>
- Save access token to environment variable `CANVAS_API_TOKEN`
- Canvas API documentation <https://canvas.instructure.com/doc/api/>
- Use `jq` to filter JSON responses
- Canvas API uses pagination (limit is 10 results per query). This can be extended using the `?per_page=100` query modifier.

### Query Examples

Basic query to get list of courses:

```bash
curl -H "Authorization: Bearer ${CANVAS_API_TOKEN}" "https://canvas.vt.edu/api/v1/courses?per_page=100"
```
