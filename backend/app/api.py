from canvasapi import Canvas
from fastapi import Depends, FastAPI, Request, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
import json
from . import mdetk
import os

api = FastAPI()

# Allow API server to be accessible on different hostnames (e.g., Docker containers).
api.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@api.get("/test")
async def test():
    return {"message": "This is a test"}


@api.get("/courses")
async def courses(
    canvas: Canvas = Depends(get_canvas_instance),
    course_id: str = None,
    ) -> list[dict]:

    # Obtain list of courses using optional ID filter.
    if course_id is not None:
        course_id = mdetk.parse_value_or_url(course_id, int, 'courses')
    courses = mdetk.courses(canvas=canvas, course_id=course_id)

    # Build list of courses.
    ret = [{"name": c.name, "id": c.id} for c in courses]
    return ret


@api.get("/courses/{course_id}/groups")
async def groups(
    course_id: str,
    canvas: Canvas = Depends(get_canvas_instance),
    group_id: str = None,
    format: bool = False,
    ) -> list[dict]:

    # Obtain list of courses using optional ID filter.
    if course_id is not None:
        course_id = mdetk.parse_value_or_url(course_id, int, 'courses')
    if group_id is not None:
        group_id = mdetk.parse_value_or_url(group_id, int, 'groups')
    
    # Get generator of groups.
    gen = mdetk.groups(
        canvas=canvas,
        course_id=course_id,
        group_id=group_id,
        format=format,
    )

    # Build list of groups.
    ret = [{"name": g.name, "id": g.id} for g in gen]
    return ret


@api.get("/courses/{course_id}/students")
async def students(
    course_id: str,
    canvas: Canvas = Depends(get_canvas_instance),
    ) -> list[dict]:

    # Obtain list of courses using optional ID filter.
    if course_id is not None:
        course_id = mdetk.parse_value_or_url(course_id, int, 'courses')

    # Get course from ID.
    course = canvas.get_course(course_id)
    
    # Get generator of groups.
    gen = course.get_users(enrollment_type=['student'])

    # Build list of groups.
    ret = [
        {
            "name": user.name,
            "sortable_name": user.sortable_name,
            "id": user.id,
        } for user in gen
        ]
    return ret


@api.get("/courses/{course_id}/ipr-history-spreadsheet")
async def ipr_history_spreadsheet(
    course_id: str,
    n_feedback: int,
    assignment_id: list[int] = Query(), # Using `Query()` is required here to recognize the list type.
    delimiter: str = '|',
    sort_key: str = 'group_name',
    canvas: Canvas = Depends(get_canvas_instance),
    ) -> list[dict]:

    # Obtain list of courses using optional ID filter.
    course_id = mdetk.parse_value_or_url(course_id, int, 'courses')

    # Convert assignment IDs to integer or parse from URL.
    assignment_id = [
        mdetk.parse_value_or_url(aid, int, 'assignments') for aid in assignment_id
    ]

    gen = mdetk.generate_ipr_history_spreadsheet(
        canvas=canvas,
        course_id=course_id,
        assignment_id=assignment_id,
        n_feedback=n_feedback,
        delimiter=delimiter,
        sort_key=sort_key,
        # outfile=sys.stdout,
    )
    return list(gen)


    # # Get course from ID.
    # course = canvas.get_course(course_id)
    
    # # Get generator of groups.
    # gen = course.get_users(enrollment_type=['student'])

    # # Build list of groups.
    # ret = [
    #     {
    #         "name": user.name,
    #         "sortable_name": user.sortable_name,
    #         "id": user.id,
    #     } for user in gen
    #     ]
    # return ret