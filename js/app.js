import { PLANETS, state } from './config.js';
import { fetchOrbitalElements } from './api.js';
import { drawScene } from './renderer.js';

// #region DOM Elements
const canvas = document.getElementById('solar-canvas');
const ctx = canvas.getContext('2d');
const dateInput = document.getElementById('date-input');
const updateBtn = document.getElementById('update-btn');
const statusMsg = document.getElementById('status-msg');
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
        draw();
    });
    window.addEventListener('mouseup', () => state.isDragging = false);

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        if (e.deltaY < 0) {
            state.currentScale *= zoomFactor;
        } else {
            state.currentScale /= zoomFactor;
        }
        draw();
    }, { passive: false });

    // Initial draw (empty)
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
            results.push(updatedPlanet);

            // Wait 150ms between requests to avoid NASA API 503 rate limits
            await new Promise(r => setTimeout(r, 150));
        }

        state.planetData = {};
        results.forEach(res => {
            state.planetData[res.id] = res;
        });

        statusMsg.innerText = `Data loaded for ${dateStr}.`;

        // Auto-scale to fit roughly up to Jupiter on load
        if (state.planetData['599']) {
            const jupiterA = state.planetData['599'].elements.a;
            state.currentScale = (Math.min(canvas.width, canvas.height) / 2.5) / jupiterA;
            state.offsetX = 0;
            state.offsetY = 0;
        }

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

// #region Drawing Coordinator
function draw() {
    drawScene(ctx, canvas.width, canvas.height, state.currentScale, state.offsetX, state.offsetY, state.planetData);
}
// #endregion

// #region Execution
init();
// #endregion
