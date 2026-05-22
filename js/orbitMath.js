// #region Kepler Equation Solver
export function solveKepler(M, e) {
    let E = M;
    let F, dF;
    const maxIter = 100;
    const tol = 1e-6;
    for (let i = 0; i < maxIter; i++) {
        F = E - e * Math.sin(E) - M;
        if (Math.abs(F) < tol) break;
        dF = 1 - e * Math.cos(E);
        E = E - F / dF;
    }
    return E;
}
// #endregion

// #region Coordinate Calculation
export function calculate3DPosition(elements, E) {
    const { a, e, i, om, w } = elements;

    // Position in orbital plane (x axis towards periapsis)
    const x_prime = a * (Math.cos(E) - e);
    const y_prime = a * Math.sqrt(1 - e * e) * Math.sin(E);

    // Rotate to 3D ecliptic coords
    const cos_om = Math.cos(om), sin_om = Math.sin(om);
    const cos_w = Math.cos(w), sin_w = Math.sin(w);
    const cos_i = Math.cos(i), sin_i = Math.sin(i);

    const x = x_prime * (cos_om * cos_w - sin_om * cos_i * sin_w) - y_prime * (cos_om * sin_w + sin_om * cos_i * cos_w);
    const y = x_prime * (sin_om * cos_w + cos_om * cos_i * sin_w) - y_prime * (sin_om * sin_w - cos_om * cos_i * cos_w);
    const z = x_prime * (sin_i * sin_w) + y_prime * (sin_i * cos_w);

    return { x, y, z };
}
// #endregion
