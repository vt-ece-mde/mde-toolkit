import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import getConfig from 'next/config';
import { fetch_assignment, fetch_assignments, fetch_courses } from "../lib/canvas";
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
    n_feedback: number;
    assignment_ids: number[];
}

type FormProps = {
    course_list: any[];
    init_form_data?: FormData;
    onSubmit(data: FormData): void;
}

function Form(props: FormProps) {

    const [validForm, setValidForm] = useState<boolean>(false);
    const [courseId, setCourseId] = useState<number>(-1);
    const [numFeedback, setNumFeedback] = useState<string>(''); // String to allow typing.
    const [assignmentIdList, setAssignmentIdList] = useState<number[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
    const [assignmentList, setAssignmentList] = useState<any[]>([]);


    useEffect(() => {
        if (props.init_form_data !== undefined) {
            console.log(`reusing form data: ${JSON.stringify(props.init_form_data)}`);
            setNumFeedback(JSON.stringify(props.init_form_data.n_feedback));
            setCourseId(props.init_form_data.course_id);
            // setAssignmentIdList(props.init_form_data.assignment_ids);
        }
    }, [props.init_form_data])


    /* Fetch content based on course ID change. */
    useEffect(() => {

        /* Fetch latest assignment list. */
        const getAssignments = async (course_id: number) => {
            setLoadingAssignments(true);
            const assignment_list = await fetch_assignments(course_id);
            setAssignmentList(assignment_list);
            setLoadingAssignments(false);
        }

        // Temporarily reset assignment IDs.
        setAssignmentList([]);

        // Get assignments for course.
        if (courseId !== -1) {
            getAssignments(courseId);
        }

    }, [courseId]);

    /* Update assignment list. */
    useEffect(() => {

        // Reset initial assignment ID list.
        if (assignmentList.length > 0) {
            console.log(`reset assignment IDs to [-1]`)
            setAssignmentIdList([-1]);
        } 
        else if (props.init_form_data !== undefined) {
            console.log(`props init is defined: ${props.init_form_data.assignment_ids}`)
            setAssignmentIdList(props.init_form_data.assignment_ids);
        }
        else {
            console.log(`empty assignment IDs`)
            setAssignmentIdList([]);
        }

    }, [assignmentList]);

    /* Update form validity. */
    useEffect(() => {
        const valid = (courseId !== -1) && (numFeedback.length > 0) && (assignmentIdList.filter(v => v !== -1).length > 0);
        setValidForm(valid);
    }, [courseId, numFeedback, assignmentIdList]);


    /* Handle form submission. */
    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        const data: FormData = {
            course_id: courseId,
            n_feedback: Number(numFeedback),
            assignment_ids: assignmentIdList.filter(v => v !== -1), // Remove any placeholder IDs.
        }
        props.onSubmit(data);
    }


    const renderAssignmentIdElement = (index: number): any => {
        return (
            <div className="input-group mb-3" key={index}>
                <span className="input-group-text">Assignment ID</span>
                <select className="custom-select" id="assignment_selector" onChange={e => setAssignmentIdList(prev => {
                        const tup: [number, number] = JSON.parse(e.target.value);
                        prev[tup[0]] = tup[1];
                        return prev;
                    })}>
                    <option value={ JSON.stringify([index, -1]) }>Select an assignment</option>
                    {assignmentList.map((assignment, i) => {
                        return (<option value={ JSON.stringify([index, assignment.id]) } key={ i }>{ assignment.name }</option>);
                    })}
                </select>
                {
                    (assignmentIdList.length > 1) ? (
                        <button className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800" onClick={() => setAssignmentIdList(prev => prev.filter((_,i) => i !== index))}>delete</button>
                    ) : null
                }
                {
                    index === assignmentIdList.length-1 ? (
                        <button className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2.5 mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800" onClick={() => setAssignmentIdList(prev => [...prev, -1])}>add</button>
                    ) : null
                }
            </div>
        );
    }

    const renderAssignmentIdInputElement = (): any => {
        return assignmentIdList.map((_, index) => renderAssignmentIdElement(index));
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
                <CourseIdInput course_list={props.course_list} onChange={setCourseId}/>

                {/* Render assignment ID drop-down boxes. */}
                {renderAssignmentIdInputElement()}
            </div>
            <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" disabled={ !validForm }>Create Spreadsheet</button>
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
        var csv: string[] = contentList.map((row: string[]) => row.join(delimiter));

        // Convert to string.
        const csv_string = csv.join("\n");

        const element = document.createElement("a");
        const file = new Blob([csv_string], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "ipr-history-spreadsheet.csv"; // Name of file.
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }


    if (isFetching === true) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ courseList } init_form_data={ formData } onSubmit={ setFormData } />
            </div>
            <div className="d-flex align-items-center ml-5 mr-5">
                <h3>Loading...</h3>
                <div className="spinner-border ml-auto" role="status" aria-hidden="true"></div>
            </div>
            </>
        );
    }

    else if (contentList === undefined || contentList.length === 0) {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ courseList } init_form_data={ formData } onSubmit={ setFormData } />
            </div>
            </>
        );

    }

    else {
        return (
            <>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ courseList } init_form_data={ formData } onSubmit={ setFormData } />
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