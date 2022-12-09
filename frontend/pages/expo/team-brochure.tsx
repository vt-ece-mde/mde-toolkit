import { getSession } from 'next-auth/react'
import { GetServerSidePropsContext } from 'next';
import { drive_v3, google } from "googleapis";

import { renderToStaticMarkup } from 'react-dom/server';
import  { useEffect, useState, useReducer } from 'react';
import { PickerCallback } from 'react-google-drive-picker/dist/typeDefs';
import useDrivePicker from '../../components/googledrivepicker'
import { Session } from 'next-auth';

import { listFoldersInFolder } from '../../lib/googledrive';
import { buildTeamsFromCSVStrings, Team } from '../../lib/parsing';

import TeamBrochure from '../../components/TeamBrochure';



export async function driveCreateFile(params: { 
        token: string,
        file: Blob,
        metadata: any,
    }): Promise<any> {
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(params.metadata)], {type: 'application/json'}));
    form.append('file', params.file);

    const url = `https://www.googleapis.com/upload/drive/v3/files?` + new URLSearchParams({
        uploadType: 'multipart',
        supportsAllDrives: 'true',
    });

    try {
        const res = await fetch(url, {
            method: 'POST',
            body: form,
            headers: {
                'Authorization': `Bearer ${params.token}`,
            },
        });
        const json = await res.json();
        return json;
    } catch (error) {
        return error
    }
}

export async function driveUpdateFile(params: { 
        token: string,
        id: string,
        file: Blob,
        metadata: any,
    }): Promise<any> {
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(params.metadata)], {type: 'application/json'}));
    form.append('file', params.file);

    const url = `https://www.googleapis.com/upload/drive/v3/files/${params.id}?` + new URLSearchParams({
        uploadType: 'multipart',
        // uploadType: 'media',
        supportsAllDrives: 'true',
    });

    try {
        const res = await fetch(url, {
            method: 'PATCH',
            body: form,
            // body: params.file,
            headers: {
                'Authorization': `Bearer ${params.token}`,
            },
        });
        console.log(`RES: ${JSON.stringify(res)}`)
        const json = await res.json();
        return json;
    } catch (error) {
        // console.log(`ERROR: ${JSON.stringify(error)}`)
        console.table(error);
        return error
    }
}

// export async function driveUploadFileMultipart(token: string, file: Blob, metadata: any, method: string = 'POST', params: any = {}): Promise<any> {

//     const form = new FormData();
//     form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
//     form.append('file', file);

//     const url = `https://www.googleapis.com/upload/drive/v3/files?` + new URLSearchParams({
//         uploadType: 'multipart',
//         supportsAllDrives: 'true',
//         ...params,
//     });

//     try {
//         const res = await fetch(url, {
//             method: method,
//             body: form,
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//             },
//         });
//         const json = await res.json();
//         return json;
//     } catch (error) {
//         return error
//     }
// }

const driveGetFileIfExists = async (q: string): Promise<drive_v3.Schema$File[]> => {
    const url = '/api/google/drive/files/list?' + new URLSearchParams({
        // q: `name contains 'testhtml.html' and '1FKFkwJWfX9BQ1jJYzjFLC4FbrEpy830C' in parents`,
        q: q,
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
    });
    const res = await fetch(url);
    const json = await res.json();

    if (json.files !== undefined) {
        return json.files as drive_v3.Schema$File[];
    }
    else {
        return [];
    }
}


interface ParsedTeam {
    team?: Team,
    status: any,
}

type State = {
    fetching: boolean;
    parentId: string;
    pickedFolders: drive_v3.Schema$File[];
    teams: Map<string, ParsedTeam>;
    selectedTeamToDisplay: string;
}
const defaultState: State = { 
    fetching: false,
    parentId: '',
    pickedFolders: [],
    // teams: [],
    teams: new Map<string, ParsedTeam>(),
    selectedTeamToDisplay: '', // Empty for undefined, teams key string for defined.
    // teams_parsing_status: new Map<string, any>(),
    // teams: { id: string, },
}

type Action =
    | { type: 'set-state', state: State } // Override state.
    | { type: 'update-state', state: Partial<State> } // Update provided properties in state.
    // | { type: 'set-team', id: string, team?: Team, status?: any } // Update provided properties in state.
    | { type: 'set-team', id: string, pt: ParsedTeam } // Update provided properties in state.

export default function TeamBrochurePage({ session }: { session: Session }) {

    const reducer = (state: State, action: Action): State => {
        switch (action.type) {
            case 'update-state':
                return {
                    ...state, // Pull in previous state values.
                    ...action.state, // Override properties that were defined.
                };
            case 'set-state':
                return {
                    ...action.state,
                };
            case 'set-team':
                return {
                    ...state,
                    teams: state.teams.set(action.id, action.pt),
                    // teams: state.teams.set(action.id, action.team),
                    // teams_parsing_status: state.teams_parsing_status.set(action.id, action.status),
                };
            default:
                return defaultState;
        }
    }

    const [{
        fetching,
        parentId,
        pickedFolders,
        teams,
        selectedTeamToDisplay,
    }, dispatch] = useReducer(reducer, defaultState)

    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;

    const [openPicker, authResponse] = useDrivePicker();

    // console.log(`ACCESS TOKEN: ${JSON.stringify(access_token)}`)



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

        const parseTeamFolder = async (folder: drive_v3.Schema$File): Promise<{ team?: Team, status: any }> => {
            if (folder.id) {
                const files = await getFolderChildren(folder.id);

                interface TeamFiles {
                    // teamTitle?: drive_v3.Schema$File;
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
                // const validTeam = Object.values(teamFiles).every(f => f !== undefined && f.id !== undefined);
                console.log(`teamFiles? ${JSON.stringify(teamFiles)}`)
                const validTeam = (teamFiles.teamPhoto !== undefined)
                    && (teamFiles.teamPhotoNames !== undefined)
                    && (teamFiles.teamNames !== undefined)
                    && (teamFiles.teamSponsorNames !== undefined)
                    && (teamFiles.teamSMENames !== undefined)
                    && (teamFiles.teamPresentation !== undefined)
                    && (teamFiles.teamPoster !== undefined)
                    && (teamFiles.teamProjectSummary !== undefined);
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
                    parsedTeamContent.teamPhoto = teamFiles.teamPhoto?.id ? `https://drive.google.com/uc?` + new URLSearchParams({
                        export: 'view',
                        id: teamFiles.teamPhoto?.id,
                    }) : '';
                    parsedTeamContent.teamPresentation = teamFiles.teamPresentation?.id ? `https://drive.google.com/uc?` + new URLSearchParams({
                        export: 'view',
                        id: teamFiles.teamPresentation?.id,
                    }) : '';
                    parsedTeamContent.teamPoster = teamFiles.teamPoster?.id ? `https://drive.google.com/uc?` + new URLSearchParams({
                        export: 'view',
                        id: teamFiles.teamPoster?.id,
                    }) : '';

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

                    return {
                        team: team,
                        status: {
                            ok: true,
                        },
                    };

                }
                else {
                    console.log(`team is NOT valid: ${folder.name}`)
                    return {
                        status: {
                            error: 'team is not valid',
                        },
                    };
                }
            }
            return {
                status: {
                    error: 'undefined folder ID',
                },
            };
        }


        const run = async (folders: drive_v3.Schema$File[]) => {

            dispatch({ type: 'update-state', state: {
                fetching: true,
            }});

            // Get ID of parent folder to make subsequent Drive picker calls easier.
            var p;
            if (folders[0].id) {
                p = await getFolderParent(folders[0].id);
                dispatch({ type: 'update-state', state: {
                    parentId: p,
                }});
            }

            // Async parse team folders.
            // For each folder, add the parsed team to the state.
            folders.map(async (folder) => {
                const { team, status } = await parseTeamFolder(folder);
                dispatch({ type: 'set-team', id: folder.id!, pt: { team: team, status: status } });
                // // Add team to state if the team is defined.
                // if (team !== undefined) {
                //     dispatch({ type: 'set-team', id: folder.id!, team: team });
                // }
            })

            // const teams: Team[] = (await Promise.all<Team|undefined>(folders.map(parseTeamFolder))).filter(r => r !== undefined) as Team[];

            // console.log(`teams? ${JSON.stringify(teams)}`)

            dispatch({ type: 'update-state', state: {
                fetching: false,
                // teams: teams,
                // parentId: p,
            }});

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



    const exportTeamBrochurePageToHTMLString = (team: Team): string => {
        console.log(`[${team.projectTitle}] rendering team: ${JSON.stringify(team)}`)

        const component = <TeamBrochure {...team} />;

        // Convert component to static HTML markup.
        const markup = renderToStaticMarkup(component)

        // Build HTML core template and insert component markup.
        // Since component is styled using Tailwind, include the CDN reference.
        const html: string = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>${team.projectTitle}</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>
                <div>${markup}</div>
            </body>
        </html>
        `;

        console.log(`[${team.projectTitle}] HTML? ${JSON.stringify(html)}`)

        return html;
    }


    const downloadTeamAsHTML = async (team: Team) => {

        // Convert team page to HTML string.
        const html: string = exportTeamBrochurePageToHTMLString(team);

        // Download as HTML file.
        const file = new Blob([html], {type: 'text/html'});
        const element = document.createElement("a");
        element.href = URL.createObjectURL(file);
        element.download = `${team.projectTitle}.html`; // Name of file.
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    const downloadTeamListAsHTML = async (teams: Team[]) => {
        // teams.forEach((team, key) => {
        //     downloadTeamAsHTML(team);
        // });
        for (let index = 0; index < teams.length; index++) {
            const team = teams[index];
            downloadTeamAsHTML(team);
        }
    }

    const testUpload = async () => {
        // parent
        // 1FKFkwJWfX9BQ1jJYzjFLC4FbrEpy830C


        const html: string = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>Some Title</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>
                <div>This is a test</div>
                <div>Current date and time: ${new Date().toLocaleString()}</div>
            </body>
        </html>
        `;
        const file = new Blob([html], {type: 'text/html'});
        
        const name = 'testhtml.html' // This is what the file will be named in Drive.
        const parents = ['1FKFkwJWfX9BQ1jJYzjFLC4FbrEpy830C'] // This is the parent folder.
        const query = `name contains '${name}' and '${parents[0]}' in parents and trashed=false`;
        const files = await driveGetFileIfExists(query);

        if (files.length > 0) {
            console.log(`FILE ALREADY EXISTS: ${JSON.stringify(files)}`)

            const metadata = {
                name: 'testhtml.html', // This is what the file will be named in Drive.
                // Cannot add parents in metadata of update.
            }

            try {
                console.log(`in try`)
                const json = await driveUpdateFile({
                    token: access_token,
                    id: files[0].id!,
                    file: file,
                    metadata: metadata,
                })
                console.log(`GOT JSON BACK: ${JSON.stringify(json)}`)
            } catch (error) {
                console.table(error)
            }
        }
        else {

            const metadata = {
                name: 'testhtml.html', // This is what the file will be named in Drive.
                parents: ['1FKFkwJWfX9BQ1jJYzjFLC4FbrEpy830C'], // This is the parent folder.
            }

            console.log(`FILE DOES NOT EXIST`)
            driveCreateFile({
                token: access_token,
                file: file,
                metadata: metadata,
                })
                .then(json => console.log(`GOT JSON BACK: ${JSON.stringify(json)}`))
                .catch(err => console.log(`GOT ERR BACK: ${JSON.stringify(err)}`))
        }

        // driveUploadFileMultipart(access_token, file, metadata)
        //     .then(json => console.log(`GOT JSON BACK: ${JSON.stringify(json)}`))
        //     .catch(err => console.log(`GOT ERR BACK: ${JSON.stringify(err)}`))

        // TODO: check if file exists before creating. If it exists, then PATCH instead with fileId to update existing file. Otherwise POST to create new file.

        // TODO: upload team HTML files to Drive.
    }

    const uploadTeamToGoogleDrive = async (team: Team, root: drive_v3.Schema$File) => {

        // Convert team page to HTML string.
        const html: string = exportTeamBrochurePageToHTMLString(team);

        // Create file blob to upload.
        const file = new Blob([html], {type: 'text/html'});
        const name = `${team.projectTitle}.html`; // This is what the file will be named in Drive.
        // const parents = ['1FKFkwJWfX9BQ1jJYzjFLC4FbrEpy830C']; // This is the parent folder.
        const parents = [root.id!]; // This is the parent folder.

        // First, check if the file exists (using name as the identifier) at the given root directory.
        const query = `name contains '${name}' and '${parents[0]}' in parents and trashed=false`;
        const files = await driveGetFileIfExists(query);

        // File already exists.
        // So, update the existing file with new content.
        if (files.length > 0) {
            console.log(`FILE ALREADY EXISTS: ${JSON.stringify(files)}`)
            try {
                const json = await driveUpdateFile({
                    token: access_token,
                    id: files[0].id!,
                    file: file,
                    metadata: {
                        name: name,
                    },
                })
                console.log(`Updated file: ${JSON.stringify(json)}`)
            } catch (error) {
                console.table(error)
            }
        }
        else {
            console.log(`FILE DOES NOT EXIST`)
            try {
                const json = await driveCreateFile({
                    token: access_token,
                    file: file,
                    metadata: {
                        name: name,
                        parents: parents,
                    },
                    });
                console.log(`Created file: ${JSON.stringify(json)}`);
            } catch (error) {
                console.table(error)
            }
        }
    }

    const uploadTeamListToGoogleDrive = async (teams: Team[]) => {

        const uploadTeams = async (root: drive_v3.Schema$File) => {
            // teams.forEach((team, key) => {
            //     uploadTeamToGoogleDrive(team, root);
            // });
            for (let index = 0; index < teams.length; index++) {
                const team = teams[index];
                uploadTeamToGoogleDrive(team, root);
            }
        }


        const handler = async (data: PickerCallback) => {
            if (data.action === 'picked') {
                console.log(`UPLOADING TO: ${JSON.stringify(data.docs[0])}`)
                uploadTeams(data.docs[0]);
            }
        }


        openPicker({
            clientId: "", // Not required, but must be provided as an empty string.
            developerKey: "", // Not required, but must be provided as an empty string.
            token: access_token, // pass oauth token in case you already have one
            // viewId: "DOCS", // All Google Drive document types.
            viewId: "FOLDERS", // Only show folders.
            showUploadView: false,
            showUploadFolders: true,
            supportDrives: true,
            multiselect: false,
            callbackFunction: handler,
            // setParentFolder: parentId,
        })

        // for (let index = 0; index < teams.length; index++) {
        //     const team = teams[index];
        //     uploadTeamToGoogleDrive(team);
        // }
    }


    const handlePickerSelection = async (data: PickerCallback) => {

        if (data.action === 'cancel') {
            console.log('User clicked cancel/close button')
        } 
        else if (data.action === 'picked') {
            // console.log(`data? ${JSON.stringify(data)}`)
            console.log(`picked? ${JSON.stringify(data)}`)

            // dispatch({ type: 'set-pickedFolders', pickedFolders: data.docs });
            dispatch({ type: 'update-state', state: {
                pickedFolders: data.docs,
            }});

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
            // viewId: "DOCS", // All Google Drive document types.
            viewId: "FOLDERS", // Only show folders.
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

            <button onClick={ _ => testUpload() } className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2.5 mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800" disabled={ fetching }>TEST UPLOAD</button>

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
                    {/* <div key={file.id} className="pb-3">{JSON.stringify(file)}</div> */}
                    <div key={file.id} className="pb-3 flex flex-row">
                        <div>
                            <a href='#' onClick={() => {
                                dispatch({ type: 'update-state', state: {
                                    selectedTeamToDisplay: file.id!,
                                }});
                            }}>{JSON.stringify(file.name)}</a>
                        </div>
                        <div>
                            {(() => {
                                if (!teams.has(file.id!)) {
                                    return (<>
                                        <div className='flex flex-row ml-3'>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p>Loading...</p>
                                        </div>
                                    </>);
                                }
                                else if (teams.get(file.id!)?.status.ok !== undefined) {
                                    return (<>
                                        <div className='flex flex-row ml-3'>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 stroke-green-500">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                            <p>OK</p>
                                        </div>
                                    </>);
                                }
                                else if (teams.get(file.id!)?.status.error !== undefined) {
                                    // return (<p>ERROR: {JSON.stringify(teams.get(file.id!)?.status.error)}</p>);
                                    return (<>
                                        <div className='flex flex-row ml-3'>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 fill-red-500 stroke-current text-white">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                            </svg>
                                            <p>ERROR: {JSON.stringify(teams.get(file.id!)?.status.error)}</p>
                                        </div>
                                    </>);
                                }
                            })()}
                        </div>
                    </div>
                </>)}
            </div>
            <div className="p-5">

                {/* Area to show list of teams selected. */}
                <div>
                {teams.size > 0 ? (<>
                    <div className="flex flex-col items-center justify-center">
                        <div className='mb-4'>How would you like to use the team brochure pages?</div>
                        <div className="flex flex-row space-x-3">
                            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex flex-row" onClick={ () => uploadTeamListToGoogleDrive(Array.from(teams.values()).filter((pt) => pt.status.ok !== undefined).map((pt) => pt.team!)) }>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 -ml-1 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                                Upload to Google Drive
                            </button>
                            <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex flex-row" onClick={ () => downloadTeamListAsHTML(Array.from(teams.values()).filter((pt) => pt.status.ok !== undefined).map((pt) => pt.team!)) }>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 -ml-1 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                                Download as HTML
                            </button>
                        </div>
                    </div>
                </>) : null}
                </div>

                {/* Area to display actual team pages. */}
                <div>
                    {(() => {
                        if (selectedTeamToDisplay.length > 0) {
                            // const team = teams.get(selectedTeamToDisplay)!.team
                            if (teams.has(selectedTeamToDisplay) && teams.get(selectedTeamToDisplay)?.status.ok !== undefined) {
                                return (<>
                                    <hr className="my-4 h-1 bg-gray-100 rounded border-0 md:my-10 dark:bg-gray-700" />
                                    <TeamBrochure {...teams.get(selectedTeamToDisplay)!.team!} />
                                </>);
                            }
                            else {
                                return (<>
                                    <hr className="my-4 h-1 bg-gray-100 rounded border-0 md:my-10 dark:bg-gray-700" />
                                    <p>Team does not exist: {pickedFolders.find(folder => folder.id! === selectedTeamToDisplay)?.name || '(empty)'}</p>
                                </>);
                            }
                        }
                    })()}
                </div>
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