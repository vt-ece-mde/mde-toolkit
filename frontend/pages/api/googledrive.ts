
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from "next-auth/next"
import { NextAuthOptions, Session } from "next-auth"
import { authOptions } from "./auth/[...nextauth]"

import { drive_v3, google } from "googleapis";
// import drive from "@googleapis/drive";

import { listFoldersInFolder, listFilesInFolder, parseDriveCSV } from '../../lib/googledrive';




const scopes = [
    "https://www.googleapis.com/auth/drive",
    // "https://www.googleapis.com/auth/drive.file",
    // "https://www.googleapis.com/auth/drive.readonly",
    // "https://www.googleapis.com/auth/drive.metadata.readonly",
    // "https://www.googleapis.com/auth/drive.appdata",
    // "https://www.googleapis.com/auth/drive.metadata",
    // "https://www.googleapis.com/auth/drive.photos.readonly",
];

// type Data = {
//     files: string
// }


// // Read contents of team names file and parse.
// async function parseDriveCSV(client: drive_v3.Drive, fileId: string, mimeType: string): Promise<string[][]> {

//     // Download CSV.
//     var data = '';
//     if (mimeType === 'text/csv') {
//         const res = await client.files.get({
//             supportsAllDrives: true,
//             fileId: fileId,
//             alt: 'media', // Denotes download.
//         })
//         // console.log(`res? ${JSON.stringify(res)}`)
//         data = (res.data as string);
//     }

//     // Download spreadsheet as CSV.
//     else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
//         const res = await client.files.export({
//             fileId: fileId,
//             mimeType: 'text/csv', // Force download as CSV.
//         })
//         // console.log(`res? ${JSON.stringify(res)}`)
//         data = (res.data as string);
//     }
//     // console.log(`data? ${JSON.stringify(data)}`)

//     // Parse CSV contents into rows.
//     const rows = csv2arr(data, ',');
//     return rows
// }


// async function listFilesInFolder(client: drive_v3.Drive, folderId: string): Promise<drive_v3.Schema$File[]> {

//     const mimeTypes = [
//         'text/plain',
//     ]
//     const res = await client.files.list({
//         supportsAllDrives: true,
//         includeItemsFromAllDrives: true,
//         // q: `'${folderId}' in parents and (mimeType = 'text/plain' or )`,
//         q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder'`,
//     })
//     const files = res.data.files;
//     if (files?.length) {
//         return files;
//     } else {
//         return [];
//     }

// }

// async function listFoldersInFolder(client: drive_v3.Drive, folderId: string): Promise<drive_v3.Schema$File[]> {
//     const res = await client.files.list({
//         supportsAllDrives: true,
//         includeItemsFromAllDrives: true,
//         q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
//     })
//     const files = res.data.files;
//     if (files?.length) {
//         return files;
//     } else {
//         return [];
//     }
// }



// https://github.com/nextauthjs/next-auth/issues/1162#issuecomment-766331341

interface FolderBlob {
    root: drive_v3.Schema$File;
    files: drive_v3.Schema$File[];
}
interface Data {
    blobs: FolderBlob[];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {

    res.status(401).json({ message: "this endpoint is no longer supported" });
    return;

    // Unpack query parameters.
    const { folderId } = req.query.folderId ? req.query : { folderId: null }

    const session: Session|null = await unstable_getServerSession(req, res, (authOptions as NextAuthOptions))

    if (!session) {
        res.status(401);
    }


    // const clientId = process.env.GOOGLE_CLIENT_ID;
    // const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;
    const redirectUri = "http://localhost:3000/api/auth/callback/google"

    // const token = await getToken({ req, secret: nextAuthSecret });
    // console.log(token)

    // const auth = new google.auth.OAuth2({
    //     clientId,
    //     clientSecret,
    //     redirectUri
    // });
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
        access_token: access_token,
        refresh_token: refresh_token,
        // scope: scopes.join(" "),
    });

    const client = google.drive({ auth, version: "v3" });

    const folder_id = "1D4SAg0_t_s9vrkiwSJEoWZFF_OiG-G29";


    var blobs: FolderBlob[] = [];

    // const parentFolders = await listFoldersInFolder(client, folder_id)
    // for (let index = 0; index < parentFolders.length; index++) {
    //     const root = parentFolders[index];
    //     if (root.id) {
    //         const files = await listFilesInFolder(client, root.id)
    //         blobs.push({
    //             root: root,
    //             files: files,
    //         })
    //     }
    //     // break;
    // }

    // const rows = await parseDriveCSV(client, "1Ke9FNG8R-nU2hEZvks-51xSXTs4MgaEY", "text/csv")
    // // const rows = await parseDriveCSV(client, "1sTTBQREkxEx6oTeV2yKwaOfNxGcdBci02324M6L_V-g", "application/vnd.google-apps.spreadsheet")

    // console.log(`rows? ${JSON.stringify(rows)}`)

    // res.status(200).json({blobs})


    // try {
    //     // const dres = await drive.files.list({ spaces: "appDataFolder" })
    //     const folder_id = "1D4SAg0_t_s9vrkiwSJEoWZFF_OiG-G29"
    //     // const folder_id = "0B3orFCWMG2hoZnlpdFppdV90LUE"
    //     const dres = await client.files.list({
    //         supportsAllDrives: true,
    //         includeItemsFromAllDrives: true,
    //         q: `'${folder_id}' in parents`,
    //     })
    //     const files = dres.data.files;
    //     if (files?.length) {
    //         files.map((file) => {
    //             console.log(`FILE: ${file.name}`);
    //         });
    //         res.status(200).json(files)
    //     } else {
    //         console.log('No files found');
    //         res.status(401)
    //     }
    // } catch (e) {
    //     console.log(e)
    //     res.status(500).json(e);
    // }

    // res.status(200).json({ name: 'John Doe' })
}