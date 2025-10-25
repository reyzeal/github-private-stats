import * as fs from "node:fs";
import * as path from "node:path";
import {JSON_REPO_FILE, JSON_REPOS} from "../config";
const token = process.env.GITHUB_TOKEN;

export async function getAllRepos(page = 1) {
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

export async function getLanguages(repoFullName) {
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