import {generateBarColors} from "../utils/colors";

export const RepoCard = (repos: Record<string, any>[]) => {
    const username = process.env.GITHUB_USERNAME;
    const total = {
        private: 0,
        public: 0,
        organization: 0
    }
    const colors = generateBarColors(3);
    for (const key in repos) {
        if(repos[key].owner.login === username) {
            total[repos[key].private?"private":"public"]++;
        }else if(repos[key].owner.type === "Organization") {
            total["organization"]++;
        }
    }
    const sum = total.organization + total.public + total.private;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250">
    <style>
      text { font-family: 'JetBrains Mono', 'Fira Code', monospace; fill: #fff; font-size: 13px; }
      .center {font-family: 'JetBrains Mono', 'Fira Code', monospace; fill: #fff; font-size: 20px; }
      .title { font-size: 16px; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-weight: bold; fill: #6366f1; } /* indigo-500 */
      .sub {font-size: 11px; font-family: 'JetBrains Mono', 'Fira Code', monospace; fill: #aaaaaa}
    </style>
    <rect width="100%" height="100%" fill="#0D0D0D"/>
    ${
        Object.keys(total).map((k, v) => {
            const length = ((total[k] / sum * 100) / 100) * circumference;
            const text = `
                <circle
                cx="100" cy="150" r="${radius}"
                fill="none"
                stroke="${colors[v]}"
                stroke-width="12"
                stroke-dasharray="${length} ${circumference - length}"
                stroke-dashoffset="-${offset}"
                transform="rotate(-90 100 100)"
                stroke-linecap="round"
                />
            `
            offset += length;
            return text
        })
    }
    <text
        x="150" y="90"
        text-anchor="middle"
        font-size="22"
        font-family="monospace"
        fill="#fff"
      >Total</text>
    <text
        x="150" y="115"
        text-anchor="middle"
        class="center"
      >${sum}</text>
      
    <circle r="5" cx="60" cy="190" fill="${colors[0]}"/>
    <circle r="5" cx="150" cy="190" fill="${colors[1]}"/>
    <circle r="5" cx="240" cy="190" fill="${colors[2]}"/>
    <text x="60" y="210" text-anchor="middle">${total.public}</text>
    <text x="150" y="210" text-anchor="middle">${total.private}</text>
    <text x="240" y="210" text-anchor="middle">${total.organization}</text>
    <text class="sub" x="60" y="225" text-anchor="middle">public</text>
    <text class="sub" x="150" y="225" text-anchor="middle">private</text>
    <text class="sub" x="240" y="225" text-anchor="middle">org</text>
    </svg>`;
}