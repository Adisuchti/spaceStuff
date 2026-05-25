import { PLANETS, state, TILT_ANGLE } from './config.js';
import { fetchOrbitalElements } from './api.js';
import { drawScene } from './renderer.js';
import { solveKepler, calculate3DPosition } from './orbitMath.js';

// #region DOM Elements
const canvas = document.getElementById('solar-canvas');
const ctx = canvas.getContext('2d');
const dateInput = document.getElementById('date-input');
const updateBtn = document.getElementById('update-btn');
const statusMsg = document.getElementById('status-msg');
const minorPlanetsCb = document.getElementById('minor-planets-cb');
// #endregion

// #region Initialization
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Event Listeners
    updateBtn.addEventListener('click', handleUpdate);
    minorPlanetsCb.addEventListener('change', (e) => {
        state.showMinorPlanets = e.target.checked;
        buildSidebarList();
        draw();
    });

    // Pan & Zoom Listeners
    canvas.addEventListener('mousedown', (e) => {
        state.isDragging = true;
        state.dragStartX = e.clientX - state.offsetX;
        state.dragStartY = e.clientY - state.offsetY;
    });
    window.addEventListener('mousemove', (e) => {
        if (!state.isDragging) return;
        state.offsetX = e.clientX - state.dragStartX;
        state.offsetY = e.clientY - state.dragStartY;
        
        // Break focus lock on drag/pan
        if (state.focusedPlanetId) {
            state.focusedPlanetId = null;
            updateSidebarActiveHighlight();
        }
        
        draw();
    });
    window.addEventListener('mouseup', () => state.isDragging = false);

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const oldScale = state.currentScale;
        if (e.deltaY < 0) {
            state.currentScale *= zoomFactor;
        } else {
            state.currentScale /= zoomFactor;
        }
        
        // Scale offsets so that zoom centers on the screen center
        const scaleRatio = state.currentScale / oldScale;
        state.offsetX *= scaleRatio;
        state.offsetY *= scaleRatio;
        
        draw();
    }, { passive: false });

    // Build empty/initial status sidebar
    buildSidebarList();
    draw();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}
// #endregion

// #region API Interaction
async function handleUpdate() {
    const dateStr = dateInput.value;
    if (!dateStr) return;

    updateBtn.classList.add('loading');
    updateBtn.disabled = true;
    statusMsg.innerText = "Fetching orbital elements from NASA JPL Horizons...";

    try {
        const nextDay = new Date(dateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        const endDateStr = nextDay.toISOString().split('T')[0];

        const results = [];
        for (const planet of PLANETS) {
            statusMsg.innerText = `Fetching ${planet.name}...`;
            const updatedPlanet = await fetchOrbitalElements(planet, dateStr, endDateStr);
            
            // Preload moons
            if (planet.moons && planet.moons.length > 0) {
                updatedPlanet.moonsData = [];
                for (const moon of planet.moons) {
                    statusMsg.innerText = `Fetching ${planet.name} - ${moon.name}...`;
                    const updatedMoon = await fetchOrbitalElements(moon, dateStr, endDateStr, `500@${planet.id}`);
                    updatedPlanet.moonsData.push(updatedMoon);
                    // Wait 150ms buffer to respect rate limits
                    await new Promise(r => setTimeout(r, 150));
                }
            }

            results.push(updatedPlanet);

            // Wait 150ms between requests to avoid NASA API 503 rate limits
            await new Promise(r => setTimeout(r, 150));
        }

        state.planetData = {};
        results.forEach(res => {
            state.planetData[res.id] = res;
        });

        statusMsg.innerText = `Data loaded for ${dateStr}.`;
        state.focusedPlanetId = null; // reset focus

        // Auto-scale to fit roughly up to Jupiter on load
        if (state.planetData['599']) {
            const jupiterA = state.planetData['599'].elements.a;
            state.currentScale = (Math.min(canvas.width, canvas.height) / 2.5) / jupiterA;
            state.offsetX = 0;
            state.offsetY = 0;
        }

        buildSidebarList();
        draw();

    } catch (error) {
        console.error(error);
        statusMsg.innerText = `Error: ${error.message}`;
    } finally {
        updateBtn.classList.remove('loading');
        updateBtn.disabled = false;
    }
}
// #endregion

// #region Sidebar Navigation Panel
function buildSidebarList() {
    const listContainer = document.getElementById('planet-list');
    const statusContainer = document.getElementById('planet-list-status');

    if (!state.planetData || Object.keys(state.planetData).length === 0) {
        listContainer.style.display = 'none';
        statusContainer.style.display = 'block';
        statusContainer.innerText = 'No data loaded. Click "Calculate / Update" to load moons.';
        return;
    }

    statusContainer.style.display = 'none';
    listContainer.style.display = 'flex';
    listContainer.innerHTML = '';

    Object.values(state.planetData).forEach(planet => {
        // Only list planets that have moons
        if (!planet.moons || planet.moons.length === 0) return;

        // Hide dwarf/minor planets in the list if the checkbox is unchecked
        if (planet.isMinor && !state.showMinorPlanets) return;

        const item = document.createElement('div');
        item.className = 'planet-item';
        if (state.focusedPlanetId === planet.id) {
            item.classList.add('active');
        }
        item.dataset.planetId = planet.id;

        const moonNamesStr = planet.moons.map(m => m.name).join(', ');
        const moonCount = planet.moons.length;

        item.innerHTML = `
            <div class="planet-dot" style="color: ${planet.color};"></div>
            <div class="planet-info">
                <div class="planet-name-row">
                    <span class="planet-name">${planet.name}</span>
                    <span class="moon-count">${moonCount} ${moonCount === 1 ? 'moon' : 'moons'}</span>
                </div>
                <div class="moon-names">${moonNamesStr}</div>
            </div>
        `;

        item.addEventListener('click', () => {
            if (state.focusedPlanetId === planet.id) {
                // Unlock focus if clicked again
                state.focusedPlanetId = null;
            } else {
                state.focusedPlanetId = planet.id;

                // Adjust camera zoom to beautifully frame the planet's moons
                if (planet.moonsData && planet.moonsData.length > 0) {
                    const maxA = Math.max(...planet.moonsData.map(m => m.elements.a));
                    // Frame outermost moon orbit to fit 25% of viewport min dimension
                    state.currentScale = (Math.min(canvas.width, canvas.height) / 4) / maxA;
                } else {
                    state.currentScale = 5e-5;
                }
            }
            updateSidebarActiveHighlight();
            draw();
        });

        listContainer.appendChild(item);
    });
}

function updateSidebarActiveHighlight() {
    const items = document.querySelectorAll('.planet-item');
    items.forEach(item => {
        if (item.dataset.planetId === state.focusedPlanetId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}
// #endregion

// #region Drawing Coordinator
function draw() {
    if (state.focusedPlanetId && state.planetData[state.focusedPlanetId]) {
        const planet = state.planetData[state.focusedPlanetId];
        const elems = planet.elements;
        const E = solveKepler(elems.ma, elems.e);
        const pos3d = calculate3DPosition(elems, E);

        // Center on the focused planet's projected 2D coordinates
        // Rotate around X-axis for isometric tilt to match project3Dto2D
        const y_rot = pos3d.y * Math.cos(TILT_ANGLE) - pos3d.z * Math.sin(TILT_ANGLE);
        const x_rot = pos3d.x;

        state.offsetX = -x_rot * state.currentScale;
        state.offsetY = y_rot * state.currentScale;
    }

    drawScene(ctx, canvas.width, canvas.height, state.currentScale, state.offsetX, state.offsetY, state.planetData);
}
// #endregion

// #region Execution
init();
// #endregion
