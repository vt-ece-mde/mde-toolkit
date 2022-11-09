
import type { NextApiRequest, NextApiResponse } from 'next'
import { unstable_getServerSession } from "next-auth/next"
import { NextAuthOptions } from "next-auth"
import { authOptions } from "./auth/[...nextauth]"

import { drive_v3, google } from "googleapis";
// import drive from "@googleapis/drive";

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


async function processTeamFolder(client: drive_v3.Drive, folderId: string): Promise<drive_v3.Schema$File[]> {

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

async function processExpoTeamRoot(client: drive_v3.Drive, folderId: string): Promise<drive_v3.Schema$File[]> {
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



// https://github.com/nextauthjs/next-auth/issues/1162#issuecomment-766331341

interface TeamBlob {
    team_root: drive_v3.Schema$File;
    team_files: drive_v3.Schema$File[];
}
interface Data {
    teams: TeamBlob[];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {

    const session: AuthSession|null = await unstable_getServerSession(req, res, (authOptions as NextAuthOptions))

    console.log(session?.user?.name)
    console.log(session?.user?.email)


    // const clientId = process.env.GOOGLE_CLIENT_ID;
    // const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;
    // const redirectUri = "http://localhost:3000/api/auth/callback/google"

    // const token = await getToken({ req, secret: nextAuthSecret });
    // console.log(token)

    console.log(scopes.join(" "))


    if (!session) {
        res.status(401);
    }

    // const auth = new google.auth.OAuth2({
    //     clientId,
    //     clientSecret,
    //     // redirectUri
    // });
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
        access_token: access_token,
        refresh_token: refresh_token,
        // scope: scopes.join(" "),
    });

    const client = google.drive({ auth, version: "v3" });

    const folder_id = "1D4SAg0_t_s9vrkiwSJEoWZFF_OiG-G29";

    const teamFolders = await processExpoTeamRoot(client, folder_id)

    var teams: TeamBlob[] = []
    for (let index = 0; index < teamFolders.length; index++) {
        const team_root = teamFolders[index];
        if (team_root.id) {
            const team_files = await processTeamFolder(client, team_root.id)
            teams.push({
                team_root: team_root,
                team_files: team_files,
            })
        }
        // break;
    }

    res.status(200).json({teams})


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