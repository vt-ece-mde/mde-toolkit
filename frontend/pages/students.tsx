import { fetch_courses, fetch_users } from "../lib/canvas";

import { FormEvent, useEffect, useState } from "react";

import getConfig from 'next/config';
import { CourseIdInput } from "../components/dynamiccanvasform";
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();
const API_URI = serverRuntimeConfig.API_URI || publicRuntimeConfig.API_URI;
const CANVAS_API_TOKEN = serverRuntimeConfig.CANVAS_API_TOKEN || publicRuntimeConfig.CANVAS_API_TOKEN;
console.log(`serverRuntimeConfig: ${JSON.stringify(serverRuntimeConfig)}`)
console.log(`publicRuntimeConfig: ${JSON.stringify(publicRuntimeConfig)}`)
console.log(`API_URI: ${JSON.stringify(API_URI)}`)
console.log(`CANVAS_API_TOKEN=${CANVAS_API_TOKEN}`)

type FormData = {
    course_id: number;
}

type FormProps = {
    course_list: any[];
    init_form_data?: FormData;
    onSubmit(data: FormData): void;
}

function Form(props: FormProps) {

    const [validForm, setValidForm] = useState<boolean>(false);
    const [courseId, setCourseId] = useState<number>(-1);

    useEffect(() => {
        if (props.init_form_data !== undefined) {
            console.log(`reusing form data: ${JSON.stringify(props.init_form_data)}`);
            setCourseId(props.init_form_data.course_id);
        }
    }, [props.init_form_data])

    useEffect(() => {
        const valid = (courseId !== -1);
        setValidForm(valid);
    }, [courseId]);

    // Handle form event and pass data object to callback.
    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        props.onSubmit({
            course_id: courseId,
        })
    }

    return (
        <form className="needs-validation" onSubmit={ onSubmit }>
        <div className="mb-3 mt-3">
            {/* Course ID selector. */}
            <CourseIdInput course_list={props.course_list} onChange={setCourseId}/>
        </div>
        <button type="submit" className="btn btn-primary" disabled={ !validForm }>Get Students</button>
    </form>
    );
}




export default function Students() {
    
    // State variables.
    const [studentList, setStudentList] = useState<any[]>([]);
    const [courseList, setCourseList] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [formData, setFormData] = useState<FormData>();

    /* Get course list on initial mount (no fetch on re-render). */
    useEffect(() => {
        const getCourseList = async () => {
            console.log(`Fetching courses...`)
            var course_list = await (await fetch_courses()).filter(c => 'name' in c);
            console.log(`Got courses: ${course_list.length}`)
            setCourseList(course_list);
        }
        getCourseList();
    }, []);


    /* Fetch content based on form data. */
    useEffect(() => {
        const getContent = async (data: FormData) => {
            setIsFetching(true); // Enable fetch state.
    
            // Get list of users.
            const user_list = await fetch_users(JSON.stringify(data.course_id), {enrollment_type: ['student']});
    
            setStudentList(user_list); // Set user list.
            setIsFetching(false); // Disable fetch state.
        }

        if (typeof formData !== 'undefined') {
            getContent(formData);
        }
    }, [formData])



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


    if (isFetching === true) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ courseList } onSubmit={ setFormData }/>
            </div>
            <div className="d-flex align-items-center ml-5 mr-5">
                <h3>Loading...</h3>
                <div className="spinner-border ml-auto" role="status" aria-hidden="true"></div>
            </div>
            </>
        );
    }

    else if (studentList === undefined || studentList.length === 0) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ courseList } onSubmit={ setFormData }/>
            </div>
            </>
        );
    }

    else {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ courseList } onSubmit={ setFormData }/>
            </div>
            <div className="container-fluid p-5">
                <h2>List of Students ({ studentList.length })</h2>
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