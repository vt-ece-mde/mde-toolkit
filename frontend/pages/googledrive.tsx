import { getSession } from 'next-auth/react'
import { GetServerSidePropsContext } from 'next';
import { google } from "googleapis";
import type { AuthSession } from '../lib/auth';

// const clientId = process.env.GOOGLE_CLIENT_ID;
// const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

// const scopes = [
//     'https://www.googleapis.com/auth/drive',
// ];


// export default function GoogleDrivePage({ session }: { session: AuthSession }) {

//     const access_token = session?.access_token;
//     const refresh_token = session?.refresh_token;


//     const readDrive = async () => {
//         const auth = new google.auth.JWT({
//             email: session.user?.email || '',
//             key: session.access_token,
//             scopes: scopes,
//         })
//         // const auth = new google.auth.OAuth2({
//         //     clientId,
//         //     clientSecret,
//         // });
//         auth.setCredentials({
//             access_token: access_token,
//             refresh_token: refresh_token,
//         });

//         const drive = google.drive({ auth, version: "v3" });

//         const res = await drive.files.list({})
//         const files = res.data.files;
//         if (files?.length) {
//             files.map((file) => {
//                 console.log(`FILE: ${file}`);
//             });
//         } else {
//             console.log('No files found');
//         }
//     }

//     return (<>
//         <button onClick={ _ => readDrive() }>Read Drive</button>
//     </>);
// }

// export async function getServerSideProps(context: GetServerSidePropsContext) {

//     const { req } = context;
//     const session = await getSession({ req });

//     console.log(`session? ${JSON.stringify(session)}`)

//     // Redirect to signin page.
//     if (!session) {
//         return {
//             redirect: { destination: '/auth/signin', permanent: false },
//         }
//     }

//     // Render desired page with session.
//     return {
//         props: { 
//             session,
//         },
//     }
// }