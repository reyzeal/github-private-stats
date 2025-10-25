import {createCanvas} from "canvas";
import {generateBarColors} from "../utils/colors";



function measureTextWidth(text: string, font = "12px sans-serif") {
    const canvas = createCanvas(200, 50);
    const ctx = canvas.getContext("2d");
    ctx.font = font;
    return ctx.measureText(text).width;
}
export function languageCard(rank: Record<string, number>, by="", other_threshold=2, exclude: string[] = []){
    let total = 0;

    const data = Object.entries(rank)
        .map(([key, value]) => ({key: key, value: value}))
        .sort((a, b) => b.value - a.value);

    for(let i = 0; i < data.length; i++){
        total += data[i].value;
    }
    let payload : Record<string, number> = {};

    for(let i = 0; i < data.length; i++){
        data[i].value = data[i].value/total*100;
        if(data[i].value <= other_threshold || exclude.includes(data[i].key)){
            payload["Others"] = (payload["Others"] ?? 0) + data[i].value;
        }else{
            payload[data[i].key] = data[i].value;
        }
    }
    const barColors = generateBarColors(Object.keys(payload).length)
    let bars : Record<string, any>[] = []
    let before = 0;
    let c = 0;
    for(let i of Object.entries(payload).sort((a,b) => b[1]-a[1])){
        bars.push({
            x: 40+before,
            y: 60,
            width: Math.ceil(320*i[1]/100),
            height: 8,
            text: i[0],
            c,
            fill: barColors[c++],
            percent: i[1],
        })
        before += Math.ceil(320*i[1]/100);
    }
    console.log("payload",payload,rank, total);
    let x = 0;
    let y = 0;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${100+Math.ceil(c/2)*25}">
    <style>
        .title { font-family: 'JetBrains Mono', 'Fira Code', monospace; fill: #fff; font-size: 14px; font-weight: bold; }
        .lang {font-family: 'JetBrains Mono', 'Fira Code', monospace; fill: #fff; font-size: 12px;}
        .percent {font-family: 'JetBrains Mono', 'Fira Code', monospace; fill: #bdbdbd; font-size: 10px;}
    </style>
    <rect width="100%" height="100%" fill="#0D0D0D"/>
    <text x="40" y="42" fill="#fff" class="title">Language${by?` (${by})`:""}</text>
    ${bars.map(item => `<rect x="${item.x}" y="${item.y}" width="${item.width}" height="8" fill="${item.fill}"/>`).join('\n')}
    ${bars.map(item => `
        <circle cx="${item.c % 2 == 0 ? 45 : 215}" cy="${25 + item.y + 25 * Math.floor(item.c / 2)}" r="5" fill="${item.fill}"/>
        <text class="lang" x="${item.c % 2 == 0 ? 55 : 225}" y="${30 + item.y + 25 * Math.floor(item.c / 2)}">${item.text}</text>
        <text class="percent" x="${(item.c % 2 == 0 ? 55 : 225) + 5 + measureTextWidth(item.text, "12px 'JetBrains Mono', 'Fira Code', monospace")}" y="${30 + item.y + 25 * Math.floor(item.c / 2)}">${item.percent.toFixed(2)}%</text>
`).join('\n')}
</svg>`;
}