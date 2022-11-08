import { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';


export type TeamDropZoneProps = {
    onSubmit: (files: File[]) => void;
};
export default function TeamDropZone( props: TeamDropZoneProps ) {
    // https://react-dropzone.js.org/#section-basic-example
    const { acceptedFiles, fileRejections, getRootProps, getInputProps} = useDropzone({
        accept: {
            '*': [], // Everything?
        },
    });

    return (<>
        <div className="m-8">

            {/* Drag and drop area */}
            <div {...getRootProps()} className="p-8 bg-[#fafafa] border-dashed border-2 border-[#eeeeee] text-[#bdbdbd]">
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
            <div>
                <h4>Files</h4>
                <ul>{acceptedFiles.map(file => (
                    <li key={file.name}>
                        {file.name} - {file.size} bytes
                    </li>
                ))}</ul>
            </div>

            {/* Submit button */}
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={ _ => props.onSubmit(acceptedFiles) }>Generate Team Page</button>
        </div>
    </>);
}