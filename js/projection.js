import { state } from './config.js';

// #region 3D to 2D Projection
export function project3Dto2D(x3d, y3d, z3d, width, height, scale, offsetX, offsetY) {
    // Rotate around X-axis for isometric tilt
    const y_rot = y3d * Math.cos(state.tiltAngle) - z3d * Math.sin(state.tiltAngle);
    const z_rot = y3d * Math.sin(state.tiltAngle) + z3d * Math.cos(state.tiltAngle);
    const x_rot = x3d;

    // Project to 2D
    const cx = width / 2 + offsetX;
    const cy = height / 2 + offsetY;

    return {
        x2d: cx + x_rot * scale,
        y2d: cy - y_rot * scale, // subtract because canvas Y is down
        zDepth: z_rot // used for z-sorting if needed
    };
}
// #endregion
