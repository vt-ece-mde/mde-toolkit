import TeamBrochure from '../components/TeamBrochure'
import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 8,
      min: 4
    },
    wordsPerSentence: {
      max: 16,
      min: 4
    }
});

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
    project_name: lorem.generateWords(4),
    project_summary: lorem.generateParagraphs(1),
    sme_names: Array.from(Array(3).keys()).map(_ => lorem.generateWords(2)),
    sponsor_names: Array.from(Array(3).keys()).map(_ => lorem.generateWords(2)),
    team_members: Array.from(Array(5).keys()).map(_ => ({
            title: lorem.generateWords(1),
            last_name: lorem.generateWords(1),
            first_name: lorem.generateWords(1),
            email: lorem.generateWords(1),
            degrees: lorem.generateWords(1).toUpperCase(),
            major: lorem.generateWords(6),
            hometown: lorem.generateWords(1),
            state_or_country: lorem.generateWords(1).toUpperCase(),
            aspiration: lorem.generateParagraphs(1),
            course_comment: lorem.generateParagraphs(1),
    })),
    team_photo_names: `LEFT TO RIGHT: ${(Array.from(Array(5).keys()).map(_ => lorem.generateWords(2))).join(', ')}`,
    // team_photo_url: "https://drive.google.com/uc?export=view&id=1cBsKbJqjt-g9VyJFYEMptLEgdbGBZk05",
    team_photo_url: "https://loremflickr.com/640/360",
}


export default function Brochure() {
    return (<TeamBrochure {...team}/>);
}