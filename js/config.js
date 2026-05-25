// #region Configuration & Constants
export const API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";
export const DEG_TO_RAD = Math.PI / 180;
export const AU_KM = 149597870.7; // 1 Astronomical Unit in km //not yet implemented but maybe useful for displaying distances.

export const PLANETS = [
    { 
        id: '199', name: 'Mercury', color: '#a8a8a8', radius: 3 
    },
    { 
        id: '299', name: 'Venus', color: '#e0cda4', radius: 4 
    },
    { 
        id: '399', name: 'Earth', color: '#6b93d6', radius: 4.5,
        moons: [
            { id: '301', name: 'Moon', color: '#dddddd', radius: 1.5 }
        ]
    },
    { 
        id: '499', name: 'Mars', color: '#c1440e', radius: 3.5,
        moons: [
            { id: '401', name: 'Phobos', color: '#8c8c8c', radius: 1 },
            { id: '402', name: 'Deimos', color: '#7c7c7c', radius: 1 }
        ]
    },
    { 
        id: '599', name: 'Jupiter', color: '#d8ca9d', radius: 8,
        moons: [
            { id: '501', name: 'Io', color: '#f3e5ab', radius: 1.8 },
            { id: '502', name: 'Europa', color: '#b0e0e6', radius: 1.6 },
            { id: '503', name: 'Ganymede', color: '#d2b48c', radius: 2.2 },
            { id: '504', name: 'Callisto', color: '#a9a9a9', radius: 2 }
        ]
    },
    { 
        id: '699', name: 'Saturn', color: '#ead6b8', radius: 7,
        moons: [
            { id: '601', name: 'Mimas', color: '#b0b0b0', radius: 1 },
            { id: '602', name: 'Enceladus', color: '#f0f8ff', radius: 1.2 },
            { id: '606', name: 'Titan', color: '#ffb366', radius: 2.5 }
        ]
    },
    { 
        id: '799', name: 'Uranus', color: '#d1e7e7', radius: 5.5,
        moons: [
            { id: '704', name: 'Titania', color: '#e6e6e6', radius: 1.5 },
            { id: '705', name: 'Oberon', color: '#dcdcdc', radius: 1.4 }
        ]
    },
    { 
        id: '899', name: 'Neptune', color: '#5b5ddf', radius: 5.5,
        moons: [
            { id: '801', name: 'Triton', color: '#e0eeee', radius: 1.8 }
        ]
    },

    // Dwarf and Minor Planets
    { 
        id: '999', name: 'Pluto', color: '#dddddd', radius: 2, isMinor: true,
        moons: [
            { id: '901', name: 'Charon', color: '#a9a9a9', radius: 1.2 }
        ]
    },
    { id: '1;', name: 'Ceres', color: '#a2b9bc', radius: 2, isMinor: true },
    { id: '4;', name: 'Vesta', color: '#b2ad7f', radius: 1.8, isMinor: true },
    { id: '136199;', name: 'Eris', color: '#f7786b', radius: 2.1, isMinor: true },
    { id: '136108;', name: 'Haumea', color: '#c94c4c', radius: 2, isMinor: true },
    { id: '136472;', name: 'Makemake', color: '#b1cbbb', radius: 2, isMinor: true }
];

export const CROSSHAIR_COLOR = 'rgba(255, 255, 255, 0.2)';
export const CROSSHAIR_THICKNESS = 1;

// Standard Gravitational Parameters (mu = G * M) in km^3/s^2
// For planets: the parent body is the Sun (1.32712440018e11)
// For moons: the parent body is their respective planet
export const GRAVITATIONAL_PARAMETERS = {
    // Heliocentric (orbiting Sun)
    '199': 1.32712440018e11, // Mercury
    '299': 1.32712440018e11, // Venus
    '399': 1.32712440018e11, // Earth
    '499': 1.32712440018e11, // Mars
    '599': 1.32712440018e11, // Jupiter
    '699': 1.32712440018e11, // Saturn
    '799': 1.32712440018e11, // Uranus
    '899': 1.32712440018e11, // Neptune
    '999': 1.32712440018e11, // Pluto
    '1;': 1.32712440018e11,  // Ceres
    '4;': 1.32712440018e11,  // Vesta
    '136199;': 1.32712440018e11, // Eris
    '136108;': 1.32712440018e11, // Haumea
    '136472;': 1.32712440018e11, // Makemake

    // Planetary systems (moons orbiting parent planets)
    '301': 398600.44, // Earth (for Moon)
    '401': 42828.37,  // Mars (for Phobos)
    '402': 42828.37,  // Mars (for Deimos)
    '501': 126686534, // Jupiter (for Io)
    '502': 126686534, // Jupiter (for Europa)
    '503': 126686534, // Jupiter (for Ganymede)
    '504': 126686534, // Jupiter (for Callisto)
    '601': 37931187,  // Saturn (for Mimas)
    '602': 37931187,  // Saturn (for Enceladus)
    '606': 37931187,  // Saturn (for Titan)
    '704': 5793939,   // Uranus (for Titania)
    '705': 5793939,   // Uranus (for Oberon)
    '801': 6836529,   // Neptune (for Triton)
    '901': 869        // Pluto (for Charon)
};
// #endregion

// #region Application State
export const state = {
    planetData: {}, // Stores fetched and calculated data
    currentScale: 2e-7, // initial zoom scale (pixels per km)
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    showMinorPlanets: false, // Whether to display dwarf and minor planets on the canvas
    focusedPlanetId: null, // ID of planet to center/lock view on
    tiltAngle: 60 * DEG_TO_RAD, // User-controlled viewing inclination (tilt angle)

    // Animation state
    isAnimating: false,
    animationSpeed: 10, // Simulated days per real second
    epochTime: null, // Initial loaded date (Date object)
    simulatedTime: null // Active simulation date (Date object)
};
// #endregion
