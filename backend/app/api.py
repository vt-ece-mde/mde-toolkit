from urllib import response
from canvasapi import Canvas
from fastapi import Depends, FastAPI, Request, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse
from starlette.background import BackgroundTask
import json
from . import mdetk
import os
from pathlib import Path
import shutil
import tempfile
import zipfile

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
    assignment_id: list[str] = Query(), # Using `Query()` is required here to recognize the list type.
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

    print(f"{course_id=}")
    print(f"{n_feedback=}")
    print(f"{assignment_id=}")

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


def remove_dir(path: str|Path):
    """Helper to remove a directory tree."""
    shutil.rmtree(path)


@api.get('/courses/{course_id}/expo/team-dirs')
async def create_expo_team_dirs(
    course_id: str,
    canvas: Canvas = Depends(get_canvas_instance),
    type: str = None, # Zip or JSON
    ):
    """Creates team directories and sends as either a zip archive (default) or a JSON blob."""

    # Obtain list of courses using optional ID filter.
    course_id = mdetk.parse_value_or_url(course_id, int, 'courses')

    # Temporary directory.
    tmpdir = tempfile.mkdtemp()

    # Create a base path.
    tmpdir_path = Path(tmpdir)

    # Create zip archive of temporary directory.
    zipname_base = f'{course_id}_expo_team_dirs'
    zipname_base_path = Path(zipname_base)
    zipped_filename = f'{zipname_base}.zip'
    zipped_path = tmpdir_path/zipped_filename
    with zipfile.ZipFile(zipped_path, 'w') as zf:

        # Create directory for each group.
        gen = mdetk.groups(
            canvas=canvas,
            course_id=course_id,
            group_id=None,
            format=False,
        )
        for group in gen:
            formatted_group_name = mdetk.format_group_name(group.name)
            p = tmpdir_path/zipname_base_path/formatted_group_name
            p.mkdir(parents=True, exist_ok=True)

            # Add to zip archive.
            arcname = zipname_base_path/formatted_group_name
            zf.write(p, arcname=arcname)

    # Send zip archive.
    if type is None or type.lower() == 'zip':
        response = FileResponse(zipped_path,
            media_type="application/x-zip-compressed",
            filename=zipped_filename,
            background=BackgroundTask(shutil.rmtree, tmpdir),
        )
        return response

    # Send JSON blob.
    elif type.lower() == 'json':
        return [f.filename for f in zf.filelist]
