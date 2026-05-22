import { project3Dto2D } from './projection.js';
import { calculate3DPosition, solveKepler } from './orbitMath.js';
import { CROSSHAIR_COLOR, CROSSHAIR_THICKNESS } from './config.js';

// #region Canvas Drawing Routines
export function drawScene(ctx, width, height, scale, offsetX, offsetY, planetData) {
    ctx.clearRect(0, 0, width, height);

    // Draw Reference Plane Grid
    drawReferencePlane(ctx, width, height, scale, offsetX, offsetY);

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

    // Draw Orbits and Planets
    Object.values(planetData).forEach(planet => {
        drawOrbit(ctx, width, height, scale, offsetX, offsetY, planet);
        drawPlanet(ctx, width, height, scale, offsetX, offsetY, planet);
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

function drawOrbit(ctx, width, height, scale, offsetX, offsetY, planet) {
    const elems = planet.elements;
    ctx.strokeStyle = `${planet.color}88`; // slightly transparent
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    // Draw path using Eccentric Anomaly from 0 to 2PI
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
        const E = (i / steps) * 2 * Math.PI;
        const pos3d = calculate3DPosition(elems, E);
        const pos2d = project3Dto2D(pos3d.x, pos3d.y, pos3d.z, width, height, scale, offsetX, offsetY);
        if (i === 0) ctx.moveTo(pos2d.x2d, pos2d.y2d);
        else ctx.lineTo(pos2d.x2d, pos2d.y2d);
    }
    ctx.stroke();

    // Draw Z-axis drop lines at Periapsis (E=0) and Apoapsis (E=PI)
    drawDropLine(ctx, width, height, scale, offsetX, offsetY, elems, 0, planet.color, 'PA');
    drawDropLine(ctx, width, height, scale, offsetX, offsetY, elems, Math.PI, planet.color, 'AA');
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

function drawPlanet(ctx, width, height, scale, offsetX, offsetY, planet) {
    const elems = planet.elements;
    // Current position uses Mean Anomaly
    const E = solveKepler(elems.ma, elems.e);
    const pos3d = calculate3DPosition(elems, E);
    const pos2d = project3Dto2D(pos3d.x, pos3d.y, pos3d.z, width, height, scale, offsetX, offsetY);

    // Draw drop line for current position too
    drawDropLine(ctx, width, height, scale, offsetX, offsetY, elems, E, 'rgba(255,255,255,0.5)');

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
// #endregion
