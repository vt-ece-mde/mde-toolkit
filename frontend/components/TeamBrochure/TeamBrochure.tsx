import Head from "next/head";

type TeamBrochureProps = {
    project_name: string;
    project_summary: string;
    sme_names: string[];
    sponsor_names: string[];
    team_names: string[];
    team_photo_names: string[];
    team_photo_url: string; // URL to image.
}

// Team sample folder:
// https://drive.google.com/drive/u/1/folders/1QQdj-9N7y_8eyEdJ3qIXjOBgWsEFrbKU

// project_summary.txt -- Download project_summary.txt
// sme_names.csv -- Download sme_names.csv
// sponsor_names.csv -- Download sponsor_names.csv
// team_names.csv -- Download team_names.csv
// team_photo_names.txt -- Download team_photo_names.txt
// team_photo.png -- (Note your team photo should present a professional team image)

export default function TeamBrochure( props: TeamBrochureProps ) {
    return (<>
        <Head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>{props.project_summary}</title>
        </Head>
    </>);
}