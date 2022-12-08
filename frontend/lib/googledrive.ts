import { drive_v3 } from "googleapis";
import { csv2arr } from "./parsing";

export const MimeTypesCSV = [
    'text/csv',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;
export type MimeTypesCSV = (typeof MimeTypesCSV)[number]; // This is both a constant list and a type.
export const MimeTypesSupported = MimeTypesCSV;
export type MimeTypesSupported = (typeof MimeTypesSupported)[number]; // Extends all possible mime types.


// Read contents of team names file and parse.
export async function parseDriveCSV(args: {client: drive_v3.Drive, fileId: string, mimeType: MimeTypesCSV }): Promise<string[][]> {

    // Download CSV.
    var data = '';
    if (args.mimeType === 'text/csv') {
        const res = await args.client.files.get({
            supportsAllDrives: true,
            fileId: args.fileId,
            alt: 'media', // Denotes download.
        })
        data = (res.data as string);
    }

    // Download spreadsheet as CSV.
    else if (args.mimeType === 'application/vnd.google-apps.spreadsheet' || args.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const res = await args.client.files.export({
            fileId: args.fileId,
            mimeType: 'text/csv', // Force download as CSV.
        })
        data = (res.data as string);
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