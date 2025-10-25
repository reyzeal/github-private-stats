/**
 * Generate color palette with smooth variations from base colors
 * @param {number} count - total colors to generate
 * @returns {string[]} array of hex colors
 */
export function generateBarColors(count = 20) {
    const baseColors = [
        "#5B8FF9", "#5AD8A6", "#5D7092", "#F6BD16", "#E8684A",
        "#6DC8EC", "#9270CA", "#FF9D4D", "#269A99", "#FF99C3"
    ];

    // Convert hex -> RGB
    const hexToRgb = (hex) => {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    // Convert RGB -> hex
    const rgbToHex = ([r, g, b]) =>
        `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

    // Lighten or darken a color
    const adjustColor = (hex, factor) => {
        const rgb = hexToRgb(hex).map((c) => {
            const adjusted = Math.min(255, Math.max(0, c * factor));
            return Math.round(adjusted);
        });
        return rgbToHex(rgb as [number, number, number]);
    };

    const colors = [];
    const variations = Math.ceil(count / baseColors.length);

    for (let i = 0; i < baseColors.length; i++) {
        for (let j = 0; j < variations; j++) {
            if (colors.length >= count) break;

            // Factor: alternate between slightly lighter and darker tones
            const factor = 1 + (j - variations / 2) * 0.25;
            colors.push(adjustColor(baseColors[i], factor));
        }
    }

    return colors.slice(0, count);
}