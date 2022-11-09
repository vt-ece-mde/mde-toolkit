import { drive_v3 } from "googleapis";
import { csv2arr } from "./parsing";

// Read contents of team names file and parse.
export async function parseDriveCSV(client: drive_v3.Drive, fileId: string, mimeType: string): Promise<string[][]> {

    // Download CSV.
    var data = '';
    if (mimeType === 'text/csv') {
        const res = await client.files.get({
            supportsAllDrives: true,
            fileId: fileId,
            alt: 'media', // Denotes download.
        })
        // console.log(`res? ${JSON.stringify(res)}`)
        data = (res.data as string);
    }

    // Download spreadsheet as CSV.
    else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        const res = await client.files.export({
            fileId: fileId,
            mimeType: 'text/csv', // Force download as CSV.
        })
        // console.log(`res? ${JSON.stringify(res)}`)
        data = (res.data as string);
    }
    // console.log(`data? ${JSON.stringify(data)}`)

    // Parse CSV contents into rows.
    const rows = csv2arr(data, ',');
    return rows
}


export async function listFilesInFolder(client: drive_v3.Drive, folderId: string): Promise<drive_v3.Schema$File[]> {

    const mimeTypes = [
        'text/plain',
    ]
    const res = await client.files.list({
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        // q: `'${folderId}' in parents and (mimeType = 'text/plain' or )`,
        q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder'`,
    })
    const files = res.data.files;
    if (files?.length) {
        return files;
    } else {
        return [];
    }

}

export async function listFoldersInFolder(client: drive_v3.Drive, folderId: string): Promise<drive_v3.Schema$File[]> {
    const res = await client.files.list({
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
    })
    const files = res.data.files;
    if (files?.length) {
        return files;
    } else {
        return [];
    }
}