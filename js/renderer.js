import { project3Dto2D } from './projection.js';
import { calculate3DPosition, solveKepler, propagateMeanAnomaly } from './orbitMath.js';
import { CROSSHAIR_COLOR, CROSSHAIR_THICKNESS, state, AU_KM } from './config.js';

// #region Canvas Drawing Routines
export function drawScene(ctx, width, height, scale, offsetX, offsetY, planetData) {
    ctx.clearRect(0, 0, width, height);

    // Draw Reference Plane Grid
    drawReferencePlane(ctx, width, height, scale, offsetX, offsetY);

    // Draw Asteroid Belt if enabled
    if (state.showMinorPlanets) {
        const cx = width / 2 + offsetX;
        const cy = height / 2 + offsetY;
        drawAsteroidBelt(ctx, cx, cy, scale);
    }

    // Draw Sun
    const sun2d = project3Dto2D(0, 0, 0, width, height, scale, offsetX, offsetY);
    ctx.beginPath();
    ctx.arc(sun2d.x2d, sun2d.y2d, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffcc00';
    ctx.fill();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffaa00';
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Calculate elapsed time in seconds for orbital propagation
    const dtSeconds = (state.simulatedTime && state.epochTime)
        ? (state.simulatedTime.getTime() - state.epochTime.getTime()) / 1000
        : 0;

    // Draw Orbits and Planets
    Object.values(planetData).forEach(planet => {
        if (planet.isMinor && !state.showMinorPlanets) return;

        const elems = planet.elements;
        const currentMa = propagateMeanAnomaly(elems, planet.id, dtSeconds);
        const E = solveKepler(currentMa, elems.e);
        const pos3d = calculate3DPosition(elems, E);

        // Draw planet orbit (heliocentric)
        drawOrbit(ctx, width, height, scale, offsetX, offsetY, planet);

        // Draw moons if they are loaded and the scale is zoomed in enough
        if (planet.moonsData) {
            planet.moonsData.forEach(moon => {
                const orbitRadiusPx = moon.elements.a * scale;
                // Only show if the moon orbit is visually outside the planet body and resolved
                if (orbitRadiusPx > planet.radius + 3) {
                    // Draw moon orbit (planetocentric)
                    drawOrbit(ctx, width, height, scale, offsetX, offsetY, moon, pos3d, true);
                    drawMoon(ctx, width, height, scale, offsetX, offsetY, pos3d.x, pos3d.y, pos3d.z, moon, dtSeconds);
                }
            });
        }

        drawPlanet(ctx, width, height, scale, offsetX, offsetY, planet, pos3d, E);
    });
}

function drawReferencePlane(ctx, width, height, scale, offsetX, offsetY) {
    ctx.strokeStyle = CROSSHAIR_COLOR;
    ctx.lineWidth = CROSSHAIR_THICKNESS;

    // Draw X and Y axes of the ecliptic plane
    const p1 = project3Dto2D(-1e10, 0, 0, width, height, scale, offsetX, offsetY);
    const p2 = project3Dto2D(1e10, 0, 0, width, height, scale, offsetX, offsetY);
    ctx.beginPath(); ctx.moveTo(p1.x2d, p1.y2d); ctx.lineTo(p2.x2d, p2.y2d); ctx.stroke();

    const p3 = project3Dto2D(0, -1e10, 0, width, height, scale, offsetX, offsetY);
    const p4 = project3Dto2D(0, 1e10, 0, width, height, scale, offsetX, offsetY);
    ctx.beginPath(); ctx.moveTo(p3.x2d, p3.y2d); ctx.lineTo(p4.x2d, p4.y2d); ctx.stroke();
}

function drawAsteroidBelt(ctx, cx, cy, scale) {
    const innerRadius = 2.2 * AU_KM; // inner edge of belt in km (approx 2.2 AU)
    const outerRadius = 3.2 * AU_KM; // outer edge of belt in km (approx 3.2 AU)

    const rxInner = innerRadius * scale;
    const ryInner = innerRadius * Math.cos(state.tiltAngle) * scale;

    const rxOuter = outerRadius * scale;
    const ryOuter = outerRadius * Math.cos(state.tiltAngle) * scale;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rxOuter, ryOuter, 0, 0, 2 * Math.PI);
    ctx.ellipse(cx, cy, rxInner, ryInner, 0, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(128, 128, 128, 0.12)'; // grey semitransparent donut
    ctx.fill('evenodd');
}

function drawOrbit(ctx, width, height, scale, offsetX, offsetY, body, parentPos = { x: 0, y: 0, z: 0 }, isMoon = false) {
    const elems = body.elements;
    ctx.strokeStyle = `${body.color}${isMoon ? '2b' : '88'}`;
    ctx.lineWidth = isMoon ? 1 : 1.5;
    ctx.beginPath();

    const steps = isMoon ? 120 : 240;
    for (let i = 0; i <= steps; i++) {
        const E = (i / steps) * 2 * Math.PI;
        const pos3d = calculate3DPosition(elems, E);
        const pos2d = project3Dto2D(
            parentPos.x + pos3d.x,
            parentPos.y + pos3d.y,
            parentPos.z + pos3d.z,
            width, height, scale, offsetX, offsetY
        );
        if (i === 0) ctx.moveTo(pos2d.x2d, pos2d.y2d);
        else ctx.lineTo(pos2d.x2d, pos2d.y2d);
    }
    ctx.stroke();

    if (!isMoon) {
        // Draw Z-axis drop lines at Periapsis (E=0) and Apoapsis (E=PI)
        drawDropLine(ctx, width, height, scale, offsetX, offsetY, elems, 0, body.color, 'PA');
        drawDropLine(ctx, width, height, scale, offsetX, offsetY, elems, Math.PI, body.color, 'AA');
    }
}

function drawDropLine(ctx, width, height, scale, offsetX, offsetY, elems, E, color, label = null) {
    const pos3d = calculate3DPosition(elems, E);
    const pos2d = project3Dto2D(pos3d.x, pos3d.y, pos3d.z, width, height, scale, offsetX, offsetY);

    // Point on the Z=0 plane
    const posZero3d = { x: pos3d.x, y: pos3d.y, z: 0 };
    const posZero2d = project3Dto2D(posZero3d.x, posZero3d.y, posZero3d.z, width, height, scale, offsetX, offsetY);

    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(pos2d.x2d, pos2d.y2d);
    ctx.lineTo(posZero2d.x2d, posZero2d.y2d);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Anchor marker on the reference plane
    ctx.beginPath();
    ctx.arc(posZero2d.x2d, posZero2d.y2d, 2, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Draw label next to the orbital point
    if (label) {
        ctx.fillStyle = color;
        ctx.font = '8px sans-serif';
        ctx.fillText(label, pos2d.x2d + 5, pos2d.y2d - 4);
    }
}

function drawPlanet(ctx, width, height, scale, offsetX, offsetY, planet, pos3d, E) {
    const pos2d = project3Dto2D(pos3d.x, pos3d.y, pos3d.z, width, height, scale, offsetX, offsetY);

    // Draw drop line for current position too
    drawDropLine(ctx, width, height, scale, offsetX, offsetY, planet.elements, E, 'rgba(255,255,255,0.2)');

    // Planet circle
    ctx.beginPath();
    ctx.arc(pos2d.x2d, pos2d.y2d, planet.radius, 0, 2 * Math.PI);
    ctx.fillStyle = planet.color;
    ctx.fill();

    // Planet Label
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.fillText(planet.name, pos2d.x2d + 8, pos2d.y2d + 3);
}


function drawMoon(ctx, width, height, scale, offsetX, offsetY, parentX, parentY, parentZ, moon, dtSeconds) {
    const elems = moon.elements;
    const currentMa = propagateMeanAnomaly(elems, moon.id, dtSeconds);
    const E = solveKepler(currentMa, elems.e);
    const pos3dRel = calculate3DPosition(elems, E);
    const pos2d = project3Dto2D(
        parentX + pos3dRel.x,
        parentY + pos3dRel.y,
        parentZ + pos3dRel.z,
        width, height, scale, offsetX, offsetY
    );

    // Moon circle
    ctx.beginPath();
    ctx.arc(pos2d.x2d, pos2d.y2d, moon.radius, 0, 2 * Math.PI);
    ctx.fillStyle = moon.color;
    ctx.fill();

    // Moon label if zoomed in close enough
    const orbitRadiusPx = elems.a * scale;
    if (orbitRadiusPx > 35) {
        ctx.fillStyle = '#9aa0a6';
        ctx.font = '8px sans-serif';
        ctx.fillText(moon.name, pos2d.x2d + 5, pos2d.y2d + 2);
    }
}
// #endregion
