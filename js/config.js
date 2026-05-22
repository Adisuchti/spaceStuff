// #region Configuration & Constants
export const API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";
export const DEG_TO_RAD = Math.PI / 180;
export const AU_KM = 149597870.7; // 1 Astronomical Unit in km //not yet implemented but maybe useful for displaying distances.

export const PLANETS = [
    { id: '199', name: 'Mercury', color: '#a8a8a8', radius: 3 },
    { id: '299', name: 'Venus', color: '#e0cda4', radius: 4 },
    { id: '399', name: 'Earth', color: '#6b93d6', radius: 4.5 },
    { id: '499', name: 'Mars', color: '#c1440e', radius: 3.5 },
    { id: '599', name: 'Jupiter', color: '#d8ca9d', radius: 8 },
    { id: '699', name: 'Saturn', color: '#ead6b8', radius: 7 },
    { id: '799', name: 'Uranus', color: '#d1e7e7', radius: 5.5 },
    { id: '899', name: 'Neptune', color: '#5b5ddf', radius: 5.5 },
    { id: '999', name: 'Pluto', color: '#dddddd', radius: 2 }
];

export const TILT_ANGLE = 60 * DEG_TO_RAD; // Angle to rotate X-axis for isometric view
export const CROSSHAIR_COLOR = 'rgba(255, 255, 255, 0.4)';
export const CROSSHAIR_THICKNESS = 1;
// #endregion

// #region Application State
export const state = {
    planetData: {}, // Stores fetched and calculated data
    currentScale: 2e-7, // initial zoom scale (pixels per km)
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
};
// #endregion
