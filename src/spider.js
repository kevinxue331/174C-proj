import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CCDIKSolver } from 'three/addons/animation/CCDIKSolver.js';

export default class Spider {
    constructor(player, collidables, canClimb = true, sizeScale = 1, speedFactor = 1.5) {
        this.initialized = false;
        this.root_bone_inverse_matrix = null;
        this.player = player;
        this.collidables = collidables;
        this.yaw = 0;
        this.pitch = 0;
        this.climbing = false;
        this.climbTimer = 0;
        this.canClimb = canClimb;

        this.sizeScale = sizeScale;
        this.speedScale = speedFactor

        this.upHelper = null;
        this.lookHelper = null;
    }

    addToScene(scene) {
        const loader = new GLTFLoader();
        this.scene = scene;

        loader.load(
            '/static/gltf/spider/spider.gltf',
            (gltf) => {
                scene.add(gltf.scene);

                // traverse the scene to find the skeleton
                let skinnedMesh;
                gltf.scene.traverse((object) => {
                    console.log("object found:", object.name);
                    // if (object.isBone) {
                    //     console.log("Bone found:", object.name);
                    // }
                    if (object.isSkinnedMesh) {
                        skinnedMesh = object;
                        console.log("SkinnedMesh found:", skinnedMesh);
                        console.log("Skeleton:", skinnedMesh.skeleton);
                    }
                });

                this.spiderRoot = gltf.scene.getObjectByName("Sketchfab_model");
                let ik_chains = [];
                this.left_targets = [];
                this.right_targets = [];
                this.left_rest_pos = [];
                this.right_rest_pos = [];

                function create_front_leg_ik_chain(femur_name, patella_name, tibia_name, meta_name, tarsus_name, target_array, rest_array, root) {
                    // find leg bones
                    const femur = gltf.scene.getObjectByName(femur_name);
                    const patella = gltf.scene.getObjectByName(patella_name);
                    const tibia = gltf.scene.getObjectByName(tibia_name);
                    const metatarsus = gltf.scene.getObjectByName(meta_name);
                    const tarsus = gltf.scene.getObjectByName(tarsus_name);

                    // create a new bone to act as the target
                    const targetBone = new THREE.Bone();
                    // set default position to where the end effector originally is
                    let end_effector_orig_pos = new THREE.Vector3();
                    tarsus.getWorldPosition(end_effector_orig_pos);
                    targetBone.position.copy(end_effector_orig_pos);
                    // push target bone to the skeleton
                    skinnedMesh.skeleton.bones.push(targetBone);
                    const inverseMatrix = new THREE.Matrix4().copy(targetBone.matrixWorld).invert();
                    skinnedMesh.skeleton.boneInverses.push(inverseMatrix);
                    // parent target bone to scene root for global positioning
                    gltf.scene.getObjectByName("Sketchfab_Scene").add(targetBone)

                    target_array.push(targetBone);

                    // convert & save the end effector's world position to local space relative to the body
                    const localEndEffectorPos = new THREE.Vector3();
                    const bodyInverseMatrix = new THREE.Matrix4();
                    bodyInverseMatrix.copy(root.matrixWorld).invert();
                    localEndEffectorPos.copy(end_effector_orig_pos).applyMatrix4(bodyInverseMatrix);
                    rest_array.push(localEndEffectorPos);

                    const initial_femur = new THREE.Vector3(femur.rotation.x, femur.rotation.y, femur.rotation.z);
                    const femur_affordance = new THREE.Vector3(Math.PI / 8, Math.PI / 8, 0);

                    const initial_patella = new THREE.Vector3(patella.rotation.x, patella.rotation.y, patella.rotation.z);
                    const patella_affordance = new THREE.Vector3(Math.PI / 6, Math.PI / 12, 0);

                    const initial_tibia = new THREE.Vector3(tibia.rotation.x, tibia.rotation.y, tibia.rotation.z);
                    const tibia_affordance = new THREE.Vector3(Math.PI / 8, Math.PI / 8, 0);

                    // create an IK chain
                    const ikChain = {
                        target: skinnedMesh.skeleton.bones.indexOf(targetBone), // End effector (e.g., foot)
                        effector: skinnedMesh.skeleton.bones.indexOf(tarsus), // Index of the effector bone
                        links: [
                            {
                                index: skinnedMesh.skeleton.bones.indexOf(metatarsus)
                            },
                            {
                                index: skinnedMesh.skeleton.bones.indexOf(tibia),
                                rotationMin: initial_tibia.clone().sub(tibia_affordance),
                                rotationMax: initial_tibia.clone().add(tibia_affordance),
                            },
                            {
                                index: skinnedMesh.skeleton.bones.indexOf(patella),
                                rotationMin: initial_patella.clone().sub(patella_affordance),
                                rotationMax: initial_patella.clone().add(patella_affordance),
                            },
                            {
                                index: skinnedMesh.skeleton.bones.indexOf(femur),
                                rotationMin: initial_femur.clone().sub(femur_affordance),
                                rotationMax: initial_femur.clone().add(femur_affordance),
                            }
                        ]
                    };

                    ik_chains.push(ikChain);
                }

                function create_leg_ik_chain(femur_name, tibia_name, meta_name, tarsus_name, target_array, rest_array, root) {
                    // find leg bones
                    const femur = gltf.scene.getObjectByName(femur_name);
                    const tibia = gltf.scene.getObjectByName(tibia_name);
                    const metatarsus = gltf.scene.getObjectByName(meta_name);
                    const tarsus = gltf.scene.getObjectByName(tarsus_name);

                    // create a new bone to act as the target
                    const targetBone = new THREE.Bone();
                    // set default position to where the end effector originally is
                    let end_effector_orig_pos = new THREE.Vector3();
                    tarsus.getWorldPosition(end_effector_orig_pos);
                    targetBone.position.copy(end_effector_orig_pos);
                    // push target bone to the skeleton
                    skinnedMesh.skeleton.bones.push(targetBone);
                    const inverseMatrix = new THREE.Matrix4().copy(targetBone.matrixWorld).invert();
                    skinnedMesh.skeleton.boneInverses.push(inverseMatrix);
                    // parent target bone to scene root for global positioning
                    gltf.scene.getObjectByName("Sketchfab_Scene").add(targetBone)

                    target_array.push(targetBone);

                    // convert & save the end effector's world position to local space relative to the body
                    const localEndEffectorPos = new THREE.Vector3();
                    const bodyInverseMatrix = new THREE.Matrix4();
                    bodyInverseMatrix.copy(root.matrixWorld).invert();
                    localEndEffectorPos.copy(end_effector_orig_pos).applyMatrix4(bodyInverseMatrix);
                    rest_array.push(localEndEffectorPos);

                    const initial_femur = new THREE.Vector3(femur.rotation.x, femur.rotation.y, femur.rotation.z);
                    const femur_affordance = new THREE.Vector3(Math.PI / 8, Math.PI / 8, Math.PI / 8);

                    const initial_tibia = new THREE.Vector3(tibia.rotation.x, tibia.rotation.y, tibia.rotation.z);
                    const tibia_affordance = new THREE.Vector3(Math.PI / 2, 0, Math.PI / 2);

                    // create an IK chain
                    const ikChain = {
                        target: skinnedMesh.skeleton.bones.indexOf(targetBone), // End effector (e.g., foot)
                        effector: skinnedMesh.skeleton.bones.indexOf(tarsus), // Index of the effector bone
                        links: [
                            {
                                index: skinnedMesh.skeleton.bones.indexOf(metatarsus)
                            },
                            {
                                index: skinnedMesh.skeleton.bones.indexOf(tibia),
                                rotationMin: initial_tibia.clone().sub(tibia_affordance),
                                rotationMax: initial_tibia.clone().add(tibia_affordance),
                            },
                            {
                                index: skinnedMesh.skeleton.bones.indexOf(femur),
                                rotationMin: initial_femur.clone().sub(femur_affordance),
                                rotationMax: initial_femur.clone().add(femur_affordance),
                            }
                        ]
                    };

                    ik_chains.push(ikChain);
                }

                create_front_leg_ik_chain("Leg1_L_1_33", "Leg1_L_2_32",
                    "Leg1_L_3_31", "Leg1_L_4_30", "Leg1_L_5_29", this.left_targets, this.left_rest_pos, this.spiderRoot);
                create_leg_ik_chain("Leg2_L_1_37", "Leg2_L_2_36",
                    "Leg2_L_3_35", "Leg2_L_4_34", this.left_targets, this.left_rest_pos, this.spiderRoot);
                create_leg_ik_chain("Leg3_L_1_41", "Leg3_L_2_40",
                    "Leg3_L_3_39", "Leg3_L_4_38", this.left_targets, this.left_rest_pos, this.spiderRoot);
                create_leg_ik_chain("Leg4_L_1_45", "Leg4_L_2_44",
                    "Leg4_L_3_43", "Leg4_L_4_42", this.left_targets, this.left_rest_pos, this.spiderRoot);
                create_front_leg_ik_chain("Leg1_R_1_12", "Leg1_R_2_11",
                    "Leg1_R_3_10", "Leg1_R_4_9", "Leg1_R_5_8", this.right_targets, this.right_rest_pos, this.spiderRoot);
                create_leg_ik_chain("Leg2_R_1_16", "Leg2_R_2_15",
                    "Leg2_R_3_14", "Leg2_R_4_13", this.right_targets, this.right_rest_pos, this.spiderRoot);
                create_leg_ik_chain("Leg3_R_1_20", "Leg3_R_2_19",
                    "Leg3_R_3_18", "Leg3_R_4_17", this.right_targets, this.right_rest_pos, this.spiderRoot);
                create_leg_ik_chain("Leg4_R_1_24", "Leg4_R_2_23",
                    "Leg4_R_3_22", "Leg4_R_4_21", this.right_targets, this.right_rest_pos, this.spiderRoot);


                // DEBUG
                // console.log("Mesh:", skinnedMesh);
                // console.log("Is SkinnedMesh:", skinnedMesh.isSkinnedMesh);
                // console.log("Skeleton:", skinnedMesh.skeleton);
                // console.log("Bones:", skinnedMesh.skeleton?.bones);
                //
                // console.log("Femur parent:", femur.parent);
                // console.log("Patella parent:", patella.parent);
                // console.log("Tibia parent:", tibia.parent);
                // console.log("Metatarsus parent:", metatarsus.parent);
                // console.log("Tarsus parent:", tarsus.parent);
                //
                // console.log("Is femur in skeleton:", skinnedMesh.skeleton.bones.includes(femur));
                // console.log("Is patella in skeleton:", skinnedMesh.skeleton.bones.includes(patella));
                // console.log("Is tibia in skeleton:", skinnedMesh.skeleton.bones.includes(tibia));
                // console.log("Is metatarsus in skeleton:", skinnedMesh.skeleton.bones.includes(metatarsus));
                // console.log("Is tarsus in skeleton:", skinnedMesh.skeleton.bones.includes(tarsus));

                this.ikSolver = new CCDIKSolver(skinnedMesh, ik_chains);

                // scene.add(this.ikSolver.createHelper());
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.log('An error happened', error);
            }
        );

        this.initialized = true;
    }


    isLegGrounded(leg, collidables) {
        const threshold = 0.1;
        const rayOrigin = leg.position.clone().add(new THREE.Vector3(0,0.25,0));
        const rayDirection = new THREE.Vector3(0, -1, 0); // Downward direction
        const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);

        const intersects = raycaster.intersectObjects(collidables, true);

        // if there's an intersection and it's within the threshold distance, return true
        if (intersects.length > 0 && intersects[0].distance <= threshold+0.25) {
            return true;
        }
        return false;
    }

    getNextRestPosition(restPosWorld, collidables, lookVector, upVector, returnThreshold = 1.5) {
        if(!this.canClimb) return restPosWorld;
        // Create a ray direction that is forward and upward at 30 degrees relative to the look vector
        const forwardVector = lookVector.clone().normalize();
        const upwardVector = upVector.clone().normalize();
        const rayDirection = new THREE.Vector3()
            .addVectors(
                forwardVector,
                upwardVector.clone().multiplyScalar(Math.tan(THREE.MathUtils.degToRad(30)))
            )
            .normalize();

        // Create a raycaster from the leg's resting position
        const raycaster = new THREE.Raycaster(restPosWorld, rayDirection);

        // Check for intersections with collidable objects
        const intersects = raycaster.intersectObjects(collidables, true);

        // If there's an intersection and it's within the returnThreshold, return the intersection point
        if (intersects.length > 0 && intersects[0].distance <= 0.75*returnThreshold) {
            this.climbing = true;
            this.climbTimer = 20;
            return intersects[0].point;
        }

        // Otherwise, return the original resting position
        return restPosWorld;
    }

    adjustPitchBasedOnLegHeightRelativeToUp(upVector) {
        // Get the positions of the front and back legs
        const frontLeft = this.left_targets[0].getWorldPosition(new THREE.Vector3());
        const frontRight = this.right_targets[1].getWorldPosition(new THREE.Vector3());
        const backLeft = this.left_targets[2].getWorldPosition(new THREE.Vector3());
        const backRight = this.right_targets[3].getWorldPosition(new THREE.Vector3());

        // Calculate the height of each leg relative to the up vector
        const frontLeftHeight = frontLeft.dot(upVector);
        const frontRightHeight = frontRight.dot(upVector);
        const backLeftHeight = backLeft.dot(upVector);
        const backRightHeight = backRight.dot(upVector);

        // Calculate the average height of the front legs
        const frontHeight = (frontLeftHeight + frontRightHeight) / 2;

        // Calculate the average height of the back legs
        const backHeight = (backLeftHeight + backRightHeight) / 2;

        // Compute the height difference (front - back)
        const heightDifference = frontHeight - backHeight;

        // Adjust the pitch based on the height difference
        const pitchSensitivity = -0.4; // Adjust this value as needed
        this.pitch = heightDifference * pitchSensitivity;

        // Clamp the pitch to avoid extreme rotations
        const maxPitch = Math.PI / 2; // 45 degrees in radians
        this.pitch = THREE.MathUtils.clamp(this.pitch, -maxPitch, maxPitch);
    }


    tick() {
        if (!this.initialized || this.ikSolver == null) return;

        const speedFactor = this.speedScale;
        const sizeFactor = this.sizeScale;

        this.spiderRoot.scale.set(sizeFactor, sizeFactor, sizeFactor);

        // full body movement
        const speed = 0.1 * speedFactor * sizeFactor;
        const playerPos = this.player.kirby.position.clone();
        const direction = new THREE.Vector3(playerPos.x - this.spiderRoot.position.x, 0, playerPos.z - this.spiderRoot.position.z).normalize();

        // turn speed in radians/frame
        const turnSpeed = 0.03 * speedFactor;

        // compute the target yaw angle
        const goalAngle = Math.atan2(direction.x, direction.z);

        // compute the shortest angular difference
        let angleDiff = ((goalAngle - this.yaw + Math.PI) % (2 * Math.PI)) - Math.PI;

        // ensure it's the shortest rotation direction
        if (angleDiff > turnSpeed) this.yaw += turnSpeed;
        else if (angleDiff < -turnSpeed) this.yaw -= turnSpeed;
        else this.yaw = goalAngle; // Snap if within turnSpeed range

        // apply yaw
        this.spiderRoot.rotation.set(this.pitch-Math.PI / 2, 0, this.yaw - Math.PI / 2);

        const lookVector = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0));
        const upVector = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0));

        if(lookVector !== undefined && upVector !== undefined) {
            const material = new THREE.LineBasicMaterial({ color: 0xff00ff });
            const upGeometry = new THREE.BufferGeometry().setFromPoints([this.spiderRoot.position, this.spiderRoot.position.clone().add(lookVector.clone().multiplyScalar(10))]);
            const lookGeometry = new THREE.BufferGeometry().setFromPoints([this.spiderRoot.position, this.spiderRoot.position.clone().add(upVector.clone().multiplyScalar(10))]);
            const upHelper = new THREE.Line(upGeometry, material);
            const lookHelper = new THREE.Line(lookGeometry, material);

            if(this.upHelper != null) this.scene.remove(this.upHelper);
            if(this.lookHelper != null) this.scene.remove(this.lookHelper);
            this.upHelper = upHelper;
            this.lookHelper = lookHelper;

            this.scene.add(upHelper);
            this.scene.add(lookHelper);
        }

        // move forward
        const moveStep = new THREE.Vector3(0, 0, speed).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0));
        this.spiderRoot.position.add(moveStep);

        if(this.climbing) {
            if(this.climbTimer > 0) this.climbTimer--;
            else this.climbing = false;
        }
        let oneLegGrounded = false;

        // legs follow
        for (let j = 0; j < 2; j++) {
            let targets = [];
            let rest_positions = [];
            if (j === 0) {
                targets = this.left_targets;
                rest_positions = this.left_rest_pos;
            } else {
                targets = this.right_targets;
                rest_positions = this.right_rest_pos;
            }

            for (let i = 0; i < 4; i++) {
                // Assuming targets is an array of objects with position and grounded properties
                let target = targets[i];
                let restPosLocal = rest_positions[i].clone();
                let restPosWorld = new THREE.Vector3();
                restPosWorld.copy(restPosLocal).applyMatrix4(this.spiderRoot.matrixWorld);

                const returnThreshold = 2*sizeFactor;
                const returnSpeed = 0.4 * speedFactor*sizeFactor; // Adjust for desired speed
                const legLiftAmount = 0.1*sizeFactor;

                // Initialize leg-specific attributes if they are undefined
                if (target.returning === undefined) {
                    target.returning = false;
                }
                if (target.grounded === undefined) {
                    target.grounded = false;
                }

                // get next rest position
                restPosWorld = this.getNextRestPosition(restPosWorld, this.collidables, lookVector, upVector, returnThreshold);


                // Main logic
                if (target.returning) {
                    // Move the target towards the resting position
                    target.position.add(restPosWorld.clone().sub(target.position).normalize().multiplyScalar(returnSpeed));
                    if (target.position.distanceTo(restPosWorld) < returnSpeed) {
                        target.position.copy(restPosWorld);
                        target.returning = false;
                    }
                } else if (target.position.distanceTo(restPosWorld) > returnThreshold) {
                    // If adjacent legs are grounded, lift leg and begin return to resting position
                    let adjacentLegsGrounded = true;
                    if (i > 0 && targets[i - 1] !== undefined && targets[i - 1].returning) adjacentLegsGrounded = false;
                    else if (i < 7 && targets[i + 1] !== undefined && targets[i + 1].returning) adjacentLegsGrounded = false;
                    else if (j === 0 && this.right_targets[i] !== undefined && this.right_targets[i].returning) adjacentLegsGrounded = false;
                    else if (j === 1 && this.left_targets[i] !== undefined && this.left_targets[i].returning) adjacentLegsGrounded = false;

                    if (adjacentLegsGrounded) {
                        target.returning = true;
                        target.position.add(new THREE.Vector3(0, legLiftAmount, 0));
                        target.position.add(restPosWorld.clone().sub(target.position).normalize().multiplyScalar(returnSpeed));
                    }
                }

                target.grounded = this.isLegGrounded(target, this.collidables);
                if(target.grounded) oneLegGrounded = true;
            }
        }

        if(this.climbing && this.climbTimer === 20) this.adjustPitchBasedOnLegHeightRelativeToUp(upVector);
        // else if(this.pitch < 0) this.pitch+=0.01;

        if(!this.climbing && !oneLegGrounded) {
            console.log("fall already")
            if(this.spiderRoot.position.y > 0.3) this.spiderRoot.position.add(new THREE.Vector3(0,-0.3,0));
            if(this.pitch < 0) this.pitch += 0.05;
        }

        if(this.spiderRoot.position.y < 0.3) this.spiderRoot.position.y = 0.3;

        this.ikSolver.update();
    }
}