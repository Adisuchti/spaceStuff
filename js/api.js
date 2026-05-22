import { API_URL } from './config.js';

// #region API Ephemeris Fetcher
export async function fetchOrbitalElements(planet, dateStr, endDateStr) {
    const targetUrl = `${API_URL}?format=json&COMMAND='${encodeURIComponent(planet.id)}'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='ELEMENTS'&CENTER='500@10'&START_TIME='${dateStr}'&STOP_TIME='${endDateStr}'&STEP_SIZE='1 d'`;
    const proxyUrl = `proxy.php?url=${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    console.log(`[API Response] ${planet.name} (ID: ${planet.id}):`, data);

    if (data.error) throw new Error(data.error);

    const resultText = data.result;
    const soeMatch = resultText.match(/\$\$SOE([\s\S]*?)\$\$EOE/);
    if (!soeMatch) throw new Error("Could not parse ephemeris data");

    const ephemStr = soeMatch[1];

    const extractVal = (key) => {
        const regex = new RegExp(`\\b${key}\\s*=\\s*([-+]?[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?)`);
        const match = ephemStr.match(regex);
        return match ? parseFloat(match[1]) : null;
    };

    const a = extractVal('A');
    const e = extractVal('EC');
    const i = extractVal('IN');
    const om = extractVal('OM');
    const w = extractVal('W');
    const ma = extractVal('MA');

    console.log(`[Parsed Orbit Elements] ${planet.name}:`, { a, e, i, om, w, ma });

    if (a === null || e === null || i === null || om === null || w === null || ma === null) {
        throw new Error("Missing keplerian elements");
    }

    return {
        ...planet,
        elements: {
            a, e,
            i: i * Math.PI / 180,
            om: om * Math.PI / 180,
            w: w * Math.PI / 180,
            ma: ma * Math.PI / 180
        }
    };
}
// #endregion
