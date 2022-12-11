import { getSession } from 'next-auth/react'
import { GetServerSidePropsContext } from 'next';
import { drive_v3 } from "googleapis";

import { renderToStaticMarkup } from 'react-dom/server';
import  { useEffect, useState, useReducer, useCallback } from 'react';
import { PickerCallback } from 'react-google-drive-picker/dist/typeDefs';
import useDrivePicker from '../../components/googledrivepicker';
import { Session } from 'next-auth';

import { buildTeamsFromCSVStrings, Team } from '../../lib/parsing';

import TeamBrochure from '../../components/TeamBrochure';



async function driveCreateFile(params: { 
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

async function driveUpdateFile(params: { 
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

const driveGetFolderChildren = async (id: string, type: 'all'|'files'|'folders' = 'all'): Promise<drive_v3.Schema$File[]> => {

    // Create query string.
    let q = `'${id}' in parents and trashed=false`;
    switch (type) {
        case 'files':
            q = `${q} and mimeType != 'application/vnd.google-apps.folder'`
            break;
        case 'folders':
            q = `${q} and mimeType = 'application/vnd.google-apps.folder'`
            break;
        default: // type = 'all'
            break;
    }

    // Get all children in selected folder.
    const url = '/api/google/drive/files/list?' + new URLSearchParams({
        q: q,
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
    });
    const res = await fetch(url);
    const json = await res.json();
    console.log(`GOT RES: ${JSON.stringify(json)}`)

    const files = json.files;
    if (files !== undefined && files.length) {
        return files; // Return list of children.
    } else {
        return [];
    }
}

const driveGetFolderParent = async (id: string): Promise<string> => {
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


const parseTeamFolder = async (folder: drive_v3.Schema$File): Promise<ParsedTeam> => {
    if (folder.id) {
        const files = await driveGetFolderChildren(folder.id);

        interface TeamFiles {
            teamTitle?: drive_v3.Schema$File[];
            teamPhoto?: drive_v3.Schema$File[];
            teamPhotoNames?: drive_v3.Schema$File[];
            teamNames?: drive_v3.Schema$File[];
            teamSponsorNames?: drive_v3.Schema$File[];
            teamSMENames?: drive_v3.Schema$File[];
            teamPresentation?: drive_v3.Schema$File[];
            teamPoster?: drive_v3.Schema$File[];
            teamProjectSummary?: drive_v3.Schema$File[];
        }
        var teamFiles: TeamFiles = {}

        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const name = file.name?.toLowerCase();

            if (name?.includes('team_title')) {
                if (teamFiles.teamTitle === undefined) teamFiles.teamTitle = []; // Add new list entry.
                teamFiles.teamTitle?.push(file);
            }
            else if (name?.includes('team_photo_names')) {
                if (teamFiles.teamPhotoNames === undefined) teamFiles.teamPhotoNames = []; // Add new list entry.
                teamFiles.teamPhotoNames?.push(file);
            }
            else if (name?.includes('team_photo')) {
                if (teamFiles.teamPhoto === undefined) teamFiles.teamPhoto = []; // Add new list entry.
                teamFiles.teamPhoto?.push(file);
            }
            else if (name?.includes('team_names')) {
                if (teamFiles.teamNames === undefined) teamFiles.teamNames = []; // Add new list entry.
                teamFiles.teamNames?.push(file);
            }
            else if (name?.includes('sponsor_names')) {
                if (teamFiles.teamSponsorNames === undefined) teamFiles.teamSponsorNames = []; // Add new list entry.
                teamFiles.teamSponsorNames?.push(file);
            }
            else if (name?.includes('sme_names')) {
                if (teamFiles.teamSMENames === undefined) teamFiles.teamSMENames = []; // Add new list entry.
                teamFiles.teamSMENames?.push(file);
            }
            else if (name?.includes('presentation')) {
                if (teamFiles.teamPresentation === undefined) teamFiles.teamPresentation = []; // Add new list entry.
                teamFiles.teamPresentation?.push(file);
            }
            else if (name?.includes('poster')) {
                if (teamFiles.teamPoster === undefined) teamFiles.teamPoster = []; // Add new list entry.
                teamFiles.teamPoster?.push(file);
            }
            else if (name?.includes('project_summary')) {
                if (teamFiles.teamProjectSummary === undefined) teamFiles.teamProjectSummary = []; // Add new list entry.
                teamFiles.teamProjectSummary?.push(file);
            }
        }

        interface ParsedTeamContent {
            teamTitle?: string;
            teamPhoto?: string | string[]; // URL string.
            teamPhotoNames?: string;
            teamNames?: string[][];
            teamSponsorNames?: string[][];
            teamSMENames?: string[][];
            teamPresentation?: string | string[]; // URL string.
            teamPoster?: string | string[]; // URL string.
            teamProjectSummary?: string;
        }
        var parsedTeamContent: ParsedTeamContent = {};

        // Ensure that all team files have been set.
        // If any are missing then the team is invalid.
        console.log(`teamFiles? ${JSON.stringify(teamFiles)}`)
        const validTeam = (teamFiles.teamTitle !== undefined)
            && (teamFiles.teamTitle.length === 1)
            && (teamFiles.teamPhoto !== undefined)
            && (teamFiles.teamPhoto.length === 1)
            && (teamFiles.teamPhotoNames !== undefined)
            && (teamFiles.teamPhotoNames.length === 1)
            && (teamFiles.teamNames !== undefined)
            && (teamFiles.teamNames.length === 1)
            && (teamFiles.teamSponsorNames !== undefined)
            && (teamFiles.teamSponsorNames.length === 1)
            && (teamFiles.teamSMENames !== undefined)
            && (teamFiles.teamSMENames.length === 1)
            // && (teamFiles.teamPresentation !== undefined)
            // && (teamFiles.teamPresentation.length === 1)
            // && (teamFiles.teamPoster !== undefined)
            // && (teamFiles.teamPoster.length === 1)
            && (teamFiles.teamProjectSummary !== undefined)
            && (teamFiles.teamProjectSummary.length === 1);
        if (validTeam) {
            console.log(`team is valid: ${folder.name}`)

            // Team title.
            parsedTeamContent.teamTitle = await parseDriveFile(teamFiles.teamTitle![0].id!, teamFiles.teamTitle![0].mimeType!) as string;
            if (!parsedTeamContent.teamTitle) {
                parsedTeamContent.teamTitle = folder.name!; // Default to the folder name if anything went wrong.
            }

            // Team names.
            parsedTeamContent.teamNames = await parseDriveFile(teamFiles.teamNames![0].id!, teamFiles.teamNames![0].mimeType!) as string[][];

            // Team sponsor names.
            parsedTeamContent.teamSponsorNames = await parseDriveFile(teamFiles.teamSponsorNames![0].id!, teamFiles.teamSponsorNames![0].mimeType!) as string[][];
            
            // Team SME names.
            parsedTeamContent.teamSMENames = await parseDriveFile(teamFiles.teamSMENames![0].id!, teamFiles.teamSMENames![0].mimeType!) as string[][];

            // Team photo names text.
            parsedTeamContent.teamPhotoNames = await parseDriveFile(teamFiles.teamPhotoNames![0].id!, teamFiles.teamPhotoNames![0].mimeType!) as string;

            // Project summary text.
            parsedTeamContent.teamProjectSummary = await parseDriveFile(teamFiles.teamProjectSummary![0].id!, teamFiles.teamProjectSummary![0].mimeType!) as string;


            // "https://drive.google.com/file/d/1i_G1zbskuQ8N4dth5RF2pvBjCFr6AceN/view?usp=share_link"
            
            // Build URLs to images and other shareable content.
            if (teamFiles.teamPhoto![0].id) {
                parsedTeamContent.teamPhoto = [
                    `https://drive.google.com/uc?` + new URLSearchParams({
                        export: 'view',
                        id: teamFiles.teamPhoto![0].id,
                    }),
                    `./${teamFiles.teamPhoto![0].name}`,
                ];
            } else {
                parsedTeamContent.teamPhoto = ''; // Default to empty string.
            }
            if (teamFiles.teamPresentation !== undefined && teamFiles.teamPresentation![0].id) {
                parsedTeamContent.teamPresentation = [
                    `https://drive.google.com/uc?` + new URLSearchParams({
                        export: 'view',
                        id: teamFiles.teamPresentation![0].id,
                    }),
                    `./${teamFiles.teamPresentation![0].name}`,
                ];
            } else {
                parsedTeamContent.teamPresentation = ''; // Default to empty string.
            }
            if (teamFiles.teamPoster !== undefined && teamFiles.teamPoster![0].id) {
                parsedTeamContent.teamPoster = [
                    `https://drive.google.com/uc?` + new URLSearchParams({
                        export: 'view',
                        id: teamFiles.teamPoster![0].id,
                    }),
                    `./${teamFiles.teamPoster![0].name}`,
                ];
            } else {
                parsedTeamContent.teamPoster = ''; // Default to empty string.
            }

            console.log(`photoNames? ${JSON.stringify(parsedTeamContent.teamPhotoNames)}`)

            try {
                const team: Team = buildTeamsFromCSVStrings(
                    folder.name!,
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
                    root: folder,
                    status: {
                        ok: true,
                    },
                };
            } catch(error) {
                return {
                    status: {
                        error: error,
                    },
                };
            }

        }
        else {
            console.log(`team is NOT valid: ${folder.name}`)
            var message = 'The team is not valid for the following reasons:';
            message += (teamFiles.teamPhoto === undefined) ? '\n- Missing team photo' : '';
            message += (teamFiles.teamPhoto !== undefined && teamFiles.teamPhoto.length > 1) ? `\n- Multiple files found for team photo: ${JSON.stringify(teamFiles.teamPhoto.map(file => file.name))}` : '';
            message += (teamFiles.teamTitle === undefined) ? '\n- Missing team title' : '';
            message += (teamFiles.teamTitle !== undefined && teamFiles.teamTitle.length > 1) ? `\n- Multiple files found for team title: ${JSON.stringify(teamFiles.teamTitle.map(file => file.name))}` : '';
            message += (teamFiles.teamPhotoNames === undefined) ? '\n- Missing team photo names' : '';
            message += (teamFiles.teamPhotoNames !== undefined && teamFiles.teamPhotoNames.length > 1) ? `\n- Multiple files found for team photo names: ${JSON.stringify(teamFiles.teamPhotoNames.map(file => file.name))}` : '';
            message += (teamFiles.teamNames === undefined) ? '\n- Missing team names' : '';
            message += (teamFiles.teamNames !== undefined && teamFiles.teamNames.length > 1) ? `\n- Multiple files found for team names: ${JSON.stringify(teamFiles.teamNames.map(file => file.name))}` : '';
            message += (teamFiles.teamSponsorNames === undefined) ? '\n- Missing team sponsor names' : '';
            message += (teamFiles.teamSponsorNames !== undefined && teamFiles.teamSponsorNames.length > 1) ? `\n- Multiple files found for team sponsor names: ${JSON.stringify(teamFiles.teamSponsorNames.map(file => file.name))}` : '';
            message += (teamFiles.teamSMENames === undefined) ? '\n- Missing team SME names' : '';
            message += (teamFiles.teamSMENames !== undefined && teamFiles.teamSMENames.length > 1) ? `\n- Multiple files found for team SME names: ${JSON.stringify(teamFiles.teamSMENames.map(file => file.name))}` : '';
            message += (teamFiles.teamPresentation === undefined) ? '\n- Missing team presentation' : '';
            message += (teamFiles.teamPresentation !== undefined && teamFiles.teamPresentation.length > 1) ? `\n- Multiple files found for team presentation: ${JSON.stringify(teamFiles.teamPresentation.map(file => file.name))}` : '';
            message += (teamFiles.teamPoster === undefined) ? '\n- Missing team poster' : '';
            message += (teamFiles.teamPoster !== undefined && teamFiles.teamPoster.length > 1) ? `\n- Multiple files found for team poster: ${JSON.stringify(teamFiles.teamPoster.map(file => file.name))}` : '';
            message += (teamFiles.teamProjectSummary === undefined) ? '\n- Missing team project summary' : '';
            message += (teamFiles.teamProjectSummary !== undefined && teamFiles.teamProjectSummary.length > 1) ? `\n- Multiple files found for team project summary: ${JSON.stringify(teamFiles.teamProjectSummary.map(file => file.name))}` : '';
            return {
                status: {
                    error: message,
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
    root?: drive_v3.Schema$File,
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
    teams: new Map<string, ParsedTeam>(),
    selectedTeamToDisplay: '', // Empty for undefined, teams key string for defined.
}

type Action =
    | { type: 'set-state', state: State } // Override state.
    | { type: 'update-state', state: Partial<State> } // Update provided properties in state.
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



    const runParsingAlgorithm = useCallback(async (folders: drive_v3.Schema$File[]) => {

        dispatch({ type: 'update-state', state: {
            fetching: true,
            parentId: '',
            teams: new Map<string, ParsedTeam>(),
            selectedTeamToDisplay: '',
        }});

        // Get ID of parent folder to make subsequent Drive picker calls easier.
        var p;
        if (folders[0].id) {
            p = await driveGetFolderParent(folders[0].id);
            dispatch({ type: 'update-state', state: {
                parentId: p,
            }});
        }

        // Async parse team folders.
        // For each folder, add the parsed team to the state.
        folders.map(async (folder) => {
            const { team, status } = await parseTeamFolder(folder);
            dispatch({ type: 'set-team', id: folder.id!, pt: { team: team, status: status, root: folder } });
        })

        dispatch({ type: 'update-state', state: {
            fetching: false,
        }});
    }, [pickedFolders])


    useEffect(() => {
        // Only run if the picked file exists and has an ID parameter.
        if (pickedFolders.length > 0) {
            runParsingAlgorithm(pickedFolders);
        }
    }, [pickedFolders, runParsingAlgorithm]);



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
        // element.download = `${team.projectTitle}.html`; // Name of file.
        element.download = `team_page-${team.teamShortName}.html`; // This is what the file will be named in Drive.
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    const downloadTeamListAsHTML = async (teams: Team[]) => {
        for (let index = 0; index < teams.length; index++) {
            const team = teams[index];
            downloadTeamAsHTML(team);
        }
    }


    const uploadTeamToGoogleDrive = async (id: string, team: Team, root: drive_v3.Schema$File) => {

        dispatch({ type: 'set-team', id: id, pt: { team: team, root: root, status: {
            uploading: true,
        }}});

        // Convert team page to HTML string.
        const html: string = exportTeamBrochurePageToHTMLString(team);

        // Create file blob to upload.
        const file = new Blob([html], {type: 'text/html'});
        const name = `team_page-${team.teamShortName}.html`; // This is what the file will be named in Drive.
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

                if (json.error !== undefined) {
                    dispatch({ type: 'set-team', id: id, pt: { team: team, root: root, status: {
                        error: JSON.stringify(json.error, null, 4),
                    }}});

                    console.log(`Error in file creation: ${JSON.stringify(json)}`);
                }
                else {
                    dispatch({ type: 'set-team', id: id, pt: { team: team, root: root, status: {
                        ok: true,
                    }}});
                    console.log(`Created file: ${JSON.stringify(json)}`);
                }

                console.log(`Updated file: ${JSON.stringify(json)}`);
            } catch (error) {
                console.table(error);
                dispatch({ type: 'set-team', id: id, pt: { team: team, root: root, status: {
                    error: JSON.stringify(error, null, 4),
                }}});
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

                if (json.error !== undefined) {
                    dispatch({ type: 'set-team', id: id, pt: { team: team, root: root, status: {
                        error: JSON.stringify(json.error, null, 4),
                    }}});

                    console.log(`Error in file creation: ${JSON.stringify(json)}`);
                }
                else {
                    dispatch({ type: 'set-team', id: id, pt: { team: team, root: root, status: {
                        ok: true,
                    }}});
                    console.log(`Created file: ${JSON.stringify(json)}`);
                }
            } catch (error) {
                console.table(error);
                dispatch({ type: 'set-team', id: id, pt: { team: team, root: root, status: {
                    error: JSON.stringify(error, null, 4),
                }}});
            }
        }
    }



    const handlePickerSelection = async (data: PickerCallback) => {

        if (data.action === 'cancel') {
            console.log('User clicked cancel/close button')
        } 
        else if (data.action === 'picked') {
            console.log(`picked? ${JSON.stringify(data)}`);
            dispatch({ type: 'update-state', state: {
                pickedFolders: data.docs,
            }});
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
            // viewId: "FOLDERS", // Only show folders.
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
            <div className='text-6xl font-bold mb-4'>Team Brochure HTML Page Generator</div>
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
            <div className="pt-5">
                {pickedFolders.length === 0 ? null : <>
                    <div className=''>
                        <table className='table-fixed border-separate border-spacing-y-2 border-spacing-x-3'>
                            <thead className='text-xl font-bold'>
                                <tr>
                                    <td>Team Folder</td>
                                    <td>Status</td>
                                    <td>Links</td>
                                </tr>
                            </thead>
                            <tbody>
                                {pickedFolders.map(folder => <>
                                    <tr className='odd:bg-white even:bg-slate-100'>
                                        <td>
                                            <p>{folder.name}</p>
                                        </td>
                                        <td>
                                            {(() => {
                                            if (!teams.has(folder.id!)) {
                                                return (<>
                                                    <div className='flex flex-row'>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <p>Parsing...</p>
                                                    </div>
                                                </>);
                                            }
                                            else if (teams.get(folder.id!)?.status.uploading !== undefined) {
                                                return (<>
                                                    <div className='flex flex-row'>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <p>Uploading...</p>
                                                    </div>
                                                </>);
                                            }
                                            else if (teams.get(folder.id!)?.status.ok !== undefined) {
                                                return (<>
                                                    <div className='flex flex-row'>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 stroke-green-500">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                        <p>OK</p>
                                                    </div>
                                                </>);
                                            }
                                            else if (teams.get(folder.id!)?.status.error !== undefined) {
                                                return (<>
                                                    <div className='flex flex-row'>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 fill-red-500 stroke-current text-white">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                        </svg>
                                                        <p>Error (select Preview for details)</p>
                                                    </div>
                                                </>);
                                            }
                                        })()}
                                        </td>
                                        <td>
                                            <div className='flex flex-row space-x-4'>
                                                <a className='flex flex-row group relative' href='#' onClick={() => {
                                                    dispatch({ type: 'update-state', state: {
                                                        selectedTeamToDisplay: folder.id!,
                                                    }});
                                                }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                        <path d="M11.625 16.5a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75z" />
                                                        <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6 16.5c.66 0 1.277-.19 1.797-.518l1.048 1.048a.75.75 0 001.06-1.06l-1.047-1.048A3.375 3.375 0 1011.625 18z" clipRule="evenodd" />
                                                        <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                                                    </svg>
                                                    {/* Preview */}
                                                    <span className="absolute hidden group-hover:flex -left-5 -top-2 -translate-y-full w-36 px-2 py-1 bg-gray-700 rounded-lg text-center text-white text-sm after:content-[''] after:absolute after:left-1/4 after:top-[100%] after:-translate-x-1/2 after:border-8 after:border-x-transparent after:border-b-transparent after:border-t-gray-700 hover:invisible">
                                                        Open Page Preview
                                                    </span>
                                                </a>
                                                <a className='flex flex-row group relative' href={`https://drive.google.com/drive/u/1/folders/${folder.id}`} target="_blank" rel="noopener noreferrer">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                        <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {/* Open */}
                                                    <span className="absolute hidden group-hover:flex -left-5 -top-2 -translate-y-full w-36 px-2 py-1 bg-gray-700 rounded-lg text-center text-white text-sm after:content-[''] after:absolute after:left-1/4 after:top-[100%] after:-translate-x-1/2 after:border-8 after:border-x-transparent after:border-b-transparent after:border-t-gray-700 hover:invisible">
                                                        Link to Google Drive Folder
                                                    </span>
                                                </a>
                                                <div className='group relative'>
                                                    <button className='flex flex-row disabled:text-slate-400 enabled:hover:text-blue-600' onClick={() => {
                                                        const pt = teams.get(folder.id!);
                                                        if (pt?.status.ok !== undefined) {
                                                            uploadTeamToGoogleDrive(folder.id!, pt?.team!, folder);
                                                        }
                                                    }} disabled={teams.get(folder.id!)?.status.ok === undefined}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                        </svg>
                                                        <span className="absolute hidden group-hover:flex -left-5 -top-2 -translate-y-full w-36 px-2 py-1 bg-gray-700 rounded-lg text-center text-white text-sm after:content-[''] after:absolute after:left-1/4 after:top-[100%] after:-translate-x-1/2 after:border-8 after:border-x-transparent after:border-b-transparent after:border-t-gray-700 hover:invisible">
                                                            Upload to Google Drive
                                                        </span>
                                                    </button>
                                                </div>
                                                <div className='group relative'>
                                                    <button className='flex flex-row disabled:text-slate-400 enabled:hover:text-blue-600' onClick={() => {
                                                        const pt = teams.get(folder.id!);
                                                        if (pt?.status.ok !== undefined) {
                                                            downloadTeamAsHTML(pt?.team!);
                                                        }
                                                    }} disabled={teams.get(folder.id!)?.status.ok === undefined}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                        </svg>
                                                        <span className="absolute hidden group-hover:flex -left-5 -top-2 -translate-y-full w-24 px-2 py-1 bg-gray-700 rounded-lg text-center text-white text-sm after:content-[''] after:absolute after:left-1/4 after:top-[100%] after:-translate-x-1/2 after:border-8 after:border-x-transparent after:border-b-transparent after:border-t-gray-700 hover:invisible">
                                                            Download as HTML
                                                        </span>
                                                    </button>
                                                </div>

                                            </div>
                                        </td>
                                    </tr>
                                </>)}
                            </tbody>
                        </table>
                    </div>
                </>}
            </div>
            <div className="py-5">

                {/* Area to show list of teams selected. */}
                <div>
                {(teams.size > 0) && (!fetching) ? (<>
                    <div className="flex flex-col items-center justify-center">
                        <div className='mb-4'>How would you like to use the team brochure pages?</div>
                        <div className="flex flex-row space-x-3">
                            <button className="bg-yellow-500 hover:bg-yellow-700 disabled:bg-slate-400 disabled:text-slate-100 text-white font-bold py-2 px-4 rounded flex flex-row" onClick={ () => {
                                    if (pickedFolders.length > 0) {
                                        runParsingAlgorithm(pickedFolders)
                                    }
                                } } disabled={fetching || pickedFolders.length === 0}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 -ml-1 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                                    </svg>
                                    Parse Again
                            </button>
                            <button className="bg-green-500 hover:bg-green-700 disabled:bg-slate-400 disabled:text-slate-100 text-white font-bold py-2 px-4 rounded flex flex-row" onClick={ () => {
                                Array.from(teams.entries()).forEach(([id, pt], index) => {
                                    const {team, root, status} = pt;
                                    if (status.ok !== undefined) {
                                        uploadTeamToGoogleDrive(id, team!, root!);
                                    }
                                });
                            } } disabled={fetching || Array.from(teams.entries()).every(([id, pt]) => pt.status.ok === undefined)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 -ml-1 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                                Upload all to Google Drive
                            </button>
                            <button className="bg-purple-500 hover:bg-purple-700 disabled:bg-slate-400 disabled:text-slate-100 text-white font-bold py-2 px-4 rounded flex flex-row" onClick={ () => downloadTeamListAsHTML(Array.from(teams.values()).filter((pt) => pt.status.ok !== undefined).map((pt) => pt.team!)) } disabled={fetching || Array.from(teams.entries()).every(([id, pt]) => pt.status.ok === undefined)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 -ml-1 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Download all as HTML
                            </button>
                        </div>
                    </div>
                </>) : null}
                </div>

                {/* Area to display actual team pages. */}
                <div>
                    {(() => {
                        if (selectedTeamToDisplay.length > 0) {

                            return <TeamDisplayArea parentFolder={pickedFolders.find(folder => folder.id! === selectedTeamToDisplay)} pt={teams.get(selectedTeamToDisplay)}/>
                        }
                    })()}
                </div>
            </div>
        </div>
    </>);
}


/**
 * Simple component to display a paragraph element with text that possible contains newlines ('\n').
 * Inspired by: https://stackoverflow.com/a/73056801
 */
function MultilineParagraph(props: { text: string }) {
    return (<>
    <p>{props.text.split(/\n|\r\n/).map((segment: string, index: number) => (
        <>
            {index > 0 && <br />}
            {segment}
        </>
    ))}</p>
    </>);
}


function TeamDisplayArea(props: { parentFolder?: drive_v3.Schema$File, pt?: ParsedTeam }) {
    if (props.pt?.status.ok !== undefined) {
        return (<>
            <hr className="my-4 h-1 bg-gray-100 rounded border-0 md:my-10 dark:bg-gray-700" />
            <TeamBrochure {...props.pt.team!} />
        </>);
    }
    else if (props.pt?.status.error !== undefined) {
        return (<>
            <hr className="my-4 h-1 bg-gray-100 rounded border-0 md:my-10 dark:bg-gray-700" />
            <div className="flex flex-column">
                <div className='flex flex-row pb-3'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 fill-red-500 stroke-current text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <p>An error occurred with team: {props.parentFolder?.name || '(empty)'}</p>
                </div>
                <div className='pb-3'>
                    <a className='flex flex-row' href={`https://drive.google.com/drive/u/1/folders/${props.parentFolder?.id}`} target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-1">
                            <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z" clipRule="evenodd" />
                        </svg>
                        Jump to this team in Google Drive to fix manually (opens in new tab)
                    </a>
                </div>
                <div className='flex flex-column'>
                    <p className='text-lg font-bold'>Errors:</p>
                    <MultilineParagraph text={props.pt?.status.error}/>
                </div>
            </div>
        </>);
    }
    else {
        return (<>
            <hr className="my-4 h-1 bg-gray-100 rounded border-0 md:my-10 dark:bg-gray-700" />
            <p>Team does not exist: {props.parentFolder?.name || '(empty)'}</p>
        </>);
    }
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
        },
    }
}