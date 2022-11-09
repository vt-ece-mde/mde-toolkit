
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]"

import { drive_v3, google } from "googleapis";
// import drive from "@googleapis/drive";

import type { AuthSession } from '../../../../../lib/auth';

import { listFoldersInFolder, listFilesInFolder, listAllInFolder } from '../../../../../lib/googledrive';



// https://github.com/nextauthjs/next-auth/issues/1162#issuecomment-766331341


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {

    // Unpack query parameters.
    const { id, type } = req.query as { id: string, type?: 'all'|'files'|'folders' }
    if (!type) {
        res.status(400).json({ error: "must provide list type parameter" });
        return;
    }

    const session: AuthSession|null = await unstable_getServerSession(req, res, (authOptions as NextAuthOptions))
    if (!session) {
        res.status(401).json({ error: "session is undefined" });
    }
    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
        access_token: access_token,
        refresh_token: refresh_token,
    });

    const client = google.drive({ auth, version: "v3" });

    var blob = {};
    var statcode = 200;
    switch (type) {
        case 'all':
            blob = await listAllInFolder(client, id)
            break;

        case 'folders':
            blob = await listFoldersInFolder(client, id)
            break;
        
        case 'files':
            blob = await listFilesInFolder(client, id)
            break;
    
        default:
            statcode = 400;
            blob = { error: `invalid type ${JSON.stringify(type)}` }
            break;
    }
    res.status(statcode).json(blob)
}