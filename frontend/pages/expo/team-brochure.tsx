import { getSession } from 'next-auth/react'
import { GetServerSidePropsContext } from 'next';
import { drive_v3, google } from "googleapis";

import  { useEffect, useState, useReducer } from 'react';
import { PickerCallback } from 'react-google-drive-picker/dist/typeDefs';
import useDrivePicker from '../../components/googledrivepicker'
import { Session } from 'next-auth';

import { listFoldersInFolder } from '../../lib/googledrive';
import { buildTeamsFromCSVStrings, Team } from '../../lib/parsing';



type State = {
    fetching: boolean;
    // fileList: drive_v3.Schema$File[];
    parentId: string;
    // pickedFile: drive_v3.Schema$File;

    pickedFolders: drive_v3.Schema$File[];
}

type Action =
    | { type: 'set-pickedFolders', pickedFolders: drive_v3.Schema$File[] }
    | { type: 'set-fetching', fetching: boolean }

    // | { type: 'set-fileList', fileList: drive_v3.Schema$File[] }
    | { type: 'set-parentId', parentId: string }
    // | { type: 'picker-complete', fetching: boolean, fileList: drive_v3.Schema$File[], parentId: string }

export default function TeamBrochure({ session }: { session: Session }) {

    // const [fileList, setFileList] = useState<drive_v3.Schema$File[]>([]);
    // const [parentId, setParentId] = useState<string>(''); // Allows resume at previous folder on subsequent drive calls.
    // const [fetching, setFetching] = useState<boolean>(false);


    const reducer = (state: State, action: Action): State => {
        switch (action.type) {
            case 'set-fetching':
                console.log(`setting fetching: ${action.fetching}`)
                return {
                    ...state,
                    fetching: action.fetching,
                };
            // case 'set-fileList':
            //     return {
            //         ...state,
            //         fileList: action.fileList,
            //     };
            case 'set-parentId':
                return {
                    ...state,
                    parentId: action.parentId,
                };
            // case 'set-pickedFile':
            //     return {
            //         ...state,
            //         pickedFile: action.pickedFile,
            //     };
            // case 'picker-complete':
            //     return {
            //         ...state,
            //         fetching: action.fetching,
            //         fileList: action.fileList,
            //         parentId: action.parentId,
            //     };
            case 'set-pickedFolders':
                return {
                    ...state,
                    pickedFolders: action.pickedFolders,
                };
            default:
                return { 
                    fetching: false,
                    // fileList: [],
                    parentId: '',
                    // pickedFile: {},
                    pickedFolders: [],
                };
        }
    }

    const [{
        fetching,
        // fileList,
        parentId,
        // pickedFile,
        pickedFolders,
    }, dispatch] = useReducer(reducer, { 
        fetching: false,
        // fileList: [],
        parentId: '',
        // pickedFile: {},
        pickedFolders: [],
    })

    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;

    const [openPicker, authResponse] = useDrivePicker();  



    // const [pickedFile, setPickedFile] = useState<drive_v3.Schema$File>();


    useEffect(() => {
        const getFolderChildren = async (id: string): Promise<drive_v3.Schema$File[]> => {

            // Get all children in selected folder.
            const res = await fetch(`/api/google/drive/list/${id}?` + new URLSearchParams({
                // type: 'all', // 'all'|'files'|'folders'
                type: 'files', // 'all'|'files'|'folders'
            }))
            const j = await res.json()
            console.log(`GOT RES: ${JSON.stringify(j)}`)
    
            // Return list of children.
            return j;
        }

        const getFolderParent = async (id: string): Promise<string> => {
            // Get parent folder for easy access next time.
            const res = await fetch(`/api/google/drive/get?`+ new URLSearchParams({
                fileId: id,
                fields: "parents",
                supportsAllDrives: 'true',
            }))
            const j = await res.json()
            console.log(`GOT res: ${JSON.stringify(j)}`)
            if (j.error === undefined ) {
                return j.parents[0];
            } else {
                return '';
            }
        }

        const parseDriveFile = async (id: string, mimeType: string): Promise<string|string[][]> => {
            const res = await fetch(`/api/google/drive/parse/${id}?`+ new URLSearchParams({
                mimeType: mimeType,
            }))
            const j = await res.json()
            return j;
        }


        const run = async (folders: drive_v3.Schema$File[]) => {

            // Get ID of parent folder to make subsequent Drive picker calls easier.
            if (folders[0].id) {
                const p = await getFolderParent(folders[0].id);
                dispatch({ type: 'set-parentId', parentId: p });
            }

            const teams: (Team | undefined)[] = await Promise.all(folders.map(async (folder, index) => {
                if (folder.id) {
                    const files = await getFolderChildren(folder.id);

                    interface TeamFiles {
                        teamTitle?: drive_v3.Schema$File;
                        teamPhoto?: drive_v3.Schema$File;
                        teamPhotoNames?: drive_v3.Schema$File;
                        teamNames?: drive_v3.Schema$File;
                        teamSponsorNames?: drive_v3.Schema$File;
                        teamSMENames?: drive_v3.Schema$File;
                        teamPresentation?: drive_v3.Schema$File;
                        teamPoster?: drive_v3.Schema$File;
                        teamProjectSummary?: drive_v3.Schema$File;
                    }
                    var teamFiles: TeamFiles = {}

                    for (let index = 0; index < files.length; index++) {
                        const file = files[index];
                        const name = file.name?.toLowerCase();

                        if (name?.includes('team_photo_names')) {
                            teamFiles.teamPhotoNames = file;
                        }
                        else if (name?.includes('team_photo')) {
                            teamFiles.teamPhoto = file;
                        }
                        else if (name?.includes('team_names')) {
                            teamFiles.teamNames = file;
                        }
                        else if (name?.includes('sponsor_names')) {
                            teamFiles.teamSponsorNames = file;
                        }
                        else if (name?.includes('sme_names')) {
                            teamFiles.teamSMENames = file;
                        }
                        else if (name?.includes('presentation')) {
                            teamFiles.teamPresentation = file;
                        }
                        else if (name?.includes('poster')) {
                            teamFiles.teamPoster = file;
                        }
                        else if (name?.includes('project_summary')) {
                            teamFiles.teamProjectSummary = file;
                        }
                    }

                    interface ParsedTeamContent {
                        teamTitle?: string;
                        teamPhoto?: string; // URL string.
                        teamPhotoNames?: string;
                        teamNames?: string[][];
                        teamSponsorNames?: string[][];
                        teamSMENames?: string[][];
                        teamPresentation?: string; // URL string.
                        teamPoster?: string; // URL string.
                        teamProjectSummary?: string;
                    }
                    var parsedTeamContent: ParsedTeamContent = {};

                    // Ensure that all team files have been set.
                    // If any are missing then the team is invalid.
                    const validTeam = Object.values(teamFiles).every(f => f !== undefined);
                    if (validTeam) {
                        console.log(`team is valid: ${folder.name}`)
                        
                        // Team names.
                        // if (teamFiles.teamNames && teamFiles.teamNames.id && teamFiles.teamNames.mimeType) {
                        parsedTeamContent.teamNames = await parseDriveFile(teamFiles.teamNames!.id!, teamFiles.teamNames!.mimeType!) as string[][];
                        // }

                        // Team names.
                        // if (teamFiles.teamNames && teamFiles.teamNames.id && teamFiles.teamNames.mimeType) {
                        parsedTeamContent.teamNames = await parseDriveFile(teamFiles.teamNames!.id!, teamFiles.teamNames!.mimeType!) as string[][];
                        // }

                        // Team sponsor names.
                        // if (teamFiles.teamSponsorNames && teamFiles.teamSponsorNames.id && teamFiles.teamSponsorNames.mimeType) {
                        parsedTeamContent.teamSponsorNames = await parseDriveFile(teamFiles.teamSponsorNames!.id!, teamFiles.teamSponsorNames!.mimeType!) as string[][];
                        // }
                        
                        // Team SME names.
                        // if (teamFiles.teamSMENames && teamFiles.teamSMENames.id && teamFiles.teamSMENames.mimeType) {
                        parsedTeamContent.teamSMENames = await parseDriveFile(teamFiles.teamSMENames!.id!, teamFiles.teamSMENames!.mimeType!) as string[][];
                        // }

                        // Team photo names text.
                        parsedTeamContent.teamPhotoNames = await parseDriveFile(teamFiles.teamPhotoNames!.id!, teamFiles.teamPhotoNames!.mimeType!) as string;

                        // Project summary text.
                        parsedTeamContent.teamProjectSummary = await parseDriveFile(teamFiles.teamProjectSummary!.id!, teamFiles.teamProjectSummary!.mimeType!) as string;


                        // "https://drive.google.com/file/d/1i_G1zbskuQ8N4dth5RF2pvBjCFr6AceN/view?usp=share_link"
                        
                        // Build URLs to images and other shareable content.
                        parsedTeamContent.teamPhoto = `https://drive.google.com/file/d/${teamFiles.teamPhoto?.id}/preview`;
                        parsedTeamContent.teamPresentation = `https://drive.google.com/file/d/${teamFiles.teamPresentation?.id}/preview`;
                        parsedTeamContent.teamPoster = `https://drive.google.com/file/d/${teamFiles.teamPoster?.id}/preview`;

                        // return parsedTeamContent;

                        parsedTeamContent.teamTitle = folder.name!;

                        console.log(`photoNames? ${JSON.stringify(parsedTeamContent.teamPhotoNames)}`)

                        const team: Team = buildTeamsFromCSVStrings(
                            parsedTeamContent.teamTitle!,
                            parsedTeamContent.teamNames!,
                            parsedTeamContent.teamSponsorNames!,
                            parsedTeamContent.teamSMENames!,
                            parsedTeamContent.teamProjectSummary!,
                            parsedTeamContent.teamPhoto!,
                            '', // team video
                            parsedTeamContent.teamPresentation!,
                            parsedTeamContent.teamPoster!,
                            parsedTeamContent.teamPhotoNames!,
                        )

                        return team;

                    }
                    else {
                        console.log(`team is NOT valid: ${folder.name}`)
                    }
                }
            }))

            console.log(`teams? ${JSON.stringify(teams)}`)

            // // Set the fetching state.
            // dispatch({ type: 'set-fetching', fetching: true });

            // // Get folder and parent content.
            // const l = await getFolderChildren(id);

            // // Set folder and parent content and reset the fetching state.
            // dispatch({ type: 'picker-complete', 
            //     fetching: false,
            //     fileList: l,
            //     parentId: p,
            // });
        }

        // Only run if the picked file exists and has an ID parameter.
        // if (pickedFile && pickedFile.id) {
        //     run(pickedFile.id);
        // }
        if (pickedFolders.length > 0) {
            run(pickedFolders);
        }
    }, [pickedFolders]);




    // const setFolderChildren = async (id: string) => {

    //     // Get all children in selected folder.
    //     console.log('fetching')
    //     const res = await fetch(`/api/google/drive/list/${id}?` + new URLSearchParams({
    //         type: 'all', // 'all'|'files'|'folders'
    //     }))
    //     const j = await res.json()
    //     console.log(`GOT RES: ${JSON.stringify(j)}`)

    //     // Set list of children.
    //     setFileList(j)
    // }

    // const setFolderParent = async (id: string) => {
    //     // Get parent folder for easy access next time.
    //     const res = await fetch(`/api/google/drive/get?`+ new URLSearchParams({
    //         fileId: id,
    //         fields: "parents",
    //         supportsAllDrives: 'true',
    //     }))
    //     const j = await res.json()
    //     console.log(`GOT res: ${JSON.stringify(j)}`)
    //     if (j.error === undefined ) {
    //         setParentId(j.parents[0])
    //     }
    // }


    const handlePickerSelection = async (data: PickerCallback) => {

        if (data.action === 'cancel') {
            console.log('User clicked cancel/close button')
        } 
        else if (data.action === 'picked') {
            // console.log(`data? ${JSON.stringify(data)}`)
            console.log(`picked? ${JSON.stringify(data)}`)

            dispatch({ type: 'set-pickedFolders', pickedFolders: data.docs });

            // if (data.docs[0].mimeType === "application/vnd.google-apps.folder") {

            //     // Set the current picked file; lets the React hooks take care of the rest.
            //     dispatch({ type: 'set-pickedFile', pickedFile: data.docs[0] });
            // }
        }
        else if (data.action === 'loaded') {}
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
            multiselect: true,
            callbackFunction: handlePickerSelection,
            setParentFolder: parentId,
        })
    }


    return (<>
        <div className='flex flex-col items-center justify-center pt-4'>

            {/* Title with instruction text */}
            <div className='text-6xl font-bold mb-4'>Team Brochure Page</div>
            <div className='mb-4'>Use the button below to select the team folders to process.</div>
            <div className='mb-2'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="animate-bounce w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
            </div>

            {/* Button to open Google Drive picker */}
            <button onClick={ _ => handleOpenPicker() } className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" disabled={ fetching }>Open Google Drive Picker</button>

            {/* Loading spinner */}
            { fetching ? (<>
                <div className='flex items-center justify-center'>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Loading...</p>
            </div>
            </>) : null }

            {/* Display selected file contents. */}
            <div className="p-5">
                {pickedFolders.map(file => <>
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