

// Gleaned from: https://stackoverflow.com/a/58181757
export function csv2arr(str: string, delimiter: string = ',', quotechar: string = '"'): string[][] {
    let line = ["",];
    const ret = [line,];
    let quote = false;

    for (let i = 0; i < str.length; i++) {
        const cur = str[i];
        const next = str[i + 1];

        if (!quote) {
            const cellIsEmpty = line[line.length - 1].length === 0;
            if (cur === quotechar && cellIsEmpty) quote = true;
            else if (cur === delimiter) line.push("");
            else if (cur === "\r" && next === "\n") { line = ["",]; ret.push(line); i++; }
            else if (cur === "\n" || cur === "\r") { line = ["",]; ret.push(line); }
            else line[line.length - 1] += cur;
        } else {
            if (cur === quotechar && next === quotechar) { line[line.length - 1] += cur; i++; }
            else if (cur === quotechar) quote = false;
            else line[line.length - 1] += cur;
        }
    }

    // Remove any extra characters.
    return ret.map(
        (row) => row.map(
            (col) => col.replace('\r', '').replace('\n', ' ')
        )
    );
}

interface TeamNames
{
    titles: string[]    // Mr. Mrs. Dr. etc.
    lastNames: string[]
    firstNames: string[]
    emails: string[]
    degrees: string[]
    major: string[]
    hometown: string[]
    StateOrCountry: string[]
    aspirations: string[]
    courseComments: string[]
}

interface SponsorNames
{
    titles: string[]    // Mr. Mrs. Dr. etc.
    lastNames: string[]
    firstNames: string[]
    emails: string[]
    companies: string[]
}


interface SMENames
{
    titles: string[]    // Mr. Mrs. Dr. etc.
    lastNames: string[]
    firstNames: string[]
    emails: string[]
    companies: string[]

}

interface ProjectSummary
{
    summary: string
}

interface ImageLocation
{
    location: string
}

interface Team
{
    teamNames: TeamNames
    sponsorNames: SponsorNames
    smeNames: SMENames
    projectSummary: ProjectSummary
    imageLocation: ImageLocation
}

export function buildTeamsFromCSVStrings(teamNamesArr: string[][], sponsorNamesArr: string[][],
    smeNamesArr: string[][], projectSummaryStr: string, imageLocationStr: string) : Team
{
    var teamNames = {} as TeamNames;
    var sponsorNames = {} as SponsorNames;
    var smeNames = {} as SMENames;
    var projectSummary = {} as ProjectSummary;
    var imageLocation = {} as ImageLocation

    // parse the teams names
    for(let i = 1; i < teamNamesArr.length; i++)
    {
        teamNames.titles.push(teamNamesArr[i][0]);
        teamNames.lastNames.push(teamNamesArr[i][1]);
        teamNames.firstNames.push(teamNamesArr[i][2]);
        teamNames.emails.push(teamNamesArr[i][3]);
        teamNames.degrees.push(teamNamesArr[i][4]);
        teamNames.major.push(teamNamesArr[i][5]);
        teamNames.hometown.push(teamNamesArr[i][6]);
        teamNames.StateOrCountry.push(teamNamesArr[i][7]);
        teamNames.aspirations.push(teamNamesArr[i][8]);
        teamNames.courseComments.push(teamNamesArr[i][9]);
    }

    // parse the sponsor names
    for(let i = 1; i < sponsorNamesArr.length; i++)
    {
        sponsorNames.titles.push(sponsorNamesArr[i][0]);
        sponsorNames.lastNames.push(sponsorNamesArr[i][1]);
        sponsorNames.firstNames.push(sponsorNamesArr[i][2]);
        sponsorNames.emails.push(sponsorNamesArr[i][3]);
        sponsorNames.companies.push(sponsorNamesArr[i][4]);
    }

    // parse the sme names
    for(let i = 1; i < smeNamesArr.length; i++)
    {
        smeNames.titles.push(smeNamesArr[i][0]);
        smeNames.lastNames.push(smeNamesArr[i][1]);
        smeNames.firstNames.push(smeNamesArr[i][2]);
        smeNames.emails.push(smeNamesArr[i][3]);
        smeNames.companies.push(smeNamesArr[i][4]);
    }

    // parse the project summary
    projectSummary.summary = projectSummaryStr;

    // parse the image location
    imageLocation.location = imageLocationStr;

    // Build the team interface
    var team = {} as Team
    team.teamNames = teamNames;
    team.sponsorNames = sponsorNames;
    team.smeNames = smeNames;
    team.projectSummary = projectSummary;
    team.imageLocation = imageLocation;

    return team;
}