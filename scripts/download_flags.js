import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to countries.ts
const countriesPath = path.join(__dirname, '../src/data/countries.ts');
const publicFlagsDir = path.join(__dirname, '../public/flags');

// Ensure public/flags exists
if (!fs.existsSync(publicFlagsDir)) {
    fs.mkdirSync(publicFlagsDir, { recursive: true });
}

// Read countries.ts and extract codes
const content = fs.readFileSync(countriesPath, 'utf-8');
const match = content.match(/allCountriesData: Record<string, string> = ({[\s\S]*?});/);

if (!match) {
    console.error('Could not find allCountriesData in countries.ts');
    process.exit(1);
}

// Dirtyeval to get the object (since it's simple JSON-like structure inside the file)
// We need to be careful, but the file structure is known.
// Let's just use regex to find all keys "code": "name"
const codes = [];
const lines = match[1].split('\n');
for (const line of lines) {
    const codeMatch = line.match(/"([a-z]{2})":/);
    if (codeMatch) {
        codes.push(codeMatch[1]);
    }
}

console.log(`Found ${codes.length} country codes.`);

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
};

const downloadAll = async () => {
    let success = 0;
    let failed = 0;

    // Process in chunks to avoid too many potential connections, though 250 is small.
    // Let's do 10 at a time.
    for (let i = 0; i < codes.length; i += 10) {
        const chunk = codes.slice(i, i + 10);
        await Promise.all(chunk.map(async (code) => {
            const url = `https://flagcdn.com/${code}.svg`;
            const dest = path.join(publicFlagsDir, `${code}.svg`);

            if (fs.existsSync(dest)) {
                // console.log(`Skipping ${code} (already exists)`);
                // success++; // Treat as success
                // Actually, let's force download if we want to be sure, or just skip. 
                // User asked to "ensure" they are there.
            }

            try {
                process.stdout.write(`Downloading ${code}... `);
                await downloadFile(url, dest);
                console.log('OK');
                success++;
            } catch (err) {
                console.error(`FAILED (${err.message})`);
                failed++;
            }
        }));
    }

    console.log(`\nDownload complete. Success: ${success}, Failed: ${failed}`);
};

downloadAll();
