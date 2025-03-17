import * as THREE from 'three';

export function isColliding(movingObj, stationaryObj) {
    // Bounding box for the moving object
    const movingBox = new THREE.Box3().setFromObject(movingObj);

    // Bounding box for the stationary object
    const stationaryBox = new THREE.Box3().setFromObject(stationaryObj);

    // Broad-phase check: Check if bounding boxes intersect
    if (movingBox.intersectsBox(stationaryBox)) {
        return true;
    }
    return false;
}

const ks = 0.5; // Stiffness coefficient
const kd = 0.5;  // Damping coefficient

export function doCollision(playerObj, stationaryObj, entryVelocity, playerVelocity, player) {
    // Bounding box for the moving object
    const movingBox = new THREE.Box3().setFromObject(playerObj);

    // Bounding box for the stationary object
    const stationaryBox = new THREE.Box3().setFromObject(stationaryObj);

    // Broad-phase check: Check if bounding boxes intersect
    if (movingBox.intersectsBox(stationaryBox)) {
        // console.log("Bounding boxes intersect");

        // Narrow-phase check: Use raycasting in the opposite direction of velocity
        const raycaster = new THREE.Raycaster();
        // Cast a ray in the direction opposite to the velocity
        const neg_velocity = entryVelocity.clone().negate().normalize();
        const raycast_pos = playerObj.position.clone().add(neg_velocity.normalize().multiplyScalar(1));
        const direction = entryVelocity.normalize();
        raycaster.set(raycast_pos, direction);
        // player.createRope(raycast_pos, raycast_pos.clone().add(direction));

        const intersects = raycaster.intersectObject(stationaryObj);


        if (intersects.length > 0) {
            const intersect = intersects[0];
            const faceNormal = intersect.face.normal.clone().transformDirection(stationaryObj.matrixWorld);

            // Check if the moving object is approaching the surface
            const dot = direction.dot(faceNormal);
            if (dot < 0) {
                // Calculate the penetration depth
                const penetrationDepth = intersect.distance;

                // Calculate penalty force
                const velocityDotNormal = playerVelocity.clone().dot(faceNormal);
                let spring = ks * penetrationDepth;
                let damp = kd * velocityDotNormal; // Damping proportional to normal velocity

                // Clamp damping to prevent instability
                if (Math.abs(damp) > Math.abs(spring)) damp = spring;

                const penaltyForce = faceNormal.clone().multiplyScalar(spring - damp);

                // Debugging logs
                // console.log("spring: " + spring);
                // console.log("damp: " + damp);
                // console.log("penaltyForce: " + penaltyForce.length());

                return {penaltyForce: penaltyForce, isColliding: 2}
            }
        }
        else return {penaltyForce: new THREE.Vector3(0, 0, 0), isColliding: 1}
    }

    return {penaltyForce: new THREE.Vector3(0, 0, 0), isColliding: 0}
}

export function isOnGround(characterPosition, collidables, threshold = 0.1) {
    // Create a ray starting from the character's position, pointing downward
    const rayOrigin = characterPosition.clone().add(new THREE.Vector3(0,3,0));
    const rayDirection = new THREE.Vector3(0, -1, 0); // Downward direction
    const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);

    const intersects = raycaster.intersectObjects(collidables, true);

    // if there's an intersection and it's within the threshold distance, return true
    if (intersects.length > 0 && intersects[0].distance <= threshold+3) {
        return true;
    }
    return false;
}