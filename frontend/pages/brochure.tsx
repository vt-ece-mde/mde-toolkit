import TeamBrochure from '../components/TeamBrochure'

// type User = {
//     title: string;
//     last_name: string;
//     first_name: string;
//     email: string;
// }

type TeamMember = {
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
type Team = {
    project_name: string;
    project_summary: string;
    sme_names: string[];
    sponsor_names: string[];
    team_members: TeamMember[];
    team_photo_names: string;
    team_photo_url: string; // URL to image.
}
const team: Team = {
    project_name: "Power Adaptive Compute Nodes",
    project_summary: "Create a distributed computing network of at least 5 nodes in various locations, reliant on isolated solar power. Node coordination of data processing is determined by the power availability at each location.",
    sme_names: ["Jaime De La Ree Lopez"],
    sponsor_names: ["Matt Gardner"],
    team_members: [
        {
            title: 'Mr',
            last_name: "Anderson",
            first_name: "Dave",
            email: "test@email.com",
            degrees: "EE",
            major: "Computer Engineering Chip-Scale Integration",
            hometown: "Alexandria",
            state_or_country: "VA",
            aspiration: "I want to continue learning about and developing software so that I can give back to the open source community whose efforts and examples have supported me from high school to college.",
            course_comment: "This course gave me a better understanding of how project management can make or break a final result, as well as how to effectively make tradeoffs in the pursuit of a final product.",
        },
        {
            title: 'Mr',
            last_name: "Anderson",
            first_name: "Dave",
            email: "test@email.com",
            degrees: "EE",
            major: "Computer Engineering Chip-Scale Integration",
            hometown: "Alexandria",
            state_or_country: "VA",
            aspiration: "I want to continue learning about and developing software so that I can give back to the open source community whose efforts and examples have supported me from high school to college.",
            course_comment: "This course gave me a better understanding of how project management can make or break a final result, as well as how to effectively make tradeoffs in the pursuit of a final product.",
        },
        {
            title: 'Mr',
            last_name: "Anderson",
            first_name: "Dave",
            email: "test@email.com",
            degrees: "EE",
            major: "Computer Engineering Chip-Scale Integration",
            hometown: "Alexandria",
            state_or_country: "VA",
            aspiration: "I want to continue learning about and developing software so that I can give back to the open source community whose efforts and examples have supported me from high school to college.",
            course_comment: "This course gave me a better understanding of how project management can make or break a final result, as well as how to effectively make tradeoffs in the pursuit of a final product.",
        },
    ],
    team_photo_names: "LEFT TO RIGHT: Ken Torres, Shannon Woolfolk, Andrew Beauchemin, Boyan Pan, Dave Anderson",
    // team_photo_url: "/Volumes/GoogleDrive/Shared drives/Open Access ECE MDE/Fall 2022/Test/BrochureSample/ECE-MDEprogram_Spring2022 26/Image_121.png",
    // team_photo_url: "https://drive.google.com/file/d/1-mki_kMVwh10GO02dxz-vxW9GSXvO0Vz/view",
    // team_photo_url: "https://drive.google.com/uc?export=view&id=1-mki_kMVwh10GO02dxz-vxW9GSXvO0Vz",
    team_photo_url: "https://drive.google.com/uc?export=view&id=1cBsKbJqjt-g9VyJFYEMptLEgdbGBZk05",
}


export default function Brochure() {
    return (<>
        <div>
            <TeamBrochure {...team}/>
        </div>
    </>);
}