import { getSession } from 'next-auth/react'
import { GetServerSidePropsContext } from 'next';
import { drive_v3, google } from "googleapis";

import  { useEffect, useState } from 'react';
import { PickerCallback } from 'react-google-drive-picker/dist/typeDefs';
import useDrivePicker from '../../components/googledrivepicker'
import { Session } from 'next-auth';

import { listFoldersInFolder } from '../../lib/googledrive';


export default function TeamBrochure({ session }: { session: Session }) {

    const [fileList, setFileList] = useState<drive_v3.Schema$File[]>([]);
    const [parentId, setParentId] = useState<string>(''); // Allows resume at previous folder on subsequent drive calls.

    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;

    const [openPicker, authResponse] = useDrivePicker();  


    const setFolderChildren = async (id: string) => {

        // Get all children in selected folder.
        console.log('fetching')
        const res = await fetch(`/api/google/drive/list/${id}?` + new URLSearchParams({
            type: 'all', // 'all'|'files'|'folders'
        }))
        const j = await res.json()
        console.log(`GOT RES: ${JSON.stringify(j)}`)

        // Set list of children.
        setFileList(j)
    }

    const setFolderParent = async (id: string) => {
        // Get parent folder for easy access next time.
        const res = await fetch(`/api/google/drive/get?`+ new URLSearchParams({
            fileId: id,
            fields: "parents",
            supportsAllDrives: 'true',
        }))
        const j = await res.json()
        console.log(`GOT res: ${JSON.stringify(j)}`)
        if (j.error === undefined ) {
            setParentId(j.parents[0])
        }
    }


    const handlePickerSelection = async (data: PickerCallback) => {

        if (data.action === 'cancel') {
            console.log('User clicked cancel/close button')
        } 
        else if (data.action === 'picked') {
            console.log(`data? ${JSON.stringify(data)}`)

            if (data.docs[0].mimeType === "application/vnd.google-apps.folder") {
                // Get all children in selected folder.
                setFolderChildren(data.docs[0].id)

                // Get parent folder for easy access next time.
                setFolderParent(data.docs[0].id)
            }
        }
        else if (data.action === 'loaded') {

        }
        console.log(data)
    }

    // Callback function to open the Google Drive picker.
    const handleOpenPicker = () => {
        openPicker({
            clientId: "", // Not required, but must be provided as an empty string.
            developerKey: "", // Not required, but must be provided as an empty string.
            token: access_token, // pass oauth token in case you already have one
            viewId: "DOCS", // All Google Drive document types.
            showUploadView: false,
            showUploadFolders: true,
            supportDrives: true,
            multiselect: false,
            callbackFunction: handlePickerSelection,
            setParentFolder: parentId,
        })
    }

    return (<>
        <div className='text-center pt-4'>
            <div className='text-6xl font-bold mb-4'>Team Brochure Page</div>
            <div className='mb-4'>Use the button below to select the team folders to process.</div>
            <button onClick={ _ => handleOpenPicker() } className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Read Drive</button>
            <div className="p-5">
                {fileList.map(file => <>
                    <div key={file.id} className="pb-3">{JSON.stringify(file)}</div>
                </>)}
            </div>
        </div>
    </>);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const { req, resolvedUrl } = context;
    const session = await getSession({ req });

    // Redirect to signin page.
    if (!session || session?.error === "RefreshAccessTokenError") {
        return {
            redirect: {
                destination: '/auth/signin?' + new URLSearchParams({
                    redirect: resolvedUrl,
                }),
                permanent: false,
            },
        }
    }

    // Render desired page with session.
    return {
        props: { 
            session,
            // drive,
        },
    }
}