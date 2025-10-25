import {Jimp, JimpMime} from "jimp";

const GetGithubAvatar = async (username: string): Promise<string> => {
    return fetch(`https://github.com/${username}.png`)
        .then(res => res.arrayBuffer())
        .then(async r =>
            {
                const buffer = Buffer.from(r);
                const image = await Jimp.read(buffer);
                await image.resize({w: 40, h:40});
                return await image.getBase64(JimpMime.jpeg)
            }
        )
}

export const AvatarCard = async (username: string, title: string, data: Array<[string, string]> | Record<string, number>) => {
    const sorted = (Array.isArray(data) ? data : Object.entries(data))
        .sort((a, b) => b[1] - a[1]);

    const maxValue = Math.max(...sorted.map(([_, v]) => v));
    const valueWidth = maxValue.toString().length * 8 + 20;
    const avatar = GetGithubAvatar(username);
    return `
  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="${80 + sorted.length * 20 + 20}">
    <style>
      text { font-family: 'JetBrains Mono', 'Fira Code', monospace; fill: #fff; font-size: 13px; }
      .title { font-size: 16px; font-weight: bold; fill: #6366f1; }
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