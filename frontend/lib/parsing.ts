

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