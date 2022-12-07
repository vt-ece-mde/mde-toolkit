
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from "next-auth/next"
import { NextAuthOptions, Session } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]"

import { drive_v3, google } from "googleapis";
// import drive from "@googleapis/drive";

import { listFoldersInFolder, listFilesInFolder, listAllInFolder } from '../../../../../lib/googledrive';



// https://github.com/nextauthjs/next-auth/issues/1162#issuecomment-766331341


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    // Unpack query parameters.
    const params = req.query as drive_v3.Params$Resource$Files$Get;

    const session: Session|null = await unstable_getServerSession(req, res, (authOptions as NextAuthOptions))
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

    // Wrap call to Google API under the hood.
    // Return raw result and OK status code, or error information.
    client.files.get(params).then((r) => {
        res.status(200).json(r.data)
    }).catch((err) => {
        res.status(400).json({ error: err })
    })
}