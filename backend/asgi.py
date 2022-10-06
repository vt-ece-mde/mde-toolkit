import os
import uvicorn

if __name__ == "__main__":
    API_PORT = int(os.environ.get("API_PORT", 8080))
    API_HOST = os.environ.get("API_HOST", "localhost")
    print(f"{API_HOST=}")
    print(f"{API_PORT=}")
    uvicorn.run("app.api:api", host=API_HOST, port=API_PORT, reload=True)