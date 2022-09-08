from flask import Flask, render_template, url_for, request, send_file
from canvasapi import Canvas
import mdetk
import os
import tempfile

app = Flask(__name__)

@app.context_processor
def inject_meta() -> dict:
    """Injects metadata into all templates."""
    # Page title.
    title = 'MDE Toolkit'

    # Navbar.
    nav = [
        {'name': 'Home', 'url': url_for('home'), 'type': 'item'},
        {'name': 'Tools', 'url': '#', 'type': 'dropdown', 'children': [
            {'name': 'Courses', 'url': url_for('courses')},
        ]},
    ]

    # Metadata.
    meta = {
        'title': title,
        'nav': nav,
    }
    return dict(meta=meta)


@app.route('/')
@app.route('/home')
def home():
    return render_template('home.html')


@app.route('/courses', methods=['GET'])
def courses():

    CANVAS_API_URL = 'https://canvas.vt.edu'
    CANVAS_API_TOKEN = os.getenv('CANVAS_API_TOKEN')
    print(f"{CANVAS_API_URL=}")
    print(f"{CANVAS_API_TOKEN=}")
    canvas = Canvas(CANVAS_API_URL, CANVAS_API_TOKEN)

    courses = None
    course_id = None
    print(f"{request=}", flush=True)
    print(f"{request.args=}", flush=True)

    if request.method == 'GET':

        # Only get data if query is provided.
        if request.args:

            # Filter by course ID if given.
            if request.args.get('course_id'):
                course_id = mdetk.parse_value_or_url(request.form['course_id'], int, 'courses')
            courses = mdetk.courses(canvas=canvas, course_id=course_id)

            # Generate file and upload to client.
            if request.args.get('download'):
                with tempfile.NamedTemporaryFile('w+', delete=True) as f:
                    f.write('Course ID,Course Name\n')
                    for course in courses:
                        f.write(f"{course.id},{course.name}\n")
                    f.seek(0)
                    print(f"{f.name=}", flush=True)
                    return send_file(f.name, as_attachment=True, download_name='courses.csv')


    return render_template('courses.html', courses=courses, course_id=course_id)