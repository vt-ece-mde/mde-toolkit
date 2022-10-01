import { FormEvent, useState } from "react";

import getConfig from 'next/config';
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();
const API_URI = serverRuntimeConfig.API_URI || publicRuntimeConfig.API_URI;
const CANVAS_API_TOKEN = serverRuntimeConfig.CANVAS_API_TOKEN || publicRuntimeConfig.CANVAS_API_TOKEN;





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
        <button type="submit" className="btn btn-success">Download Zip</button>
    </form>
    );
}


export default function TeamDirs() {

    const [isFetching, setIsFetching] = useState(false);


    const submitForm = async (event: FormEvent) => {
        event.preventDefault();
        setIsFetching(true);

        // Re-cast the target as the appropriate type.
        const target = event.target as HTMLFormElement
        console.log(`course_id=${target.course_id.value}`);

        // // Build date payload.
        // const query_params = {
        //     ...((target.course_id.value !== "") && {course_id: target.course_id.value}),
        // }


        fetch(`${API_URI}/courses/${target.course_id.value}/expo/team-dirs?type=zip`, {
            headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
        }
        ).then(
            response => response.blob()
        ).then(blob => {
            const element = document.createElement("a");
            element.href = URL.createObjectURL(blob);
            element.download = "test.zip"; // Name of file.
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
            setIsFetching(false);
        }).catch(error => {
            console.log(error);
        })


        // // Make API call.
        // const res = await fetch(`${API_URI}/courses/${target.course_id.value}/expo/team-dirs?type=zip`, {
        //     headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
        // })
        // const courseList = await res.data;
        // setIsFetching(false);
    }

    if (isFetching === true) {
        return (<>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form onSubmit={ submitForm }/>
            </div>
            <div className="container-fluid p-5">
                <h3>Loading...</h3>
            </div>
        </>);
    }

    else {
        return (<>
            <div className="container-sm p-5">
                <h3>Filters</h3>
                <Form onSubmit={ submitForm }/>
            </div>
        </>);
    }
}