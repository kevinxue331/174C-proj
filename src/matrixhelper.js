import * as THREE from 'three';
import * as math from 'https://cdn.jsdelivr.net/npm/mathjs@10.6.4/+esm';

export function rotationX(theta) {
    return math.matrix([
        [1, 0, 0, 0],
        [0, math.cos(theta), -math.sin(theta), 0],
        [0, math.sin(theta), math.cos(theta), 0],
        [0, 0, 0, 1]
    ]);
}

export function rotationY(theta) {
    return math.matrix([
        [math.cos(theta), 0, math.sin(theta), 0],
        [0, 1, 0, 0],
        [-math.sin(theta), 0, math.cos(theta), 0],
        [0, 0, 0, 1]
    ]);
}

export function rotationZ(theta) {
    return math.matrix([
        [math.cos(theta), -math.sin(theta), 0, 0],
        [math.sin(theta), math.cos(theta), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ]);
}

export function translationMatrix(x, y, z) {
    let T = math.identity(4);
    T = math.subset(T, math.index(0, 3), x);
    T = math.subset(T, math.index(1, 3), y);
    T = math.subset(T, math.index(2, 3), z);
    return T;
}

export function scalingMatrix(sx, sy, sz) {
    let S = math.identity(4); // Create a 4x4 identity matrix
    S = math.subset(S, math.index(0, 0), sx);
    S = math.subset(S, math.index(1, 1), sy);
    S = math.subset(S, math.index(2, 2), sz);
    return S;
}

export function decomposeMathMatrixToThree(matrix) {
    // Flatten the Math.js matrix to a 1D array
    const elements = math.flatten(matrix).toArray();

    // Create a Three.js Matrix4 instance
    const mathMatrix4 = new THREE.Matrix4().set(
        elements[0], elements[1], elements[2], elements[3],
        elements[4], elements[5], elements[6], elements[7],
        elements[8], elements[9], elements[10], elements[11],
        elements[12], elements[13], elements[14], elements[15]
    );

    // Create Three.js objects for translation, rotation, and scale
    const translation = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    // Decompose the matrix into translation, rotation, and scale
    mathMatrix4.decompose(translation, rotation, scale);

    return {
        translation: translation, // Three.js Vector3 for translation
        scale: scale,             // Three.js Vector3 for scaling
        rotation: rotation        // Three.js Quaternion for rotation
    };
}