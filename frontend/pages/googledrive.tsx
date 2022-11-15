import { getSession } from 'next-auth/react'
import { GetServerSidePropsContext } from 'next';
import { google } from "googleapis";
// import drive from "@googleapis/drive"

import  { useEffect } from 'react';
// import useDrivePicker from 'react-google-drive-picker'
import useDrivePicker from '../components/googledrivepicker'
import { Session } from 'next-auth';


// import GooglePicker from 'react-google-picker';



// const scopes = [
//     'https://www.googleapis.com/auth/drive',
// ];


export default function GoogleDrivePage({ session }: { session: Session }) {
// export default function GoogleDrivePage({ drive }: { drive: drive_v3.Drive }) {



    const access_token = session?.access_token;
    const refresh_token = session?.refresh_token;

    const [openPicker, authResponse] = useDrivePicker();  
    // const customViewsArray = [new google.picker.DocsView()]; // custom view
    const handleOpenPicker = () => {
        openPicker({
            clientId: "", // Not required, but must be provided as an empty string.
            developerKey: "", // Not required, but must be provided as an empty string.
            token: access_token, // pass oauth token in case you already have one
            viewId: "DOCS", // All Google Drive document types.
            showUploadView: false,
            showUploadFolders: true,
            supportDrives: true,
            multiselect: true,
            customViews: [

            ],
            callbackFunction: (data) => {
            if (data.action === 'cancel') {
                console.log('User clicked cancel/close button')
            } else {
                console.log(`data? ${JSON.stringify(data)}`)
            }
            console.log(data)
            },
        })
    }

    // function createPicker() {
    //     var picker = new google.picker.PickerBuilder()
    //     .addView(new google.picker.DocsView())
    //     .setOAuthToken(access_token)
    //     // .setCallback(pickerCallback)
    //     .build();
    //     picker.setVisible(true);
    // }


    // const readDrive = async () => {
    //     // const auth = new google.auth.OAuth2({
    //     //     clientId,
    //     //     clientSecret,
    //     //     // redirectUri
    //     // });
    //     const auth = new drive.auth.OAuth2();
    //     auth.setCredentials({
    //         access_token: access_token,
    //         refresh_token: refresh_token,
    //         // scope: scopes.join(" "),
    //     });

    //     const client = drive.drive({ auth, version: "v3" });

    //     const res = await client.files.list({})
    //     const files = res.data.files;
    //     if (files?.length) {
    //         files.map((file) => {
    //             console.log(`FILE: ${file}`);
    //         });
    //     } else {
    //         console.log('No files found');
    //     }
    // }

    return (<>
        {/* <div>hello</div> */}
        <button onClick={ _ => handleOpenPicker() }>Read Drive</button>
    </>);



    // return (<>
    // <GooglePicker clientId={'xxxx'}
    //           developerKey={"xxxx"}
    //           scope={['https://www.googleapis.com/auth/drive.readonly']}
    //           onChange={data => console.log('on change:', data)}
    //           onAuthenticate={token => console.log('oauth token:', token)}
    //           onAuthFailed={data => console.log('on auth failed:', data)}
    //           multiselect={true}
    //           navHidden={true}
    //           authImmediate={false}
    //           viewId={'FOLDERS'}
    //           createPicker={ (google, oauthToken) => {
    //             const googleViewId = google.picker.ViewId.FOLDERS;
    //             const docsView = new google.picker.DocsView(googleViewId)
    //                 .setIncludeFolders(true)
    //                 .setMimeTypes('application/vnd.google-apps.folder')
    //                 .setSelectFolderEnabled(true)
    //                 .setEnableDrives(true);

    //             const picker = new window.google.picker.PickerBuilder()
    //                 .addView(docsView)
    //                 .enableFeature(window.google.picker.Feature.SUPPORT_DRIVES)
    //                 .setOAuthToken(access_token)
    //                 // .setDeveloperKey(DEVELOPER_KEY)
    //                 .setCallback(()=>{
    //                   console.log('Custom picker is ready!');
    //                 })
    //                 .build().setVisible(true);

    //             enableFeature(google.picker.Feature.MULTISELECT_ENABLED) // added code
    //         }}
    //     >
    //         <button>Click</button>
    //     </GooglePicker>
    // </>);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {

    const { req, resolvedUrl } = context;
    const session = await getSession({ req });

    // console.log(`session? ${JSON.stringify(session)}`)

    // Redirect to signin page.
    if (!session || session?.error === "RefreshAccessTokenError") {
        return {
            redirect: { 
                destination: '/auth/signin?' + new URLSearchParams({
                    redirect: resolvedUrl,
                }),
                permanent: false,
            },
        }
    }

    // const clientId = process.env.GOOGLE_CLIENT_ID;
    // const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    // const access_token = session?.access_token;
    // const refresh_token = session?.refresh_token;
    // const auth = new google.auth.OAuth2({
    //     clientId,
    //     clientSecret,
    //     // redirectUri
    // });
    // auth.setCredentials({
    //     access_token: access_token,
    //     refresh_token: refresh_token,
    //     // scope: scopes.join(" "),
    // });

    // const drive = google.drive({ auth, version: "v3" });

    // Render desired page with session.
    return {
        props: { 
            session,
            // drive,
        },
    }
}




const newUsePicker = (access_token: string) => {

}