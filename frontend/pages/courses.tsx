import { FormEvent, useState } from "react";

import getConfig from 'next/config';
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();
const API_URI = serverRuntimeConfig.API_URI || publicRuntimeConfig.API_URI;
const CANVAS_API_TOKEN = serverRuntimeConfig.CANVAS_API_TOKEN || publicRuntimeConfig.CANVAS_API_TOKEN;
console.log(`serverRuntimeConfig: ${JSON.stringify(serverRuntimeConfig)}`)
console.log(`publicRuntimeConfig: ${JSON.stringify(publicRuntimeConfig)}`)
console.log(`API_URI: ${JSON.stringify(API_URI)}`)
console.log(`CANVAS_API_TOKEN=${CANVAS_API_TOKEN}`)



type FormProps = {
    course_id?: string;
    onSubmit?(event: FormEvent): void;
}

function Form({ course_id, onSubmit }: FormProps) {
    return (
        <form className="needs-validation" onSubmit={ onSubmit }>
        <div className="mb-3 mt-3">
            <div className="input-group mb-3">
                <span className="input-group-text" id="basic-addon1">Course ID</span>
                <input type="text" className="form-control" id="course_id" placeholder="Enter either a URL or an integer value" name="course_id" value={ course_id } />
            </div>
        </div>
        <button type="submit" className="btn btn-primary">Get Courses</button>
    </form>
    );
}



export default function Courses() {

    // State variables.
    const [courseList, setCourseList] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    /**
     * Download the current course contents as a CSV file.
     */
    const download_as_csv = async () => {

        // File contents.
        var csv: string[] = courseList.map((course) => `${course.id},${course.name}`);

        // Header.
        csv.unshift("course_id,course_name");

        // Convert to string.
        const csv_string = csv.join("\n");

        const element = document.createElement("a");
        const file = new Blob([csv_string], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "courses.csv"; // Name of file.
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }


    /**
     * Async form submission callback.
     */
    const submitForm = async (event: FormEvent) => {
        event.preventDefault();
        setIsFetching(true);

        // Re-cast the target as the appropriate type.
        const target = event.target as HTMLFormElement
        console.log(`course_id=${target.course_id.value}`);

        // Build date payload.
        const query_params = {
            ...((target.course_id.value !== "") && {course_id: target.course_id.value}),
        }

        // Make API call.
        const res = await fetch(`${API_URI}/courses?` + new URLSearchParams(query_params), {
            headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
        })
        const courseList = await res.json();
        setCourseList(courseList);
        setIsFetching(false);
        // alert(`Got: ${JSON.stringify(result)}`);
    }


    // Loading view.
    if (isFetching === true) {
        console.log('HERE 1')
        return (
            <div>
                <div className="container-sm p-5">
                    <h3>Filters</h3>
                    <Form onSubmit={ submitForm }/>
                </div>
                <div className="container-fluid p-5">
                    <h3>Loading...</h3>
                </div>
            </div>
        );
    } 

    // No courses listed, not loading.
    else if (courseList === undefined || courseList.length === 0) {
        console.log('HERE 2')
        return (
            <div>
                <div className="container-sm p-5">
                    <h3>Filters</h3>
                    <Form onSubmit={ submitForm }/>
                </div>
            </div>
        );
    }

    // Courses to display, loading complete.
    else {
        console.log('HERE 3')
        return (
            <div>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form onSubmit={ submitForm }/>
            </div>
            <div className="container-fluid p-5">
                <h2>List of Courses</h2>
                <div>
                    <button className="btn btn-success" onClick={ download_as_csv }>Download as CSV</button>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Course ID</th>
                                <th>Course Name</th>
                            </tr>
                        </thead>
                        <tbody>
                        {courseList.map((course, index) => {
                            return (
                                <tr key={index}>
                                    <td>{ course.id }</td>
                                    <td>{ course.name }</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        );
    }
}