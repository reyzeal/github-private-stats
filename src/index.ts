import * as fs from 'node:fs';
import {languageCard} from "./svg/language-card";
import {AvatarCard} from "./svg/avatar-card";
import {getAllRepos, getLanguages} from "./fetch/api";
import {
    JSON_RANK_PRESENCE_FILE,
    JSON_RANK_SIZE_FILE,
    JSON_REPO_FILE,
    LanguageGroups,
    SVG_RANK_PRESENCE,
    SVG_RANK_SIZE
} from "./config";
import {RepoCard} from "./svg/repo-card";
const username = process.env.GITHUB_USERNAME;
let usernames  = {};


(async () => {
    const repos = await getAllRepos();
    const totals : Record<string, number> = {};
    const used: Record<string, number> = {};
    let totalSize = 0;
    let totalRepos = 0;
    let totalOrganization = 0;
    for (const repo of repos) {
        if(repo.owner.type === "Organization") {
            totalOrganization++;
        }
        if(repo.owner.type === "Organization" || repo.owner.login === username){
            totalRepos++;
            usernames[repo.full_name.split("/")[0]] = (usernames[repo.full_name.split("/")[0]] ?? 0) + 1;
            let langs  = await getLanguages(repo.full_name);

            for (const [lang, bytes] of Object.entries(langs)) {
                if(Number.isNaN(parseInt(<string>bytes))){
                    continue;
                }
                for(const [key, value] of Object.entries(LanguageGroups)){
                    if(value.includes(lang)){
                        totals[key] = (totals[key] || 0) + <number>bytes;
                        used[key] = (used[key] || 0) + 1;
                        totalSize += <number>bytes;
                    }
                }
            }
        }

    }
    console.log(usernames);
    console.log("Total language usage across all repos:");
    console.log(
        Object.entries(totals)
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
            .map(([lang, bytes]) => `${lang}: ${bytes} bytes`)
            .join("\n")
    );
    const svg = await AvatarCard(username, "Rank Languages by % bytes",
        Object.entries(totals)
            .map(([lang, bytes]) =>
                [lang, (bytes/totalSize*100).toFixed(2)]
            )
    );
    const svg2 = await AvatarCard(username,"Rank Languages by presence",
        Object.entries(used)
            .map(([lang, x]) =>
                [lang, x.toString()])
    );
    fs.writeFileSync(SVG_RANK_SIZE, svg);
    fs.writeFileSync(SVG_RANK_PRESENCE, svg2);
    fs.writeFileSync(JSON_RANK_SIZE_FILE, JSON.stringify(totals));
    fs.writeFileSync(JSON_RANK_PRESENCE_FILE, JSON.stringify(used, null, 2));
    fs.writeFileSync(JSON_REPO_FILE, JSON.stringify(repos));
    const svg3 = languageCard(totals,"byte size", 2);
    fs.writeFileSync("results/language.svg", svg3, );
    const svg4 = languageCard(used, "repos", 1, ["Swift","Java"]);
    fs.writeFileSync("results/language_repo.svg", svg4);
    console.log("total repo:", totalRepos);
    console.log("total org repo:", totalOrganization);
    const svg5 = RepoCard(repos)
    fs.writeFileSync("results/repo_total.svg", svg5);
})();
