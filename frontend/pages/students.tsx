import { fetch_courses, fetch_users } from "../lib/canvas";

import { FormEvent, useState } from "react";

import getConfig from 'next/config';
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();
const API_URI = serverRuntimeConfig.API_URI || publicRuntimeConfig.API_URI;
const CANVAS_API_TOKEN = serverRuntimeConfig.CANVAS_API_TOKEN || publicRuntimeConfig.CANVAS_API_TOKEN;
console.log(`serverRuntimeConfig: ${JSON.stringify(serverRuntimeConfig)}`)
console.log(`publicRuntimeConfig: ${JSON.stringify(publicRuntimeConfig)}`)
console.log(`API_URI: ${JSON.stringify(API_URI)}`)
console.log(`CANVAS_API_TOKEN=${CANVAS_API_TOKEN}`)

type FormData = {
    course_index: number;
}

type FormProps = {
    course_list: any[];
    onSubmit(data: FormData): void;
}

function Form(props: FormProps) {

    // State for current course index.
    const [courseIndex, setCourseIndex] = useState(-1);

    // Handle form event and pass data object to callback.
    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        props.onSubmit({
            course_index: courseIndex,
        })
    }

    return (
        <form className="needs-validation" onSubmit={ onSubmit }>
        <div className="mb-3 mt-3">
            <div className="input-group mb-3">
                <span className="input-group-text" id="basic-addon1">Course ID</span>
                <select className="custom-select" id="course_selector" onChange={e => setCourseIndex(Number(e.target.value))}>
                    <option value={-1}>Select a course</option>
                    {props.course_list.map((course, index) => {
                        if (course.name.includes("4805") || course.name.includes("4806")) {
                            return (<option value={ index } key={ index }>{ course.name }</option>);
                        }
                    })}
                </select>
            </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={ !(courseIndex >= 0) }>Get Students</button>
    </form>
    );
}



export async function getServerSideProps() {
    // Fetch course list.
    // Filter out courses that do not have a `name` attribute.
    var course_list = await (await fetch_courses()).filter(c => 'name' in c);

    // Create component props and return.
    const props: StudentsProps = {
        course_list: course_list,
    }
    return { props: props }
}

type StudentsProps = {
    course_list: any[];
}

export default function Students({ course_list }: StudentsProps) {
    
    // State variables.
    const [studentList, setStudentList] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    /**
     * Download the current course contents as a CSV file.
     */
     const download_as_csv = async () => {
        const delimiter = "|";

        // File contents.
        var csv: string[] = studentList.map((student) => [student.id, student.name, student.sortable_name].join(delimiter));

        // Header.
        csv.unshift("student_id,student_name,student_sortable_name");

        // Convert to string.
        const csv_string = csv.join("\n");

        const element = document.createElement("a");
        const file = new Blob([csv_string], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "students.csv"; // Name of file.
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    // const submitForm = async (event: FormEvent) => {
    const submitForm = async (data: FormData) => {
        setIsFetching(true);

        const course_id = course_list[data.course_index].id;

        // Get list of users.
        const user_list = await fetch_users(course_id);
        console.log(JSON.stringify(user_list));

        setStudentList(user_list);
        setIsFetching(false);
    }


    if (isFetching === true) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ course_list } onSubmit={ submitForm }/>
            </div>
            <div className="container-fluid p-5">
                {/* <h3>Loading...</h3> */}
                <div className="spinner-border" role="status">
                    {/* <span className="sr-only">Loading...</span> */}
                    <span>Loading...</span>
                </div>
            </div>
            </>
        );
    }

    else if (studentList === undefined || studentList.length === 0) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ course_list } onSubmit={ submitForm }/>
            </div>
            </>
        );
    }

    else {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ course_list } onSubmit={ submitForm }/>
            </div>
            <div className="container-fluid p-5">
                <h2>List of Students</h2>
                <div>
                    <button className="btn btn-success" onClick={ download_as_csv }>Download as CSV</button>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Student Sortable Name</th>
                            </tr>
                        </thead>
                        <tbody>
                        {studentList.map((student, index) => {
                            return (
                                <tr key={index}>
                                    <td>{ student.id }</td>
                                    <td>{ student.name }</td>
                                    <td>{ student.sortable_name }</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
        );
    }
}