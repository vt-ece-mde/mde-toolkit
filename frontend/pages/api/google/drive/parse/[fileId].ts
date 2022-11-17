
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from "next-auth/next"
import { NextAuthOptions, Session } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]"

import { drive_v3, google } from "googleapis";
// import drive from "@googleapis/drive";

import { parseDriveCSV, MimeTypesSupported, MimeTypesCSV } from '../../../../../lib/googledrive';



// https://github.com/nextauthjs/next-auth/issues/1162#issuecomment-766331341


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {

    // Unpack query parameters.
    const { fileId, mimeType } = req.query as { fileId: string, mimeType?: MimeTypesSupported }
    if (!mimeType) {
        res.status(400).json({ error: "must provide list type parameter" });
        return;
    }

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

    var blob;
    var statcode = 200;
    if (MimeTypesCSV.includes(mimeType)) {
        blob = await parseDriveCSV({ client, fileId, mimeType: mimeType as any })
    }
    else {
        statcode = 400;
        blob = { error: `invalid mime type ${JSON.stringify(mimeType)}` }
    }
    res.status(statcode).json(blob)
}