
// Team sample folder:
// https://drive.google.com/drive/u/1/folders/1QQdj-9N7y_8eyEdJ3qIXjOBgWsEFrbKU

// project_summary.txt -- Download project_summary.txt
// sme_names.csv -- Download sme_names.csv
// sponsor_names.csv -- Download sponsor_names.csv
// team_names.csv -- Download team_names.csv
// team_photo_names.txt -- Download team_photo_names.txt
// team_photo.png -- (Note your team photo should present a professional team image)

import { 
    Team,
    TeamMember,
    Sponsor,
    SME,
} from '../../lib/parsing'

export type TeamBrochurePhotoProps = {
    smes: SME[];
    team_photo_names: string | string[] | string[][];
    team_photo_url: string; // URL to image.
}
export function TeamBrochurePhoto( props: TeamBrochurePhotoProps ) {
    return (
        <div className="team-figure">
            <figure>
                <img src={props.team_photo_url} alt="Team Photo" />
                <figcaption className="text-[#76777A] text-md font-normal">
                    <p>{props.team_photo_names}</p>
                    <p>{`SME: ${props.smes.map(sme => `${sme.title} ${sme.firstName} ${sme.lastName}`).join(', ')}`}</p>
                </figcaption>
            </figure>
        </div>
    );
}


export function TeamChallenge( props: { project_summary: string } ) {
    return (<>
        <div className="text-[#008891] text-2xl font-normal font-mono">CHALLENGE</div>
        <div className="text-[#008891] text-xl font-normal font-mono">{props.project_summary}</div>
    </>);
}


export function TeamMemberInfo( props: TeamMember ) {
    return (<>
        <div className="text-[#008891] text-2xl font-bold font-sans underline">
            {`${props.firstName} ${props.lastName}`} <span className="text-[#939598] text-xl underline font-mono">{`${props.hometown}, ${props.StateOrCountry}`}</span>
        </div>
        <div className="pt-2 text-[#F57F28] text-lg font-bold">{props.degree}, {props.major}</div>
        <div className="pt-2 text-[#231F20] text-xl font-sans font-bold">
            Aspirations: <span className="text-[#231F20] text-lg font-serif font-normal">{props.aspiration}</span>
        </div>
        <div className="pt-2 text-[#231F20] text-xl font-bold font-sans">
            Class Comment: <span className="text-[#231F20] text-lg font-serif font-normal">{props.courseComment}</span>
        </div>
    </>);
}


export function TeamMembers( props: { team_members: TeamMember[] } ) {
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


export function TeamProjectSponsors( props: { sponsors: Sponsor[] } ) {
    return (<>
        <div className="text-[#939598] text-center">
            PROJECT SPONSOR: <span className="text-[#83003F]">{props.sponsors.map(sponsor => `${sponsor.title} ${sponsor.firstName} ${sponsor.lastName}`).join(', ')}</span>
        </div>
    </>);
}


export default function TeamBrochure( props: Team ) {
    return (<>
        <div className="p-5 grid grid-cols-1 gap-4">

            {/* Project name */}
            <div className="mb-3 text-5xl text-[#83003F] text-center font-bold font-mono">{props.projectTitle}</div>

            {/* Project info */}
            <div className="grid grid-cols-5 gap-4">
                <div className="col-span-2">
                    <TeamBrochurePhoto smes={props.smes} team_photo_names={props.teamPhotoNames} team_photo_url={props.imageUrl}/>
                </div>
                <div className="col-span-3 text-left">
                    <TeamChallenge project_summary={props.projectSummary} />
                </div>
            </div>

            {/* Team information */}
            <div className="grid grid-cols-3 gap-4">
                <TeamMembers team_members={props.teamMembers}/>
            </div>

            {/* Sponsor information */}
            <div>
                <TeamProjectSponsors sponsors={props.sponsors}/>
            </div>
        </div>
    </>);
}