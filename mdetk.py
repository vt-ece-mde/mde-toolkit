"""MDE Toolkit Library.

This module contains functions that aid MDE course operation.
"""
from canvasapi import Canvas
from canvasapi.user import User
from canvasapi.group import Group
import logging
import networkx as nx
import os
from typing import Any, Callable, Dict, TextIO, Tuple, TypeVar
from xml.etree import ElementTree
from xml.sax import saxutils
from urllib.parse import urlparse

logger = logging.getLogger()

T = TypeVar('T') # Generic type.

def parse_value_or_url(v: Any, t: Callable[[Any], T], key: str = None) -> T:
    """Convert a given value to the desired type, or parse it from a Canvas URL.

    Args:
        v (Any): The value to be converted.
        t (Callable[[Any], T]): Type conversion function.
        key (str, optional): Desired URL key. Defaults to `None`.

    Returns:
        T: _description_
    """
    # Try to convert value directly to type.
    try:
        return t(v)
    # Extract value from URL and convert to type.
    except:
        d = parse_canvas_url(v)
        return t(d[key])


def parse_canvas_url(url: str) -> dict:
    """Extract information from a Canvas URL.

    Args:
        url (str): The URL string.

    Returns:
        dict: Dictionary of extracted information (keys will be identical to URL contents).
    """
    o = urlparse(url)
    s = list(filter(None, o.path.split('/')))

    # Group elements with their next neighbor.
    g = list(zip(s[::2], s[1::2]))

    # Create dictionary from grouped elements.
    d = dict(g)

    # Return dictionary.
    return d



def format_group_name(group: str) -> str:
    """Reformats given group name so that it can be used for software purposes."""
    out = group.strip()

    # Change special characters.
    out = out.replace('&', 'and')

    # Remove certain characters entirely.
    # Note that "-" is not included in this list,
    # it is reserved to separate sponsor name
    # from project name.
    emptychars = '~!@#$%^&*()+`.,;:/?\'\"'
    for c in emptychars:
        out = out.replace(c, '')

    # Convert spaces to underscores.
    out = out.replace(' ', '_')

    # Remove duplicate separators.
    out = '_'.join(filter(None, out.split('_')))

    # Replace oddly-formatted dash with just a simple dash.
    # This is to differentiate sponsor name from team name.
    out = out.replace('_-_', '-')

    # Make entire string lower-case.
    out = out.lower()

    return out


def get_users_by_group(canvas: Canvas, course_id: int) -> Tuple[Dict[int,User],Dict[int,Group],Dict[int,int]]:
    """Retrieve users correlated by group.

    Args:
        canvas (Canvas): Authenticated Canvas API object
        course_id (int): ID of course to query

    Returns:
        Tuple[Dict[int,User],Dict[int,Group],Dict[int,int]]: Tuple of 3 dictionaries:
            1. Dictionary of students
            2. Dictionary of groups
            3. Dictionary of student-id-to-group-id
    """

    # Get the course.
    course = canvas.get_course(course_id)

    # Load all groups.
    groups = [group for group in course.get_groups()]
    logger.debug("Loaded %d groups", len(groups))

    # There could be duplicate groups, with different `group_category_id` fields.
    # So, filter the group list to a single `group_category_id` field.
    group_category_ids = sorted(list(set([group.group_category_id for group in groups])))
    groups = {group.id:group for group in filter(lambda group: group.group_category_id == group_category_ids[0], groups)}
    logger.debug("Filtered to %d groups", len(groups))

    # Match groups to students.
    students = {}
    student_to_group = {}
    for _, g in groups.items():
        users = g.get_users()
        for u in users:
            students[u.id] = u
            student_to_group[u.id] = g.id

    return students, groups, student_to_group


def speed_grader_url(canvas: Canvas, course_id: int, assignment_id: int, student_id: int):
    return f"{canvas._Canvas__requester.original_url}/courses/{course_id}/gradebook/speed_grader?assignment_id={assignment_id}&student_id={student_id}"




def generate_ipr_history_spreadsheet(
    canvas: Canvas,
    course_id: int,
    assignment_id: int|list[int], # List of assignment IDs for URL linking.
    outfile: TextIO,
    n_feedback: int, # Number of IPR feedback rounds.
    delimiter: str = ',',
    sort_key: str = 'group_name',
    ):
    """Generates a CSV-like IPR history spreadsheet template.

    Args:
        canvas (Canvas): Canvas API object.
        course_id (int): Course ID number.
        assignment_id (int | list[int]): Assignment IDs for URL construction.
        outfile (TextIO): Output file-like object.
        n_feedback (int): Number of desired IPR feedback rounds.
        sort_key (str, optional): Denotes how records should be sorted (i.e., by "user_name", "group_name"). Defaults to 'group_name'.
    """

    # Convert assignment ID to list of integers.
    if isinstance(assignment_id, int):
        assignment_id = [assignment_id]

    # Get linked users to groups.
    users, groups, user_to_group = get_users_by_group(canvas, course_id)

    # Get all assignment info.
    course = canvas.get_course(course_id)
    assignments = [course.get_assignment(aid) for aid in assignment_id]

    # Organize list of user IDs, in various sorting orders.
    if sort_key == 'user_name':
        uids = sorted(users.keys(), key=lambda uid: users[uid].sortable_name)
    elif sort_key == 'group_name':
        uids = sorted(users.keys(), key=lambda uid: groups[user_to_group[uid]].name)
    else:
        uids = list(users.keys())

    # Beginning header.
    header_items = ['User Name', 'Group Name']

    # List of columns that should be empty.
    cols_empty = []
    cols_empty.append(f"GTA Grader")
    for i in range(n_feedback):
        cols_empty.append(f"Feedback {i+1} Grade")
        cols_empty.append(f"Feedback {i+1} Comments")
    cols_empty.extend([
        "Computed Final Grade (Mean)",
        "GTA Adjusted Final Grade",
        "Self-Assessment Score Reduction (- # of points: 0 is perfect, -10 is poor)",
        "Final Grade",
        "IPR History",
        "Final Assessment Comments",
    ])
    header_items.extend(cols_empty)

    # URL columns.
    cols_url = [f"(URL) {a.name}" for a in assignments]
    header_items.extend(cols_url)

    # Write the header to the file.
    header = delimiter.join(header_items)
    outfile.write(header)

    # Write the user information to the file.
    for uid in uids:

        # Baseline records.
        record = [
            users[uid].sortable_name, # User name
            groups[user_to_group[uid]].name, # Group name
        ]

        # Empty columns.
        record.extend(['' for _ in cols_empty])

        # URL records.
        urls = [
            speed_grader_url(canvas, course_id, aid, uid)
            for aid in assignment_id
        ]
        record.extend(urls)

        # Write records to file
        outfile.write(f"\n{delimiter.join(str(r) for r in record)}")





###
# Drive architecture codebase.
###


def parse_drive_architecture_xml(tree: ElementTree) -> nx.MultiGraph:
    root = tree.getroot()

    nodes = []
    edges = []
    for element in root.findall('./diagram/mxGraphModel/root/mxCell'):

        # Node.
        if 'value' in element.attrib:
            element.attrib['value'] = saxutils.unescape(element.attrib['value'])
            nodes.append((element.attrib['id'], {'attributes': element.attrib}))

        # Arrows for edges.
        elif 'source' in element.attrib or 'target' in element.attrib:
            edges.append((element.attrib['source'], element.attrib['target']))

    # Build network graph.
    graph = nx.MultiGraph()
    graph.add_nodes_from(nodes)
    graph.add_edges_from(edges)
    return graph


def build_directory_structure_from_graph(graph: nx.MultiGraph, source: str) -> dict:

    def get_node_value(node: str) -> str:
        return graph.nodes[node]['attributes']['value']

    paths = {}
    paths[source] = get_node_value(source)
    iter = nx.bfs_successors(graph, source)
    for node,successors in iter:
        for s in successors:
            paths[s] = os.path.join(paths[node], get_node_value(s))

    return paths
