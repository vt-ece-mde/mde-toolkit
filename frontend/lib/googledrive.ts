import { drive_v3, google, Auth } from "googleapis";
import { csv2arr } from "./parsing";


export const MimeTypesText = [
    'text/plain',
    'application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
export type MimeTypesText = (typeof MimeTypesText)[number]; // This is both a constant list and a type.
export const MimeTypesCSV = [
    'text/csv',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;
export type MimeTypesCSV = (typeof MimeTypesCSV)[number]; // This is both a constant list and a type.
export const MimeTypesSupported = [...MimeTypesText, ...MimeTypesCSV] as const;
// export const MimeTypesSupported = MimeTypesCSV;
export type MimeTypesSupported = (typeof MimeTypesSupported)[number]; // Extends all possible mime types.


export async function parseDriveFileText(args: { auth: Auth.OAuth2Client, fileId: string, mimeType: MimeTypesText }): Promise<string> {

    // Download as plain text.
    var data = '';
    if (args.mimeType === 'text/plain') {
        const client: drive_v3.Drive = google.drive({ auth: args.auth, version: 'v3' })
        const res = await client.files.get({
            supportsAllDrives: true,
            fileId: args.fileId,
            alt: 'media', // Denotes download.
        })
        data = (res.data as string);
    }

    // Download document as text.
    else if (
        args.mimeType === 'application/vnd.google-apps.document'
    ) {
        const client: drive_v3.Drive = google.drive({ auth: args.auth, version: 'v3' })
        const res = await client.files.export({
            fileId: args.fileId,
            mimeType: 'text/plain', // Force download as CSV.
        })
        data = (res.data as string);
    }

    // Download Microsoft Word as text.
    else if (args.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const token = (await args.auth.getAccessToken()).token;
        const url = `https://docs.google.com/document/d/${args.fileId}/export?format=txt`;
        const res = await fetch(url, { headers: {authorization: "Bearer " + token}});
        data = await res.text();
    }

    // Return parsed strings.
    return data
}


// Read contents of team names file and parse.
export async function parseDriveFileCSV(args: { auth: Auth.OAuth2Client, fileId: string, mimeType: MimeTypesCSV }): Promise<string[][]> {

    // Download CSV.
    var data = '';
    if (args.mimeType === 'text/csv') {
        const client: drive_v3.Drive = google.drive({ auth: args.auth, version: 'v3' })
        const res = await client.files.get({
            supportsAllDrives: true,
            fileId: args.fileId,
            alt: 'media', // Denotes download.
        })
        data = (res.data as string);
    }

    // Download spreadsheet as CSV.
    else if (args.mimeType === 'application/vnd.google-apps.spreadsheet') {
        const client: drive_v3.Drive = google.drive({ auth: args.auth, version: 'v3' })
        const res = await client.files.export({
            fileId: args.fileId,
            mimeType: 'text/csv', // Force download as CSV.
        })
        data = (res.data as string);
    }

    // Download Microsoft Excel as CSV.
    else if (args.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const token = (await args.auth.getAccessToken()).token;
        const url = `https://docs.google.com/spreadsheets/export?exportFormat=csv&id=${args.fileId}`;
        const res = await fetch(url, { headers: {authorization: "Bearer " + token}});
        data = await res.text();
    }

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