import fs from 'fs';
import * as path from "node:path";
import {Jimp, JimpMime} from 'jimp';
const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;


const JSON_REPOS = "results/json/repos"
const JSON_REPO_FILE = "results/json/repos.json"
const JSON_RANK_SIZE_FILE = "results/json/size.json"
const JSON_RANK_PRESENCE_FILE = "results/json/presence.json"
const SVG_RANK_SIZE = "results/rank_size.svg"
const SVG_RANK_PRESENCE = "results/rank_presence.svg"


const languageGroups = {
    TypeScript: ["TypeScript", "Svelte", "Vue"],
    JavaScript: ["JavaScript", "EJS", "Handlebars", "Mustache"],
    CSS: ["CSS", "SCSS", "Stylus"],
    HTML: ["HTML", "Blade", "Slim"],
    Python: ["Python", "Jupyter Notebook"],
    PHP: ["PHP", "Hack"],
    Shell: ["Shell", "PowerShell", "Batchfile"],
    C: ["C", "CMake"],
    Cpp: ["C++", "Makefile"],
    Java: ["Java", "Kotlin"],
    Swift: ["Swift", "Objective-C"],
    Go: ["Go"],
    Rust: ["Rust"],
    Ruby: ["Ruby"],
    Pascal: ["Pascal"],
    Docker: ["Dockerfile"],
    Infra: ["HCL", "Procfile", "Roff", "TSQL"],
};

async function getAllRepos(page = 1) {
    if (fs.existsSync(JSON_REPO_FILE)) {
        return JSON.parse(Buffer.from(fs.readFileSync(JSON_REPO_FILE)).toString("utf8"))
    }
    const res = await fetch(`https://api.github.com/user/repos?per_page=100&type=all&page=${page}`, {
        headers: { Authorization: `token ${token}` }
    })
    .then(res => res.json())
    .catch(() => {
        return [];
    })
    if (res.length === 100){
        return [...res, ...await getAllRepos(page+1)];
    }
    return res;
}

async function getLanguages(repoFullName) {
    if(fs.existsSync(`${JSON_REPOS}/${repoFullName}.json`)){
        return JSON.parse(Buffer.from(fs.readFileSync(`${JSON_REPOS}/${repoFullName}.json`)).toString("utf8"));
    }
    return await fetch(`https://api.github.com/repos/${repoFullName}/languages`, {
        headers: {Authorization: `token ${token}`}
    })
        .then(res => {
            fs.mkdirSync(path.dirname(`${JSON_REPOS}/${repoFullName}.json`), { recursive: true });
            fs.writeFileSync(`${JSON_REPOS}/${repoFullName}.json`, JSON.stringify(res));
            return res.json()
        })
        .catch(() => {
            return [];
        });
}
let usernames  = {};

const toSvg = async (title, data) => {
    const sorted = (Array.isArray(data) ? data : Object.entries(data))
        .sort((a, b) => b[1] - a[1]);

    const maxValue = Math.max(...sorted.map(([_, v]) => v));
    const valueWidth = maxValue.toString().length * 8 + 20;
    const avatar = await fetch(`https://github.com/${username}.png`)
        .then(res => res.arrayBuffer())
        .then(async r =>
            {
                const buffer = Buffer.from(r);
                const image = await Jimp.read(buffer);
                await image.resize({w: 40, h:40});
                return await image.getBase64(JimpMime.jpeg)
            }
        )
    return `
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="${80 + sorted.length * 20 + 20}">
    <style>
      text { font-family: 'JetBrains Mono', 'Fira Code', monospace; fill: #fff; font-size: 13px; }
      .title { font-size: 16px; font-weight: bold; fill: #6366f1; } /* indigo-500 */
    </style>
    <rect width="100%" height="100%" fill="#1e1e2f"/>
    
    <!-- Avatar -->
    <image href="${avatar}" x="40" y="20" width="40" height="40" clip-path="url(#avatarClip)" />
    <defs>
      <clipPath id="avatarClip">
        <circle cx="60" cy="40" r="20" />
      </clipPath>
    </defs>

    <!-- Title -->
    <text x="95" y="45" class="title">${title}</text>

    <!-- Language list -->
    ${sorted.map(([lang, val], i) => `
      <text x="40" y="${90 + i * 20}" text-anchor="start">${lang}</text>
      <text x="${380 - valueWidth}" y="${90 + i * 20}" text-anchor="end">${val}</text>
    `).join("")}
  </svg>
  `;
};
(async () => {
    const repos = await getAllRepos();
    console.log(repos.length);
    const totals = {};
    const used = {};
    let totalSize = 0;
    let totalRepos = 0;
    let totalOrganization = 0;
    for (const repo of repos) {
        if(repo.owner.type === "Organization") {
            totalOrganization++;
        }
        if(repo.owner.type === "Organization" || repo.owner.login === username){
            console.log(repo.full_name)
            totalRepos++;
            usernames[repo.full_name.split("/")[0]] = (usernames[repo.full_name.split("/")[0]] ?? 0) + 1;
            let langs  = await getLanguages(repo.full_name);

            for (const [lang, bytes] of Object.entries(langs)) {
                if(Number.isNaN(parseInt(bytes))){
                    continue;
                }
                for(const [key, value] of Object.entries(languageGroups)){
                    if(value.includes(lang)){
                        totals[key] = (totals[key] || 0) + bytes;
                        used[key] = (used[key] || 0) + 1;
                        totalSize += bytes;
                    }
                }
            }
        }

    }
    console.log(usernames);
    console.log("Total language usage across all repos:");
    console.log(
        Object.entries(totals)
            .sort((a, b) => b[1] - a[1])
            .map(([lang, bytes]) => `${lang}: ${bytes} bytes`)
            .join("\n")
    );
    const svg = await toSvg("Rank Languages by % bytes", Object.entries(totals).map(([lang, bytes]) => [lang, (bytes/totalSize*100).toFixed(2),"%"]));
    const svg2 = await toSvg("Rank Languages by presence", Object.entries(used).map(([lang, x]) => [lang, x, "x"]));
    fs.writeFileSync(SVG_RANK_SIZE, svg);
    fs.writeFileSync(SVG_RANK_PRESENCE, svg2);
    fs.writeFileSync(JSON_RANK_SIZE_FILE, JSON.stringify(totals));
    fs.writeFileSync(JSON_RANK_PRESENCE_FILE, JSON.stringify(used, null, 2));
    fs.writeFileSync(JSON_REPO_FILE, JSON.stringify(repos));
    console.log("total repo:", totalRepos);
    console.log("total org repo:", totalOrganization);
})();
