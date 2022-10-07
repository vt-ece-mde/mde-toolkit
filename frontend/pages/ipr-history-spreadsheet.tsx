import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";

import getConfig from 'next/config';
import { fetch_assignment, fetch_assignments, fetch_courses } from "../lib/canvas";
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();
const API_URI = serverRuntimeConfig.API_URI || publicRuntimeConfig.API_URI;
const CANVAS_API_TOKEN = serverRuntimeConfig.CANVAS_API_TOKEN || publicRuntimeConfig.CANVAS_API_TOKEN;
console.log(`serverRuntimeConfig: ${JSON.stringify(serverRuntimeConfig)}`)
console.log(`publicRuntimeConfig: ${JSON.stringify(publicRuntimeConfig)}`)
console.log(`API_URI: ${JSON.stringify(API_URI)}`)
console.log(`CANVAS_API_TOKEN=${CANVAS_API_TOKEN}`)


type FormData = {
    course_id: number;
    n_feedback: number;
    assignment_ids: number[];
}

type FormProps = {
    course_list: any[];
    onSubmit(data: FormData): void;
}

function Form(props: FormProps) {

    const [courseId, setCourseId] = useState<number>(-1);
    const [numFeedback, setNumFeedback] = useState<string>(''); // String to allow typing.
    const [assignmentIdList, setAssignmentIdList] = useState<number[]>([]);
    const [assignmentList, setAssignmentList] = useState<any[]>([]);

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        const data: FormData = {
            course_id: courseId,
            n_feedback: Number(numFeedback),
            assignment_ids: assignmentIdList.filter(v => v !== -1), // Remove any placeholder IDs.
        }
        console.log(`data: ${JSON.stringify(data)}`);
        props.onSubmit(data);
    }

    const changeCourseId = async (course_id: number) => {

        console.log(`course_id: ${course_id}`);
        setCourseId(courseId);

        // Valid course ID.
        if (course_id !== -1) {
            const assignment_list = await fetch_assignments(course_id);
            setAssignmentList(assignment_list);
        }
        else {
            // setAssignmentIdList([-1]);
            setAssignmentList([]);
        }
        setAssignmentIdList([-1]);
    }

    const renderAssignmentIdElement = (index: number): any => {
        return (
            <div className="input-group mb-3" key={index}>
                <span className="input-group-text">Assignment ID</span>
                <select className="custom-select" id="assignment_selector" onChange={e => {
                    console.log(`e.target.value: ${e.target.value}`);
                    const tup: [number, number] = JSON.parse(e.target.value);
                    var items = [...assignmentIdList];
                    items[tup[0]] = tup[1];
                    setAssignmentIdList(items);
                }}>
                    <option value={ JSON.stringify([index, -1]) }>Select an assignment</option>
                    {assignmentList.map((assignment, i) => {
                        return (<option value={ JSON.stringify([index, i]) } key={ i }>{ assignment.name }</option>);
                    })}
                </select>



                {/* <input type="text" className="form-control" placeholder="Enter either a URL or an integer value" name="assignment_id" value={ formData.assignment_ids[index] } onChange={(event) => handleAssignmentIdChange(index, event)} required /> */}
                {
                    (assignmentIdList.length > 1) ? (
                        <button className="btn btn-danger" onClick={() => {
                            const items = [...assignmentIdList];
                            items.splice(index, 1); // Remove the `index` element.
                            setAssignmentIdList(items);
                        }}>delete</button>
                    ) : null
                }
                {
                    index === assignmentIdList.length-1 ? (
                        <button className="btn btn-success" onClick={() => setAssignmentIdList([...assignmentIdList, -1])}>add</button>
                    ) : null
                }
            </div>
        );
    }

    const renderAssignmentIdInputElement = (): any => {
        return assignmentIdList.map((_, index) => renderAssignmentIdElement(index));
    }

    const renderCourseIdInputElement = (): any => {
        return (
            <div className="input-group mb-3">
                <span className="input-group-text" id="basic-addon1">Course ID</span>
                <select className="custom-select" id="course_selector" onChange={e => changeCourseId(Number(e.target.value))}>
                    <option value={-1}>Select a course</option>
                    {props.course_list.map((course, index) => {
                        if (course.name.includes("4805") || course.name.includes("4806")) {
                            return (<option value={ course.id } key={ index }>{ course.name }</option>);
                        }
                    })}
                </select>
            </div>
        );
    }

    const renderFeedbackRoundInputElement = (): any => {
        return (
            <div className="input-group mb-3">
                <span className="input-group-text">Number of Feedback Rounds</span>
                <input type="number" pattern="[0-9]*" min="1" step="1" className="form-control" placeholder="Enter either a URL or an integer value" name="n_feedback" value={ numFeedback } onChange={e => setNumFeedback(e.target.value)} required />
            </div>
        );
    }

    return (
        <form className="needs-validation" onSubmit={ onSubmit }>
        <div className="mb-3 mt-3">

            {/* Number of feedback rounds. */}
            {renderFeedbackRoundInputElement()}

            {/* Course ID selector. */}
            {renderCourseIdInputElement()}

            {/* Render assignment ID drop-down boxes. */}
            {renderAssignmentIdInputElement()}
        </div>
        <button type="submit" className="btn btn-primary" disabled={ (courseId !== -1) && (numFeedback !== '') && (assignmentIdList.length > 0) }>Create Spreadsheet</button>
    </form>
    );


    // return (
    //     <form className="needs-validation" onSubmit={ (e) => onSubmit(formData, e) }>
    //     <div className="mb-3 mt-3">
    //         <div className="input-group mb-3">
    //             <span className="input-group-text">Course ID</span>
    //             <input type="text" className="form-control" placeholder="Enter either a URL or an integer value" name="course_id" value={ formData.course_id } onChange={handleCourseIdChange} required />
    //         </div>
    //         <div className="input-group mb-3">
    //             <span className="input-group-text"># Feedback Rounds</span>
    //             <input type="text" className="form-control" placeholder="Enter either a URL or an integer value" name="n_feedback" value={ formData.n_feedback } onChange={handleNumFeedbackChange} required />
    //         </div>
    //         {formData.assignment_ids.map((_, index) => renderAssignmentIdElement(index))}
    //     </div>
    //     <button type="submit" className="btn btn-primary">Create Spreadsheet</button>
    // </form>
    // );





    // // const [formData, setFormData] = useState<FormData>({...data})
    // const [formData, setFormData] = useState<FormData>({
    //     course_id: "",
    //     n_feedback: "",
    //     assignment_ids: [""],
    //     ...data,
    // });

    // const handleCourseIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    //     setFormData({
    //         ...formData,
    //         course_id: event.target.value,
    //     });
    // }

    // const handleNumFeedbackChange = (event: ChangeEvent<HTMLInputElement>) => {
    //     setFormData({
    //         ...formData,
    //         n_feedback: event.target.value,
    //     });
    // }


    // const handleAssignmentIdChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    //     // console.log(`changing assignment ID: ${index} to "${event.target.value}"`);

    //     let items = [...formData.assignment_ids];
    //     items[index] = event.target.value; // Update the desired index.

    //     setFormData({
    //         ...formData,
    //         assignment_ids: items,
    //     });
    // }

    // const addAssignmentId = () => {
    //     setFormData({
    //         ...formData,
    //         assignment_ids: [...formData.assignment_ids, ""],
    //     });
    // }

    // const removeAssignmnetId = (index: number) => {
    //     let items = [...formData.assignment_ids];
    //     items.splice(index, 1); // Remove the `index` element.
    //     setFormData({
    //         ...formData,
    //         assignment_ids: items,
    //     });
    // }

    


    // return (
    //     <form className="needs-validation" onSubmit={ (e) => onSubmit(formData, e) }>
    //     <div className="mb-3 mt-3">
    //         <div className="input-group mb-3">
    //             <span className="input-group-text">Course ID</span>
    //             <input type="text" className="form-control" placeholder="Enter either a URL or an integer value" name="course_id" value={ formData.course_id } onChange={handleCourseIdChange} required />
    //         </div>
    //         <div className="input-group mb-3">
    //             <span className="input-group-text"># Feedback Rounds</span>
    //             <input type="text" className="form-control" placeholder="Enter either a URL or an integer value" name="n_feedback" value={ formData.n_feedback } onChange={handleNumFeedbackChange} required />
    //         </div>
    //         {formData.assignment_ids.map((_, index) => renderAssignmentIdElement(index))}
    //     </div>
    //     <button type="submit" className="btn btn-primary">Create Spreadsheet</button>
    // </form>
    // );
}

const isURL = (s: string) => {
    try {
        return Boolean(new URL(s));
    } catch (e) {
        return false;
    }
}

export async function getServerSideProps() {
    // Fetch course list.
    // Filter out courses that do not have a `name` attribute.
    var course_list = await (await fetch_courses()).filter(c => 'name' in c);

    // Create component props and return.
    const props: IprHistorySpreadsheetProps = {
        course_list: course_list,
    }
    return { props: props }
}

type IprHistorySpreadsheetProps = {
    course_list: any[];
}

export default function IprHistorySpreadsheet({ course_list }: IprHistorySpreadsheetProps) {
    
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

    const submitForm = async (data: FormData) => {
        setIsFetching(true); // Enable fetch state.

        const params = new URLSearchParams([
            ['course_id', String(data.course_id)],
            ['n_feedback', String(data.n_feedback)],
            ...data.assignment_ids.map(s => ['assignment_id', String(s)]),
        ]);

        // Make API call.
        // const res = await fetch(`${API_URI}/courses/${data.course_id}/ipr-history-spreadsheet?${params}`, {
        const res = await fetch(`/api/mde/courses/${data.course_id}/ipr-history-spreadsheet?${params}`, {
            headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
        })
        const contentList = await res.json();
        console.log(JSON.stringify(contentList));

        setContentList(contentList); // Set content list.
        setIsFetching(false); // Disable fetch state.
    }


    if (isFetching === true) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ course_list } onSubmit={ submitForm } />
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
                <Form course_list={ course_list } onSubmit={ submitForm } />
            </div>
            </>
        );
    }

    else {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ course_list } onSubmit={ submitForm } />
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