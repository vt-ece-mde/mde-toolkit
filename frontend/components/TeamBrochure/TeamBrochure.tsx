
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
                <img src={props.team_photo_url} alt="Team Photo" />
                <figcaption className="text-[#76777A] text-md font-normal">
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
        <div className="text-[#008891] text-2xl font-normal font-mono">CHALLENGE</div>
        <div className="text-[#008891] text-xl font-normal font-mono">{project_summary}</div>
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
        <div className="text-[#008891] text-2xl font-bold font-sans underline">
            {`${props.first_name} ${props.last_name}`} <span className="text-[#939598] text-xl underline font-mono">{`${props.hometown}, ${props.state_or_country}`}</span>
        </div>
        <div className="pt-2 text-[#F57F28] text-lg font-bold">{props.degrees}, {props.major}</div>
        <div className="pt-2 text-[#231F20] text-xl font-sans font-bold">
            Aspirations: <span className="text-[#231F20] text-lg font-serif font-normal">{props.aspiration}</span>
        </div>
        <div className="pt-2 text-[#231F20] text-xl font-bold font-sans">
            Class Comment: <span className="text-[#231F20] text-lg font-serif font-normal">{props.course_comment}</span>
        </div>
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
        <div className="text-[#939598] text-center">
            PROJECT SPONSOR: <span className="text-[#83003F]">{ props.sponsor_names.join(', ') }</span>
        </div>
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
        <div className="p-5 grid grid-cols-1 gap-4">

            {/* Project name */}
            <div className="mb-3 text-5xl text-[#83003F] text-center font-bold font-mono">{props.project_name}</div>

            {/* Project info */}
            <div className="grid grid-cols-5 gap-4">
                <div className="col-span-2">
                    <TeamBrochurePhoto sme_names={props.sme_names} team_photo_names={props.team_photo_names} team_photo_url={props.team_photo_url}/>
                </div>
                <div className="col-span-3 text-left">
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
        </div>
    </>);
}