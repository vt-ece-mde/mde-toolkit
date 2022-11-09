import { FormEvent, useEffect, useState } from "react";

import getConfig from 'next/config';
import { CourseIdInput } from "../../components/dynamiccanvasform";
import { fetch_courses } from "../../lib/canvas";
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();
const API_URI = serverRuntimeConfig.API_URI || publicRuntimeConfig.API_URI;
const CANVAS_API_TOKEN = serverRuntimeConfig.CANVAS_API_TOKEN || publicRuntimeConfig.CANVAS_API_TOKEN;





type FormData = {
    course_id: number;
}
type FormProps = {
    course_list: any[];
    onSubmit(data: FormData): void;
}
function Form(props: FormProps) {

    const [validForm, setValidForm] = useState<boolean>(false);
    const [courseId, setCourseId] = useState<number>(-1);

    useEffect(() => {
        const valid = (courseId !== -1);
        setValidForm(valid);
    }, [courseId]);


    /* Handle form submission. */
    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        const data: FormData = {
            course_id: courseId,
        }
        props.onSubmit(data);
    }


    return (
        <form className="needs-validation" onSubmit={ onSubmit }>
        {/* Course ID selector. */}
        <CourseIdInput course_list={props.course_list} onChange={setCourseId}/>
        <button type="submit" className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2.5 mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none dark:focus:ring-green-800" disabled={ !validForm }>Download Zip</button>
    </form>
    );
}


export default function TeamDirs() {

    const [isFetching, setIsFetching] = useState(false);
    const [courseList, setCourseList] = useState<any[]>([]);
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
    
            fetch(`${API_URI}/courses/${data.course_id}/expo/team-dirs?type=zip`, {
                headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
            }
            ).then(
                response => response.blob()
            ).then(blob => {
                const element = document.createElement("a");
                element.href = URL.createObjectURL(blob);
                element.download = `${data.course_id}_expo_team_dirs.zip`; // Name of file.
                document.body.appendChild(element); // Required for this to work in FireFox
                element.click();
                setIsFetching(false);
            }).catch(error => {
                console.log(error);
            })
        }

        if (typeof formData !== 'undefined') {
            getContent(formData);
        }
    }, [formData])


    if (isFetching === true) {
        return (<>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ courseList } onSubmit={ setFormData } />
            </div>
            <div className="d-flex align-items-center ml-5 mr-5">
                <h3>Loading...</h3>
                <div className="spinner-border ml-auto" role="status" aria-hidden="true"></div>
            </div>
        </>);
    }

    else {
        return (<>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form course_list={ courseList } onSubmit={ setFormData } />
            </div>
        </>);
    }
}