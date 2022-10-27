import styles from './TeamBrochure.module.css'
import Head from "next/head";

// Team sample folder:
// https://drive.google.com/drive/u/1/folders/1QQdj-9N7y_8eyEdJ3qIXjOBgWsEFrbKU

// project_summary.txt -- Download project_summary.txt
// sme_names.csv -- Download sme_names.csv
// sponsor_names.csv -- Download sponsor_names.csv
// team_names.csv -- Download team_names.csv
// team_photo_names.txt -- Download team_photo_names.txt
// team_photo.png -- (Note your team photo should present a professional team image)

export type TeamBrochurePhotoProps = {
    sme_names: string[];
    team_photo_names: string;
    team_photo_url: string; // URL to image.
}
export function TeamBrochurePhoto( props: TeamBrochurePhotoProps ) {
    return (
        <figure>
            <img src={props.team_photo_url} alt="Team Photo" />
            <figcaption className={`${styles.s4} text-align:left;`}>
                <p>{props.team_photo_names}</p>
                <p>{`SME: ${props.sme_names.join(', ')}`}</p>
            </figcaption>
        </figure>
    );
}


export type TeamChallengeProps = {
    project_summary: string;
}
export function TeamChallenge( { project_summary }: TeamChallengeProps ) {
    return (<>
        <b className={styles.s2}>CHALLENGE</b>
        <h2 className={`${styles.h2} ${styles.s3}`}>{project_summary}</h2>
    </>);
}


export type TeamMember = {
    title: string;
    last_name: string;
    first_name: string;
    email: string;
    degrees: string;
    major: string;
    hometown: string;
    state_or_country: string;
    aspiration: string;
    course_comment: string;
}
export function TeamMemberInfo( props: TeamMember ) {
    return (<>
        <h2 className={`${styles.h2} padding-top: 5pt;padding-left: 54pt;text-indent: 0pt;text-align: left;`}>
            {`${props.first_name} ${props.last_name}`}
            <span className={styles.s6}>
                {`${props.hometown}, ${props.state_or_country}`}
            </span>
        </h2>

        <h4 className={`${styles.h4} padding-top: 1pt;padding-left: 54pt;text-indent: 0pt;line-height: 110%;text-align: justify;`}>
            {props.degrees}
        </h4>

        <h3 className={`${styles.h3} padding-top: 4pt;padding-left: 54pt;text-indent: 0pt;line-height: 112%;text-align: left;`}>
            Aspirations:
            <span className={styles.p}>
                {props.aspiration}
            </span>
        </h3>

        <h3 className={`${styles.h3} padding-top: 4pt;padding-left: 54pt;text-indent: 0pt;line-height: 112%;text-align: left;`}>
            Class Comment:
            <span className={styles.p}>
                {props.course_comment}
            </span>
        </h3>
    </>);
}

export type TeamMembersProps = {
    team_members: TeamMember[];
}
export function TeamMembers( props: TeamMembersProps ) {
    return (<>
        {props.team_members.map((tm, index) => {
            return (
                <td key={index}>
                    <TeamMemberInfo {...tm} />
                </td>
            );
        })}
    </>);
}

export type TeamProjectSponsorsProps = {
    sponsor_names: string[];
}
export function TeamProjectSponsors( props: TeamProjectSponsorsProps ) {
    return (<>
        <p className={`${styles.s7} text-align: center;`}>
            PROJECT SPONSOR:
            <span className="color: #83003F;">{ props.sponsor_names.join(', ') }</span>
        </p>
    </>);
}


export type TeamBrochureProps = {
    project_name: string;
    project_summary: string;
    sme_names: string[];
    sponsor_names: string[];
    team_members: TeamMember[];
    team_photo_names: string;
    team_photo_url: string; // URL to image.
}
export default function TeamBrochure( props: TeamBrochureProps ) {
    return (<>
        <Head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>{props.project_name}</title>
        </Head>
        <body>
            <h1 className={styles.h1}>{props.project_name}</h1>
            <p className={`${styles.p} text-indent: 0pt; text-align: left;`}>
                <br />
            </p>
            <p className={`${styles.p} text-indent: 0pt; text-align: left;`}></p>

            <table>
                <tbody>
                    {/* Team image and challenge row */}
                    <tr>
                        {/* Team photo */}
                        <td>
                            <TeamBrochurePhoto sme_names={props.sme_names} team_photo_names={props.team_photo_names} team_photo_url={props.team_photo_url}/>
                        </td>

                        {/* Project challenge */}
                        <td>
                            <TeamChallenge project_summary={props.project_summary} />
                        </td>
                    </tr>

                    {/* Team member info row */}
                    <tr>
                        <TeamMembers team_members={props.team_members}/>
                    </tr>
                </tbody>
            </table>

            {/* Blank spacing */}
            <p></p><p></p><p></p><p></p>

            <TeamProjectSponsors sponsor_names={props.sponsor_names}/>
        </body>
    </>);
}