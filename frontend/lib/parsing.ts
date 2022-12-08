

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


interface TeamMember
{
    title: string    // Mr. Mrs. Dr. etc.
    lastName: string
    firstName: string
    email: string
    degree: string
    major: string
    hometown: string
    StateOrCountry: string
    aspiration: string
    courseComment: string
}

interface Sponsor {
    title: string; // Mr. Mrs. Dr. etc.
    lastName: string;
    firstName: string;
    email: string;
    company: string;
}

interface SME {
    title: string; // Mr. Mrs. Dr. etc.
    lastName: string;
    firstName: string;
    email: string;
    company: string;
}

export interface Team
{
    teamMembers: TeamMember[];
    sponsors: Sponsor[];
    smes: SME[];
    projectSummary: string;
    imageUrl: string;
    videoUrl: string;
    presentationUrl: string;
    posterUrl: string;
    projectTitle: string;
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


function parseTeamNames(teamNamesArr: string[][]): TeamMember[] {

    var teamMembers: TeamMember[] = [];

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
        var title = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'title');
        var lastName = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'last_name');
        var firstName = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'first_name');
        var email = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'email');
        var degree = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'degree');
        var major = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'major');
        var hometown = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'hometown');
        var StateOrCountry = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'state_or_country');
        var aspiration = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'aspiration');
        var courseComment = getValueFromHeaderKey(teamNamesArr, headerIndex, i, 'course_comment');

        const tm: TeamMember = {
            title,
            lastName,
            firstName,
            email,
            degree,
            major,
            hometown,
            StateOrCountry,
            aspiration,
            courseComment,
        }

        // Do not push sponsors that have all empty elements.
        const isEmpty = Object.values(tm).every(value => value.length === 0)
        if (!isEmpty) {
            teamMembers.push(tm);
        }

    }

    return teamMembers;
}


function parseSponsorNames(sponsorNamesArr: string[][]): Sponsor[] {

    var sponsors: Sponsor[] = [];

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
        var title = getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'title');
        var lastName = getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'last_name');
        var firstName = getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'first_name');
        var email = getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'email');
        var company = getValueFromHeaderKey(sponsorNamesArr, headerIndex, i, 'company');

        const sponsor: Sponsor = {
            title,
            lastName,
            firstName,
            email,
            company,
        }

        // Do not push sponsors that have all empty elements.
        const isEmpty = Object.values(sponsor).every(value => value.length === 0)
        if (!isEmpty) {
            sponsors.push(sponsor);
        }
    }

    return sponsors;
}

function parseSMENames(smeNamesArr: string[][]): SME[] {

    var smes: SME[] = [];

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
        var title = getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'title');
        var lastName = getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'last_name');
        var firstName = getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'first_name');
        var email = getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'email');
        var company = getValueFromHeaderKey(smeNamesArr, headerIndex, i, 'company');

        const sme: SME = {
            title,
            lastName,
            firstName,
            email,
            company,
        }

        // Do not push sponsors that have all empty elements.
        const isEmpty = Object.values(sme).every(value => value.length === 0)
        if (!isEmpty) {
            smes.push(sme);
        }
    }

    return smes;
}


export function buildTeamsFromCSVStrings(teamProjectTitle: string, teamNamesArr: string[][], sponsorNamesArr: string[][],
    smeNamesArr: string[][], projectSummaryStr: string, imageLocationStr: string,
    teamVideoURL: string, teamPowerPointURL: string, teamPosterURL: string) : Team
{
    // Parse team names
    const teamMembers: TeamMember[] = parseTeamNames(teamNamesArr);

    // parse the sponsor names
    const sponsors: Sponsor[] = parseSponsorNames(sponsorNamesArr);

    // parse the sme names
    const smes: SME[] = parseSMENames(smeNamesArr);

    // Build the team interface
    var team = {} as Team
    team.teamMembers = teamMembers;
    team.sponsors = sponsors;
    team.smes = smes;
    team.projectSummary = projectSummaryStr.trim();
    team.imageUrl = imageLocationStr;
    team.videoUrl = teamVideoURL;
    team.presentationUrl = teamPowerPointURL;
    team.posterUrl = teamPosterURL;
    team.projectTitle = teamProjectTitle.trim();

    return team;
}