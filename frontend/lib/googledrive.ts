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


export async function listQuery(args: {client: drive_v3.Drive, query: string, supportsAllDrives?: boolean, includeItemsFromAllDrives?: boolean }): Promise<drive_v3.Schema$File[]> {

    // Set defaults.
    args.supportsAllDrives = args.supportsAllDrives ? args.supportsAllDrives : true;
    args.includeItemsFromAllDrives = args.includeItemsFromAllDrives ? args.includeItemsFromAllDrives : true;

    const res = await args.client.files.list({
        supportsAllDrives: args.supportsAllDrives,
        includeItemsFromAllDrives: args.includeItemsFromAllDrives,
        q: args.query,
    })
    const files = res.data.files;
    if (files?.length) {
        return files;
    } else {
        return [];
    }
}


export async function listInFolder(args: {client: drive_v3.Drive, folderId: string, mimeType?: string, mimeTypeQuery?: string}): Promise<drive_v3.Schema$File[]> {

    // Build query.
    var query: string = `'${args.folderId}' in parents`;
    if (args.mimeType) {
        query = `${query} and mimeType = '${args.mimeType}'`
    } else if (args.mimeTypeQuery) {
        query = `${query} and ${args.mimeTypeQuery}`
    }

    return await listQuery({ 
        query: query, 
        client: args.client,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
    })
}


export async function listFilesInFolder(client: drive_v3.Drive, folderId: string): Promise<drive_v3.Schema$File[]> {
    return await listInFolder({ client, folderId, mimeTypeQuery: "mimeType != 'application/vnd.google-apps.folder'"})
}

export async function listFoldersInFolder(client: drive_v3.Drive, folderId: string): Promise<drive_v3.Schema$File[]> {
    return await listInFolder({ client, folderId, mimeTypeQuery: "mimeType = 'application/vnd.google-apps.folder'"})
}

export async function listAllInFolder(client: drive_v3.Drive, folderId: string): Promise<drive_v3.Schema$File[]> {
    return await listInFolder({ client, folderId })
}