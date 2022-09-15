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

function Form(props: FormProps) {
    return (
        <form className="needs-validation" onSubmit={ props.onSubmit }>
        <div className="mb-3 mt-3">
            <div className="input-group mb-3">
                <span className="input-group-text" id="basic-addon1">Course ID</span>
                <input type="text" className="form-control" id="course_id" placeholder="Enter either a URL or an integer value" name="course_id" value={ props.course_id } required />
            </div>
        </div>
        <button type="submit" className="btn btn-primary">Get Students</button>
    </form>
    );
}


export default function Students() {
    
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

    const submitForm = async (event: FormEvent) => {
        event.preventDefault();
        setIsFetching(true);

        // Re-cast the target as the appropriate type.
        const target = event.target as HTMLFormElement
        console.log(`course_id=${target.course_id.value}`);

        // Make API call.
        const res = await fetch(`${API_URI}/courses/${target.course_id.value}/students`, {
            headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
        })
        const studentList = await res.json();
        console.log(JSON.stringify(studentList));
        setStudentList(studentList);
        setIsFetching(false);
    }


    if (isFetching === true) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form onSubmit={ submitForm }/>
            </div>
            <div className="container-fluid p-5">
                <h3>Loading...</h3>
            </div>
            </>
        );
    }

    else if (studentList === undefined || studentList.length === 0) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form onSubmit={ submitForm }/>
            </div>
            </>
        );
    }

    else {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form onSubmit={ submitForm }/>
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