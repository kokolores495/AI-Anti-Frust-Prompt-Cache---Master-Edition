const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, '..', 'ai-anti-frust.user.js');

const source = fs.readFileSync(SCRIPT_PATH, 'utf8');

const metaMatch = source.match(/\/\/\s*==UserScript==\s*\n([\s\S]*?)\/\/\s*==\/UserScript==/);
if (!metaMatch) {
    console.error('ERROR: No UserScript metadata block found.');
    process.exit(1);
}

const metaBlock = metaMatch[1];

function extractValues(key) {
    const regex = new RegExp(`^//\\s*@${key}\\s+(.+)$`, 'gm');
    const values = [];
    let m;
    while ((m = regex.exec(metaBlock)) !== null) {
        values.push(m[1].trim());
    }
    return values;
}

let errors = 0;

// @name
const names = extractValues('name');
if (names.length === 0) {
    console.error('ERROR: Missing @name.');
    errors++;
} else {
    console.log(`@name: ${names[0]}`);
}

// @version (semver-ish: major, major.minor, or major.minor.patch)
const versions = extractValues('version');
if (versions.length === 0) {
    console.error('ERROR: Missing @version.');
    errors++;
} else if (!/^\d+(\.\d+){0,2}$/.test(versions[0])) {
    console.error(`ERROR: @version "${versions[0]}" is not semver-ish (expected N, N.N, or N.N.N).`);
    errors++;
} else {
    console.log(`@version: ${versions[0]}`);
}

// @match
const matches = extractValues('match');
if (matches.length === 0) {
    console.error('ERROR: Missing @match (at least one required).');
    errors++;
} else {
    matches.forEach((m) => console.log(`@match: ${m}`));
}

// @grant
const grants = extractValues('grant');
if (grants.length === 0) {
    console.error('ERROR: Missing @grant (at least one required; use "none" if no API is needed).');
    errors++;
} else {
    grants.forEach((g) => console.log(`@grant: ${g}`));
}

if (errors > 0) {
    console.error(`\nValidation failed with ${errors} error(s).`);
    process.exit(1);
} else {
    console.log('\nMetadata validation passed.');
}
