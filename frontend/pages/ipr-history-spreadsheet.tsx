import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";

import getConfig from 'next/config';
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();
const API_URI = serverRuntimeConfig.API_URI || publicRuntimeConfig.API_URI;
const CANVAS_API_TOKEN = serverRuntimeConfig.CANVAS_API_TOKEN || publicRuntimeConfig.CANVAS_API_TOKEN;
console.log(`serverRuntimeConfig: ${JSON.stringify(serverRuntimeConfig)}`)
console.log(`publicRuntimeConfig: ${JSON.stringify(publicRuntimeConfig)}`)
console.log(`API_URI: ${JSON.stringify(API_URI)}`)
console.log(`CANVAS_API_TOKEN=${CANVAS_API_TOKEN}`)


type FormData = {
    course_id: string;
    n_feedback: string;
    assignment_ids: string[];
}

type FormProps = {
    data?: FormData;
    onSubmit(data: FormData, event: FormEvent): void;
}

function Form({ data, onSubmit }: FormProps) {

    // const [formData, setFormData] = useState<FormData>({...data})
    const [formData, setFormData] = useState<FormData>({
        course_id: "",
        n_feedback: "",
        assignment_ids: [""],
        ...data,
    });

    const handleCourseIdChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            course_id: event.target.value,
        });
    }

    const handleNumFeedbackChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            n_feedback: event.target.value,
        });
    }


    const handleAssignmentIdChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
        // console.log(`changing assignment ID: ${index} to "${event.target.value}"`);

        let items = [...formData.assignment_ids];
        items[index] = event.target.value; // Update the desired index.

        setFormData({
            ...formData,
            assignment_ids: items,
        });
    }

    const addAssignmentId = () => {
        setFormData({
            ...formData,
            assignment_ids: [...formData.assignment_ids, ""],
        });
    }

    const removeAssignmnetId = (index: number) => {
        let items = [...formData.assignment_ids];
        items.splice(index, 1); // Remove the `index` element.
        setFormData({
            ...formData,
            assignment_ids: items,
        });
    }

    const renderAssignmentIdElement = (index: number): any => {
        return (
            <div className="input-group mb-3" key={index}>
                <span className="input-group-text">Assignment ID</span>
                <input type="text" className="form-control" placeholder="Enter either a URL or an integer value" name="assignment_id" value={ formData.assignment_ids[index] } onChange={(event) => handleAssignmentIdChange(index, event)} required />
                {
                    (formData.assignment_ids.length > 1) ? (
                        <button className="btn btn-danger" onClick={() => removeAssignmnetId(index)}>delete</button>
                    ) : null
                }
                {
                    index === formData.assignment_ids.length-1 ? (
                        <button className="btn btn-success" onClick={() => addAssignmentId()}>add</button>
                    ) : null
                }
            </div>
        );
    }


    return (
        <form className="needs-validation" onSubmit={ (e) => onSubmit(formData, e) }>
        <div className="mb-3 mt-3">
            <div className="input-group mb-3">
                <span className="input-group-text">Course ID</span>
                <input type="text" className="form-control" placeholder="Enter either a URL or an integer value" name="course_id" value={ formData.course_id } onChange={handleCourseIdChange} required />
            </div>
            <div className="input-group mb-3">
                <span className="input-group-text"># Feedback Rounds</span>
                <input type="text" className="form-control" placeholder="Enter either a URL or an integer value" name="n_feedback" value={ formData.n_feedback } onChange={handleNumFeedbackChange} required />
            </div>
            {formData.assignment_ids.map((_, index) => renderAssignmentIdElement(index))}
        </div>
        <button type="submit" className="btn btn-primary">Create Spreadsheet</button>
    </form>
    );
}

const isURL = (s: string) => {
    try {
        return Boolean(new URL(s));
    } catch (e) {
        return false;
    }
}


export default function IprHistorySpreadsheet() {
    
    const [contentList, setContentList] = useState<string[][]>([]);
    const [isFetching, setIsFetching] = useState(false);

    /**
     * Download the current course contents as a CSV file.
     */
     const download_as_csv = async () => {
        const delimiter = "|";

        // File contents.
        var csv: string[] = contentList.map((row: string[]) => row.join(delimiter));

        // // Header.
        // const 
        // csv.unshift("student_id,student_name,student_sortable_name");

        // Convert to string.
        const csv_string = csv.join("\n");

        const element = document.createElement("a");
        const file = new Blob([csv_string], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "ipr-history-spreadsheet.csv"; // Name of file.
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    const submitForm = async (data: FormData, event: FormEvent) => {
        event.preventDefault();
        
        // setFormData(data);
        
        setIsFetching(true);

        // // Re-cast the target as the appropriate type.
        // const target = event.target as HTMLFormElement
        // console.log(`course_id=${target.course_id.value}`);

        console.log(JSON.stringify(data));

        // Make API call.
        const res = await fetch(`${API_URI}/courses/${data.course_id}/ipr-history-spreadsheet?` + new URLSearchParams([
            ['course_id', data.course_id],
            ['n_feedback', data.n_feedback],
            ...data.assignment_ids.map(s => ['assignment_id', s]),
        ]), {
            headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
        })
        const contentList = await res.json();
        console.log(JSON.stringify(contentList));
        setContentList(contentList);
        setIsFetching(false);
    }


    if (isFetching === true) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form onSubmit={ submitForm } />
            </div>
            <div className="container-fluid p-5">
                <h3>Loading...</h3>
            </div>
            </>
        );
    }

    else if (contentList === undefined || contentList.length === 0) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form onSubmit={ submitForm } />
            </div>
            </>
        );
    }

    else {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form onSubmit={ submitForm } />
            </div>
            <div className="container-fluid p-5">
                <h2>IPR History Spreadsheet</h2>
                <div>
                    <button className="btn btn-success" onClick={ download_as_csv }>Download as CSV</button>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                {contentList[0].map((e: string, idx: number) => {
                                    return (<th key={idx} >{ e }</th>);
                                })}
                            </tr>
                        </thead>
                        <tbody>
                        {contentList.slice(1).map((item: string[], index: number) => {
                            return (
                                <tr key={index}>
                                    {item.map((e: string, idx: number) => {
                                        return (<td key={idx} >{ isURL(e) ? <Link href={e}>{e}</Link> : e }</td>);
                                    })}
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