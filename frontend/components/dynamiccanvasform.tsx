import { useState } from "react";

export type CourseIdInputProps = {
    course_list: any[];
    onChange(course_id: number): void;
}
export function CourseIdInput({ course_list, onChange }: CourseIdInputProps) {
    return (
        <div className="input-group mb-3">
            <span className="input-group-text" id="basic-addon1">Course ID</span>
            <select className="custom-select" id="course_selector" onChange={e => onChange(Number(e.target.value))}>
                <option value={-1}>Select a course</option>
                {course_list.map((course, index) => {
                    if (course.name.includes("4805") || course.name.includes("4806")) {
                        return (<option value={ course.id } key={ index }>{ course.name }</option>);
                    }
                })}
            </select>
        </div>
    );
}