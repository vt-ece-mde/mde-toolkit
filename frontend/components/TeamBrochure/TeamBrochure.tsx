import style from './TeamBrochure.module.css'
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
        <div className="team-figure">
            <figure>
                <img className="team-figure-photo" src={props.team_photo_url} alt="Team Photo" />
                <figcaption className={`${style.s4}`} style={{
                    textAlign: 'left',
                }}>
                    <p>{props.team_photo_names}</p>
                    <p>{`SME: ${props.sme_names.join(', ')}`}</p>
                </figcaption>
            </figure>
        </div>
    );
}


export type TeamChallengeProps = {
    project_summary: string;
}
export function TeamChallenge( { project_summary }: TeamChallengeProps ) {
    return (<>
        <b className={style.s2}>CHALLENGE</b>
        <h2 className={`${style.h2} ${style.s3}`}>{project_summary}</h2>
    </>);
}


export type TeamMemberInfoProps = {
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
export function TeamMemberInfo( props: TeamMemberInfoProps ) {
    return (<>
        <h2 className={`${style.h2} padding-top: 5pt;padding-left: 54pt;text-indent: 0pt;text-align: left;`}>
            {`${props.first_name} ${props.last_name}`}
            <span className={style.s6}>
                {`${props.hometown}, ${props.state_or_country}`}
            </span>
        </h2>

        <h4 className={`${style.h4} padding-top: 1pt;padding-left: 54pt;text-indent: 0pt;line-height: 110%;text-align: justify;`}>
            {props.degrees}
        </h4>

        <h3 className={`${style.h3} padding-top: 4pt;padding-left: 54pt;text-indent: 0pt;line-height: 112%;text-align: left;`}>
            Aspirations:
            <span className={style.p}>
                {props.aspiration}
            </span>
        </h3>

        <h3 className={`${style.h3} padding-top: 4pt;padding-left: 54pt;text-indent: 0pt;line-height: 112%;text-align: left;`}>
            Class Comment:
            <span className={style.p}>
                {props.course_comment}
            </span>
        </h3>
    </>);
}

export type TeamMembersProps = {
    team_members: TeamMemberInfoProps[];
}
export function TeamMembers( props: TeamMembersProps ) {
    return (<>
        {props.team_members.map((tm, index) => {
            return (
                <div key={index}>
                    <TeamMemberInfo {...tm} />
                </div>
            );
        })}
    </>);
}

export type TeamProjectSponsorsProps = {
    sponsor_names: string[];
}
export function TeamProjectSponsors( props: TeamProjectSponsorsProps ) {
    return (<>
        <p className={`${style.s7} text-align: center;`}>
            PROJECT SPONSOR:
            <span className="sponsor-name">{ props.sponsor_names.join(', ') }</span>
        </p>
    </>);
}


export type TeamBrochureProps = {
    project_name: string;
    project_summary: string;
    sme_names: string[];
    sponsor_names: string[];
    team_members: TeamMemberInfoProps[];
    team_photo_names: string;
    team_photo_url: string; // URL to image.
}
export default function TeamBrochure( props: TeamBrochureProps ) {
    return (<>
        {/* <Head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <title>{props.project_name}</title>
        </Head>
        <body> */}
        <div className="grid grid-cols-1 gap-4">

            {/* Project name */}
            <div className="text-5xl text-[#83003F]">{props.project_name}</div>

            {/* Project info */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <TeamBrochurePhoto sme_names={props.sme_names} team_photo_names={props.team_photo_names} team_photo_url={props.team_photo_url}/>
                </div>
                <div>
                    <TeamChallenge project_summary={props.project_summary} />
                </div>
            </div>

            {/* Team information */}
            <div className="grid grid-cols-3 gap-4">
                <TeamMembers team_members={props.team_members}/>
            </div>

            {/* Sponsor information */}
            <div>
                <TeamProjectSponsors sponsor_names={props.sponsor_names}/>
            </div>
        {/* </body> */}
        </div>
    </>);
}