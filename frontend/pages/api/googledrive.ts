
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import { authOptions } from "./auth/[...nextauth]"

import { google } from "googleapis";

import type { AuthSession } from '../../lib/auth';




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


// https://github.com/nextauthjs/next-auth/issues/1162#issuecomment-766331341

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse//<Data>
) {

    const session: AuthSession|null = await unstable_getServerSession(req, res, (authOptions as NextAuthOptions))

    console.log(session?.user?.name)
    console.log(session?.user?.email)


    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;
    const redirectUri = "http://localhost:3000/api/auth/callback/google"

    // const token = await getToken({ req, secret: nextAuthSecret });
    // console.log(token)

    console.log(scopes.join(" "))


    if (!session) {
        res.status(401);
    }

    const auth = new google.auth.OAuth2({
        clientId,
        clientSecret,
        redirectUri
    });
    auth.setCredentials({
        access_token: access_token,
        refresh_token: refresh_token,
        scope: scopes.join(" "),
    });

    const drive = google.drive({ auth, version: "v3" });

    try {
        // const dres = await drive.files.list({ spaces: "appDataFolder" })
        const dres = await drive.files.list()
        const files = dres.data.files;
        if (files?.length) {
            files.map((file) => {
                console.log(`FILE: ${file.name}`);
            });
            res.status(200).json(files)
        } else {
            console.log('No files found');
            res.status(401)
        }
    } catch (e) {
        console.log(e)
        res.status(500).json(e);
    }

    // res.status(200).json({ name: 'John Doe' })
}