from canvasapi import Canvas
from fastapi import Depends, FastAPI
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import json
from . import mdetk
import os

api = FastAPI()

auth_scheme = HTTPBearer()

async def get_canvas_instance(
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
    ) -> Canvas:

    # Get token from HTTP credentials.
    token = credentials.credentials

    # Create Canvas API instance.
    CANVAS_API_URL = os.getenv('CANVAS_API_TOKEN', 'https://canvas.vt.edu')
    CANVAS_API_TOKEN = os.getenv('CANVAS_API_TOKEN', token)
    print(f"{CANVAS_API_URL=}")
    print(f"{CANVAS_API_TOKEN=}")
    canvas = Canvas(CANVAS_API_URL, CANVAS_API_TOKEN)
    return canvas


@api.get("/")
async def root():
    return {"message": "Hello World!"}


@api.get("/courses")
async def courses(
    canvas: Canvas = Depends(get_canvas_instance),
    course_id: str = None,
    ):

    # Obtain list of courses using optional ID filter.
    if course_id is not None:
        course_id = mdetk.parse_value_or_url(course_id, int, 'courses')
    courses = mdetk.courses(canvas=canvas, course_id=course_id)

    # Build list of courses.
    ret = [{"name": c.name, "id": c.id} for c in courses]
    return ret