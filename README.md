# mde-toolkit

Collection of tools useful for Virginia Tech ECE MDE course administration.

## Installation Instructions

The following is required to fully run this toolkit.

- [Docker](#docker-setup)
- [Google API keys](#google-setup)
- [Canvas API keys](#canvas-setup)

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

### Google Setup

The toolkit uses Google APIs to access services such as Google Drive, user email, and other things. **Before using this tool, you MUST create a Google developer account, create a project for this toolkit, and copy the associated API keys**.

A really good guide on how to do this can be found here: <https://refine.dev/blog/nextauth-google-github-authentication-nextjs/>

> Note that you can skip the NextJS project creation part and jump straight to the ["For GoogleProvider"](https://refine.dev/blog/nextauth-google-github-authentication-nextjs/#for-googleprovider-make-sure-you-have-a-google-account) section

To summarize, you need to do the following:

1. Setup a Google API developer account
2. Create a Google cloud project for this MDE toolkit
    - **Make sure to add the app's URL (<http://localhost:3000> or deployment URL) to the _Authorized Origins_ list**
4. Create an environment file for the front-end application `./frontend/env.local`
    - **Note that this file does not exist, you will need to create it**
5. Copy the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` variables into `./frontend/env.local`:

```env
GOOGLE_CLIENT_ID=xxxxxxxxxx
GOOGLE_CLIENT_SECRET=yyyyyyyyyy
```


5. Generate a NextJS authentication secret key using the command

```bash
$ openssl rand -base64 32
```

6. Copy the secret key into `./frontend/env.local` along with your front-end deployed URL

```env
# ...
NEXTAUTH_URL=http://localhost:3000 # for development
# NEXTAUTH_URL=https://{YOURDOMAIN} # for deployment
NEXTAUTH_SECRET=zzzzzzzzzz
```

### Canvas Setup

#### Basics

- Need access token from Canvas directly. See guide on how to manually request a token: <https://kb.iu.edu/d/aaja>
- Save access token to environment variable `CANVAS_API_TOKEN`
- Canvas API documentation <https://canvas.instructure.com/doc/api/>
- Use `jq` to filter JSON responses
- Canvas API uses pagination (limit is 10 results per query). This can be extended using the `?per_page=100` query modifier.

#### Query Examples

Basic query to get list of courses:

```bash
curl -H "Authorization: Bearer ${CANVAS_API_TOKEN}" "https://canvas.vt.edu/api/v1/courses?per_page=100"
```
