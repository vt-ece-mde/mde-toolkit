

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

interface TeamVideo
{
    videoURL: string
}

interface TeamPowerPoint
{
    powerPointURL: string
}

interface TeamPoster
{
    posterURL: string
}

interface TeamProjectTitle
{
    teamProjectTitle: string
}

export interface Team
{
    teamNames: TeamNames
    sponsorNames: SponsorNames
    smeNames: SMENames
    projectSummary: ProjectSummary
    imageLocation: ImageLocation
    teamVideo : TeamVideo
    teamPowerPoint: TeamPowerPoint
    teamPoster: TeamPoster
    teamProjectTitle: TeamProjectTitle
}

/**
 * Helper function to get element from 2D array given its row (i) and key lookup for column. If no column is found it defaults to returning an empty string.
 */
function getValueFromHeaderKey (arr: string[][], hindex: Map<string, number>, i: number, hkey: string): string {
    const hdx = hindex.get(hkey);
    if (hdx !== undefined) {
        const val = arr[i][hdx];
        if (val !== undefined) {
            return val.trim();
        } else {
            return '';
        }
    } else {
        return ''; // Default to empty string.
    }
}


function parseTeamNames(teamNamesArr: string[][]): TeamNames {
    var teamNames: TeamNames = {
        titles: [],
        lastNames: [],
        firstNames: [],
        emails: [],
        degrees: [],
        major: [],
        hometown: [],
        StateOrCountry: [],
        aspirations: [],
        courseComments: [],
    };

    ////// Parse team names
    //
    // First we need to build a lookup table for the header, because the precise order is not guaranteed.
    var header = [];
    header = teamNamesArr[0].map(item => item.toLowerCase().trim());
    var headerIndex = new Map<string, number>();
    for(let i = 0; i < header.length; i++) {
        if (header[i].includes('title')) {
            headerIndex.set('title', i);
        }
        else if (header[i].includes('first') && header[i].includes('name')) {
            headerIndex.set('first_name', i);
        }
        else if (header[i].includes('last') && header[i].includes('name')) {
            headerIndex.set('last_name', i);
        }
        else if (header[i].includes('email')) {
            headerIndex.set('email', i);
        }
        else if (header[i].includes('hometown')) {
            headerIndex.set('hometown', i);
        }
        else if (header[i].includes('state') || header[i].includes('country')) {
            headerIndex.set('state_or_country', i);
        }
        else if (header[i].includes('degree')) {
            headerIndex.set('degree', i);
        }
        else if (header[i].includes('major')) {
            headerIndex.set('major', i);
        }
        else if (header[i].includes('aspiration')) {
            headerIndex.set('aspiration', i);
        }
        else if (header[i].includes('course') || header[i].includes('comment')) {
            headerIndex.set('course_comment', i);
        } 
        else {
            throw Error(`undefined header key: ${JSON.stringify(header[i])}`)
        }
    }
    //
    // Now parse the team names.
    for(let i = 1; i < teamNamesArr.length; i++)
    {
        teamNames.titles.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'title'));
        teamNames.lastNames.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'last_name'));
        teamNames.firstNames.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'first_name'));
        teamNames.emails.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'email'));
        teamNames.degrees.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'degree'));
        teamNames.major.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'major'));
        teamNames.hometown.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'hometown'));
        teamNames.StateOrCountry.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'state_or_country'));
        teamNames.aspirations.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'aspiration'));
        teamNames.courseComments.push(getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'course_comment'));
    }

    return teamNames;
}


function parseSponsorNames(sponsorNamesArr: string[][]): SponsorNames {

    var sponsorNames: SponsorNames = {
        titles: [],
        lastNames: [],
        firstNames: [],
        emails: [],
        companies: [],
    };

    var header = [];
    header = sponsorNamesArr[0].map(item => item.toLowerCase().trim());
    var headerIndex = new Map<string, number>();
    for(let i = 0; i < header.length; i++) {
        if (header[i].includes('title')) {
            headerIndex.set('title', i);
        }
        else if (header[i].includes('first') && header[i].includes('name')) {
            headerIndex.set('first_name', i);
        }
        else if (header[i].includes('last') && header[i].includes('name')) {
            headerIndex.set('last_name', i);
        }
        else if (header[i].includes('email')) {
            headerIndex.set('email', i);
        }
        else if (header[i].includes('company')) {
            headerIndex.set('company', i);
        }
        else {
            throw Error(`undefined header key: ${JSON.stringify(header[i])}`)
        }
    }

    // parse the sponsor names
    for(let i = 1; i < sponsorNamesArr.length; i++)
    {
        sponsorNames.titles.push(getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'title'));
        sponsorNames.lastNames.push(getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'last_name'));
        sponsorNames.firstNames.push(getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'first_name'));
        sponsorNames.emails.push(getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'email'));
        sponsorNames.companies.push(getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'company'));
        // sponsorNames.titles.push(sponsorNamesArr[i][0]);
        // sponsorNames.lastNames.push(sponsorNamesArr[i][1]);
        // sponsorNames.firstNames.push(sponsorNamesArr[i][2]);
        // sponsorNames.emails.push(sponsorNamesArr[i][3]);
        // sponsorNames.companies.push(sponsorNamesArr[i][4]);
    }

    return sponsorNames;
}

function parseSMENames(smeNamesArr: string[][]): SMENames {

    var smeNames: SMENames = {
        titles: [],
        lastNames: [],
        firstNames: [],
        emails: [],
        companies: [],
    };

    var header = [];
    header = smeNamesArr[0].map(item => item.toLowerCase().trim());
    var headerIndex = new Map<string, number>();
    for(let i = 0; i < header.length; i++) {
        if (header[i].includes('title')) {
            headerIndex.set('title', i);
        }
        else if (header[i].includes('first') && header[i].includes('name')) {
            headerIndex.set('first_name', i);
        }
        else if (header[i].includes('last') && header[i].includes('name')) {
            headerIndex.set('last_name', i);
        }
        else if (header[i].includes('email')) {
            headerIndex.set('email', i);
        }
        else if (header[i].includes('company')) {
            headerIndex.set('company', i);
        }
        else {
            throw Error(`undefined header key: ${JSON.stringify(header[i])}`)
        }
    }

    // parse the sponsor names
    for(let i = 1; i < smeNamesArr.length; i++)
    {
        smeNames.titles.push(getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'title'));
        smeNames.lastNames.push(getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'last_name'));
        smeNames.firstNames.push(getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'first_name'));
        smeNames.emails.push(getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'email'));
        smeNames.companies.push(getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'company'));
        // smeNames.titles.push(smeNamesArr[i][0]);
        // smeNames.lastNames.push(smeNamesArr[i][1]);
        // smeNames.firstNames.push(smeNamesArr[i][2]);
        // smeNames.emails.push(smeNamesArr[i][3]);
        // smeNames.companies.push(smeNamesArr[i][4]);
    }

    return smeNames;
}


export function buildTeamsFromCSVStrings(teamProjectTitle: string, teamNamesArr: string[][], sponsorNamesArr: string[][],
    smeNamesArr: string[][], projectSummaryStr: string, imageLocationStr: string,
    teamVideoURL: string, teamPowerPointURL: string, teamPosterURL: string) : Team
{
    // Parse team names
    const teamNames: TeamNames = parseTeamNames(teamNamesArr);

    // parse the sponsor names
    const sponsorNames: SponsorNames = parseSponsorNames(sponsorNamesArr);

    // parse the sme names
    const smeNames: SMENames = parseSMENames(smeNamesArr);

    // parse the team project title
    const projectTitle: TeamProjectTitle = {
        teamProjectTitle: teamProjectTitle.trim(),
    };

    // parse the project summary
    const projectSummary: ProjectSummary = {
        summary: projectSummaryStr.trim(),
    }

    // parse the image url
    const imageLocation: ImageLocation = {
        location: imageLocationStr,
    }

    // parse the video URL
    const teamVideo: TeamVideo = {
        videoURL: teamVideoURL,
    }

    // prase the power point URL
    const teamPowerPoint: TeamPowerPoint = {
        powerPointURL: teamPowerPointURL,
    }

    // parse the team poster url
    const teamPoster: TeamPoster = {
        posterURL: teamPosterURL,
    }

    // Build the team interface
    var team = {} as Team
    team.teamNames = teamNames;
    team.sponsorNames = sponsorNames;
    team.smeNames = smeNames;
    team.projectSummary = projectSummary;
    team.imageLocation = imageLocation;
    team.teamVideo = teamVideo;
    team.teamPowerPoint = teamPowerPoint;
    team.teamPoster = teamPoster;
    team.teamProjectTitle = projectTitle;

    return team;
}