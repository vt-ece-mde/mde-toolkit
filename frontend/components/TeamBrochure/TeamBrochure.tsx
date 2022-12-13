
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


// const ApplyWrappers = (props: { wrappers: (((children: any) => any) | false)[], children?: any }) => props.wrappers.reduce(
//     (children: any, wrapper: ((children: any) => any) | false) => wrapper ? wrapper(children) : children,
//     props.children,
// );

const ApplyWrappers = (props: { wrappers: (((children: any) => any) | false)[], children?: any }) => {
    return props.wrappers.reduce(
        (children: any, wrapper: ((children: any) => any) | false) => wrapper ? wrapper(children) : children,
        props.children,
    )
}

const ConditionalWrapper = (props: { condition: boolean, wrapper: (c: any) => any, children: any}) => props.condition ? props.wrapper(props.children) : props.children;


function DefaultUrlIframe(props: { url: string | string[], children?: any, className?: string }) {
    const url = (typeof props.url === 'string') ? [props.url] : props.url; // Convert to single-element list if necessary.
    const l = url.map(
        u => (
            (children: any) => <iframe src={u} width="100%" height="100%" aria-label='Team Poster' className={props.className !== undefined ? props.className : ''}>{children}</iframe>
        )
    )
    return (<>
        <ApplyWrappers wrappers={l}>
            {props.children}
        </ApplyWrappers>
    </>);
}

function DefaultUrlObject(props: { url: string | string[], type: string, children?: any, className?: string }) {
    const url = (typeof props.url === 'string') ? [props.url] : props.url; // Convert to single-element list if necessary.
    const l = url.map(
        u => (
            (children: any) => <object data={u} type={props.type} width="100%" height="100%" aria-label='Team Poster' className={props.className !== undefined ? props.className : ''}>{children}</object>
        )
    )
    return (<>
        <ApplyWrappers wrappers={l}>
            {props.children}
        </ApplyWrappers>
    </>);
}


function DefaultImage({ src, alt }: { src: string | string[], alt: string }) {

    const recurse = (s: string | string[]) => {
        if (Array.isArray(s)) {
            if (s.length > 1) {
                return (<>
                    <object data={s[0]} type="image/*" aria-label={alt}>
                        {recurse(s.slice(1))}
                    </object>
                    </>);
            }
            else if (s.length === 1) {
                return (<img src={s[0]} alt={alt} />);
            }
            else {
                return (<></>);
            }
        }
        else {
            return (<img src={s as string} alt={alt} />);
        }
    }

    return recurse(src);
}


export type TeamBrochurePhotoProps = {
    smes: SME[];
    team_photo_names: string | string[] | string[][];
    team_photo_url: string;
}
export function TeamBrochurePhoto( props: TeamBrochurePhotoProps ) {
    return (
        <div className="team-figure">
            <figure>
                {/* <DefaultImage src={props.team_photo_url} alt="Team Photo" /> */}
                <img src={props.team_photo_url} alt="Team Photo"/>
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
        <div className='flex flex-row space-x-3 items-end'>
            <span className="text-[#008891] text-4xl font-bold font-sans">{`${props.firstName} ${props.lastName}`}</span>
            <span className="text-[#939598] text-lg font-mono">{`${props.hometown}, ${props.StateOrCountry}`}</span>
        </div>
        <div className="my-2 w-full border-b-2 border-orange-500 rounded"></div>
        <div className="-mt-2 text-[#F57F28] text-lg font-bold">{props.degree}, {props.major}</div>
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
                <div key={`tm-${index}`}>
                    <TeamMemberInfo {...tm} />
                </div>
            );
        })}
    </>);
}


export function TeamProjectSponsors( props: { sponsors: Sponsor[] } ) {
    const prefix: string = (props.sponsors.length === 0) ? 'PROJECT SPONSOR' : 'PROJECT SPONSORS';
    return (<>
        <div className="text-[#939598] text-center">
            {prefix}: <span className="text-[#83003F]">{props.sponsors.map(sponsor => `${sponsor.title} ${sponsor.firstName} ${sponsor.lastName}`).join(', ')}</span>
        </div>
    </>);
}



function embedFileUrlPowerpoint(url: string): string {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${url}`;
}


export function EmbedFileUrl( props: { url: string, className?: string, children?: any} ) {

    // Embed PowerPoint file using Microsoft online embedding URL.
    if (props.url.includes('.ppt') || props.url.includes('.pptx')) {
        return (<>
            <iframe src={embedFileUrlPowerpoint(props.url)} width="100%" height="100%" className={props.className !== undefined ? props.className : ''}>
                {props.children}
            </iframe>
        </>);
    } 
    // Embed PDF using custom view query parameters.
    else if (props.url.includes('.pdf')) {
        return (<>
            <object data={`${props.url}#view=FitV&toolbar=1&navpanes=1`} type="application/pdf" width="100%" height="100%" className={props.className !== undefined ? props.className : ''}>
                {props.children}
            </object>
        </>);
    }
    // Embed everything else as an `object` tag with no special property type.
    else {
        return (<>
            <object data={props.url} width="100%" height="100%" className={props.className !== undefined ? props.className : ''}>
                {props.children}
            </object>
        </>);
    }
}


export default function TeamBrochure( props: Team ) {

    console.log(`[${props.teamShortName}] poster URLs: ${JSON.stringify(props.posterUrl)}`)

    return (<>
        <div className="p-5 grid grid-cols-1 gap-4">

            {/* Project name */}
            <div className="mb-3 text-5xl text-[#83003F] text-center font-bold font-mono">{props.projectTitle}</div>

            {/* Project info */}
            <div className="grid grid-cols-5 gap-4 pb-4">
                <div className="col-span-2">
                    <TeamBrochurePhoto smes={props.smes} team_photo_names={props.teamPhotoNames} team_photo_url={props.teamPhotoUrl}/>
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

            <div className='pt-5'>
                <div className='flex flex-row space-x-8'>
                    <div className='flex flex-col w-1/2 h-[600px]'>
                        <div className='text-4xl font-bold text-center text-[#231F20]'>Poster</div>
                        <EmbedFileUrl url={props.posterUrl}>
                            <div className='flex flex-col text-center justify-center bg-slate-100 w-[100%] h-[100%]'>
                                <p>We're sorry, but the file could not be displayed</p>
                                <a href={props.posterUrl} target="_blank" rel="noopener noreferrer" className='text-blue-600 underline'>Open file in new window</a>
                            </div>
                        </EmbedFileUrl>
                    </div>
                    <div className='flex flex-col w-1/2 h-[600px]'>
                        <div className='text-4xl font-bold text-center text-[#231F20]'>Presentation</div>
                        <EmbedFileUrl url={props.presentationUrl}>
                            <div className='flex flex-col text-center justify-center bg-slate-100 w-[100%] h-[100%]'>
                                <p>We're sorry, but the file could not be displayed</p>
                                <a href={props.posterUrl} target="_blank" rel="noopener noreferrer" className='text-blue-600 underline'>Open file in new window</a>
                            </div>
                        </EmbedFileUrl>
                    </div>
                </div>
            </div>
        </div>
    </>);
}