import * as THREE from 'three';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import * as collisions from "./collisions.js"
import {doCollision, isColliding} from "./collisions.js";

export default class Player {
    constructor(scene, camera, position = { x: 0, y: 3, z: 0 }, renderer, collidables) {
        this.scene = scene;
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.speed = 0.1;
        this.maxSpeed = 0.5;
        this.jumpForce = 0.8;
        this.gravity = -0.02;
        this.walkCycle = 0;
        this.onGround = false;
        this.rArm = null;
        //squish code
        this.deformation = {
            active: true,
            squashStrength: 0.4,  
            stretchStrength: 1.4,
            elasticity: 0.15,     
            maxDeform: 0.5,      
            defaultScale: new THREE.Vector3(1, 1, 1),
            currentScale: new THREE.Vector3(1, 1, 1)
        };
        
        // collision flags
        this.isColliding = false;
        this.entryVelocity = new THREE.Vector3();
        this.collidables = collidables;

        // integration
        this.t_sim = 0;
        this.bodyParts = {
            leftArm: null,
            rightArm: null,
            leftFoot: null,
            rightFoot: null,
            torso: null
        };

        // Grappling hook properties
        this.grapplingHook = {
            isActive: false, // Whether the grappling hook is active
            targetPoint: null, // The point where the rope intersects
            springConstant: 1.5, // Strength of the spring force
            damping: 0.95, // Damping to reduce oscillations
            rope: null, // Reference to the rope object
            timeout: 2, // how long grappling hook should survive for
            maxDistance: 100,
            ropeLength: 0,
            yScale: 0.065 // adjust for how swingy the swinging is
        };

        // Create Kirby's mesh
        this.kirby = new THREE.Group();
        this.kirby.position.set(position.x, position.y, position.z);
        this.scene.add(this.kirby);

        this.camera.lookAt(this.kirby.position); // Initially look at Kirby

        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };

        this.rotationSpeed = 0.002; // Sensitivity for mouse movement
        this.cameraRotationX = 0; // Vertical rotation (pitch)
        this.cameraRotationY = 0; // Horizontal rotation (yaw)

        // Camera settings
        this.cameraDistance = 5;
        this.cameraHeight = 2;

        this.flyControls = new FlyControls(this.camera, renderer);
        this.flyControls.movementSpeed = 0.3;
        this.flyControls.rollSpeed = Math.PI / 3;
        this.flyControls.autoForward = false;
        this.flyControls.enabled = false; // Start disabled

        const geo = new THREE.BoxGeometry(500, 50, 500);
        const mat = new THREE.MeshToonMaterial({ wireframe: true, side: THREE.DoubleSide, flatShading: true, color: 0x00fcec});

        this.reset();
        this.initListeners();
    }

    reset(){
        console.log("resetting kirby");
        this.deactivateGrapplingHook();
        this.kirby.position.set(0,10,100);
        this.onGround = false;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
    }

    addRArm(mesh){
        this.rArm = mesh;
    }
    addBodyPart(mesh) {
        this.kirby.add(mesh);

        // Identify body parts by their geometry or name if possible
        const name = mesh.geometry?.name || '';

        // Check if this mesh contains "L_arm" in the file path (based on how it was loaded)
        if (name.includes('kirby_L_arm') || (mesh.userData && mesh.userData.filePath?.includes('kirby_L_arm'))) {
            this.bodyParts.leftArm = mesh;
            console.log("Left arm attached");
        }
        // Right arm (already tracked via addRArm)
        else if (name.includes('kirby_R_arm') || (mesh.userData && mesh.userData.filePath?.includes('kirby_R_arm'))) {
            this.bodyParts.rightArm = mesh;
            console.log("Right arm attached");
        }
        // Left foot
        else if (name.includes('kirby_L_foot') || (mesh.userData && mesh.userData.filePath?.includes('kirby_L_foot'))) {
            this.bodyParts.leftFoot = mesh;
            console.log("Left foot attached");
        }
        // Right foot
        else if (name.includes('kirby_R_foot') || (mesh.userData && mesh.userData.filePath?.includes('kirby_R_foot'))) {
            this.bodyParts.rightFoot = mesh;
            console.log("Right foot attached");
        }
        // Torso
        else if (name.includes('kirby_torso') || (mesh.userData && mesh.userData.filePath?.includes('kirby_torso'))) {
            this.bodyParts.torso = mesh;
            console.log("Torso attached");
        }
    }
    animateLimbs(delta) {
        const { leftArm, rightArm, leftFoot, rightFoot } = this.bodyParts;
        // Always increment walk cycle for testing
        this.walkCycle += delta * 5;

        // Calculate movement speed (for animation speed)
        const moveSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        // Test animation to ensure arms move

        if (moveSpeed > 0.02) {
            if (leftArm) {
                if (this.onGround) {
                    leftArm.rotation.set(
                        Math.sin(this.walkCycle) * 0.01,  // X rotation (swinging forward/backward)
                        Math.sin((this.walkCycle + Math.PI) * 3) * 0.3,                                // Y rotation (unchanged)
                        0                                 // Z rotation (unchanged)
                    );
                } else {
                    leftArm.rotation.set(0, -0.4, 0);
                }
            }
            if (rightArm && rightArm === this.rArm) {
                // If this is the grappling hook arm, make sure it's being animated
                if (this.onGround) {
                    rightArm.rotation.set(
                        Math.sin(this.walkCycle) * 0.01,  // X rotation (opposite of left arm)
                        Math.sin((this.walkCycle + Math.PI) * 3) * 0.3,                                         // Y rotation
                        0                                          // Z rotation
                    );
                } else {
                    rightArm.rotation.set(0, 0.4, 0);
                }
            }
            if (leftFoot) {
                if (this.onGround) {
                    leftFoot.rotation.set(
                        0,  // X rotation (swinging forward/backward)
                        Math.sin((this.walkCycle) * 3) * 0.3,                                // Y rotation (unchanged)
                        0                                 // Z rotation (unchanged)
                    );
                } else {
                    leftFoot.rotation.set(0, 0.4, 0.07);
                }
            }
            if (rightFoot) {
                if (this.onGround) {
                    rightFoot.rotation.set(
                        0,  // X rotation (opposite of left foot)
                        Math.sin((this.walkCycle + Math.PI / 2) * 3) * 0.3,                                // Y rotation (unchanged)
                        0                                 // Z rotation (unchanged)
                    );
                } else {
                    rightFoot.rotation.set(0, -0.4, 0.07);
                }
            }
        }

        // Rest of your animation can remain as is


    }

    initListeners() {
        window.addEventListener('keydown', (event) => this.handleKey(event, true));
        window.addEventListener('keyup', (event) => this.handleKey(event, false));
        document.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        window.addEventListener('click', () => {
            this.requestPointerLock(); // Lock pointer
            if(this.grapplingHook.isActive) this.deactivateGrapplingHook();
            else this.shootRope(); // Shoot rope
        });
    }

    createCrosshair(position) {
        const crosshairMaterial = new THREE.SpriteMaterial({
            color: 0xff00ff, // Pink color
            map: new THREE.TextureLoader().load('/static/tex/spiderweb_4.png'),
            transparent: true
        });
        const crosshair = new THREE.Sprite(crosshairMaterial);
        crosshair.scale.set(5, 5, 5); // Adjust size
        crosshair.position.copy(position);
        this.scene.add(crosshair);

        // Store the crosshair reference for later removal
        this.grapplingHook.crosshair = crosshair;
    }

    createRope(start, end) {
        const material = new THREE.LineBasicMaterial({ color: 0xff00ff });
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const rope = new THREE.Line(geometry, material);

        this.scene.add(rope);

        // Store the rope reference for later removal
        this.grapplingHook.rope = rope;

        // Remove rope after 3 seconds (or when the grappling hook is deactivated)
        setTimeout(() => {
            if (this.grapplingHook.rope) {
                this.scene.remove(this.grapplingHook.rope);
                this.grapplingHook.rope = null;
                // this.deactivateGrapplingHook();
            }
        }, this.grapplingHook.timeout*1000);
    }

    shootRope() {
        const maxLength = this.grapplingHook.maxDistance; // Maximum rope length
        const ropeStartY = 2;
        const direction = new THREE.Vector3();
        let ropeStart = this.kirby.position.clone();
        ropeStart.y = ropeStart.y + ropeStartY; // Move rope up a bit so it looks like it's coming from Kirby

        this.camera.getWorldDirection(direction); // Get camera's forward direction

        const raycaster = new THREE.Raycaster(ropeStart, direction.normalize(), 0, maxLength);
        const intersects = raycaster.intersectObjects(this.scene.children, true); // Check for collisions

        if (intersects.length > 0) {
            // Activate the grappling hook
            this.deactivateGrapplingHook(); // deactivate if already activated
            this.grapplingHook.isActive = true;
            this.grapplingHook.targetPoint = intersects[0].point.clone(); // Store the intersection point
            this.grapplingHook.ropeLength = this.kirby.position.distanceTo(this.grapplingHook.targetPoint); // Calculate rope length

            // Create the rope
            this.createRope(ropeStart, this.grapplingHook.targetPoint);
            this.createCrosshair(this.grapplingHook.targetPoint);
        }
    }

    applyForce(force) {
        this.velocity.add(force);
    }

    applySpringForce() {
        let force = new THREE.Vector3();
        if (!this.grapplingHook.isActive || !this.grapplingHook.targetPoint) return;

        // Calculate the vector from Kirby to the target point
        const ropeVector = new THREE.Vector3()
            .subVectors(this.grapplingHook.targetPoint, this.kirby.position);

        // Calculate the spring force (tension force)
        const springForce = ropeVector
            .normalize()
            .multiplyScalar(ropeVector.length() * this.grapplingHook.springConstant); // Stronger spring force

        // Apply damping to reduce oscillations
        springForce.sub(this.velocity.clone().multiplyScalar(this.grapplingHook.damping));
        springForce.y *= this.grapplingHook.yScale;

        // Apply the spring force to Kirby's acceleration
        force.add(springForce);

        // Apply gravity to create the pendulum effect
        force.y += this.gravity;

        // Add a sideways force to simulate swinging
        const swingForce = new THREE.Vector3()
            .crossVectors(ropeVector, new THREE.Vector3(0, 1, 0)) // Cross product with up vector
            .normalize()
            .multiplyScalar(this.velocity.length() * 0.5); // Increased swing force scaling



        const maxSwingForce = 2; // Maximum swing force magnitude
        if (swingForce.length() > maxSwingForce) {
            swingForce.setLength(maxSwingForce);
        }



        force.add(swingForce);

        // Check if Kirby is close enough to the target point to deactivate the grappling hook
        const distanceToTarget = this.kirby.position.distanceTo(this.grapplingHook.targetPoint);
        if (distanceToTarget < 3) {
            console.log("Disabling grappling hook");
            this.deactivateGrapplingHook();
        }

        return force;
    }
    applySquashAndStretch(delta) {
        if (!this.deformation.active) return;

        const accelMagnitude = this.acceleration.length();

        if (accelMagnitude < 0.05) {
            this.deformation.currentScale.lerp(this.deformation.defaultScale, this.deformation.elasticity);
            this.kirby.scale.copy(this.deformation.currentScale);
            return;
        }
        const accelDir = this.acceleration.clone().normalize();

        if (Math.abs(accelDir.y) > 0.7) {
            // vertical deformation
            if (accelDir.y > 0) {
                console.log("option 1")
                const stretchFactor = 1 + (accelMagnitude * this.deformation.stretchStrength);
                const squeezeFactor = 1 / Math.sqrt(stretchFactor);

                this.deformation.currentScale.set(
                    squeezeFactor,
                    Math.min(stretchFactor, 1 + this.deformation.maxDeform),
                    squeezeFactor
                );
            }
            else {
                console.log("option 2")
                const squashFactor = 1 - (accelMagnitude * this.deformation.squashStrength);
                const bulgeFactor = 1 / Math.sqrt(squashFactor);

                this.deformation.currentScale.set(
                    Math.min(bulgeFactor, 1 + this.deformation.maxDeform),
                    Math.max(squashFactor, 1 - this.deformation.maxDeform),
                    Math.min(bulgeFactor, 1 + this.deformation.maxDeform)
                );
            }
        }
        // horizontal movement
        else {
            const horizontalDir = new THREE.Vector3(accelDir.x, 0, accelDir.z).normalize();

            const localDir = horizontalDir.clone().applyQuaternion(
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -this.kirby.rotation.y, 0))
            );
            const stretchFactor = 1 + (accelMagnitude * this.deformation.stretchStrength);
            const squashFactor = 1 / Math.sqrt(stretchFactor);
            this.deformation.currentScale.set(
                squashFactor,
                Math.min(stretchFactor, 1 + this.deformation.maxDeform)*0.9,
                squashFactor
            );

        }


        this.kirby.scale.copy(this.deformation.currentScale);
    }
    deactivateGrapplingHook() {
        this.grapplingHook.isActive = false;
        this.grapplingHook.targetPoint = null;

        // Reset velocity and acceleration to prevent lingering movement
        // this.velocity.set(0, 0, 0); // TODO figure out if this is a good idea
        this.acceleration.set(0, 0, 0);

        // Remove the rope
        if (this.grapplingHook.rope) {
            this.scene.remove(this.grapplingHook.rope);
            this.grapplingHook.rope = null;
        }
        if(this.grapplingHook.crosshair){
            this.scene.remove(this.grapplingHook.crosshair);
            this.grapplingHook.crosshair = null;
        }
    }

    handleKey(event, isPressed) {
        switch (event.code) {
            case 'KeyW': this.keys.forward = isPressed; break;
            case 'KeyS': this.keys.backward = isPressed; break;
            case 'KeyA': this.keys.left = isPressed; break;
            case 'KeyD': this.keys.right = isPressed; break;
            case 'Space':
                if (isPressed && this.onGround) {
                    this.velocity.y = this.jumpForce; // Apply jump force
                    this.onGround = false;
                }
                break;
            case 'KeyP': // Toggle Debug Mode
                if (isPressed) {
                    this.toggleDebugMode();
                }
                break;
        }
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        this.flyControls.enabled = this.debugMode;

        if (this.debugMode) {
            console.log("Debug Mode ON: FlyControls enabled");
        } else {
            console.log("Debug Mode OFF: Returning to normal movement");
        }
    }

    updateCameraRotation(deltaX, deltaY) {
        // Update horizontal rotation (yaw)
        this.cameraRotationY -= deltaX * this.rotationSpeed;

        // Update vertical rotation (pitch)
        this.cameraRotationX -= deltaY * this.rotationSpeed;

        // Clamp vertical rotation to prevent flipping
        this.cameraRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotationX));

        // Create a quaternion for the yaw (horizontal rotation)
        const yawQuaternion = new THREE.Quaternion();
        yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotationY);

        // Create a quaternion for the pitch (vertical rotation)
        const pitchQuaternion = new THREE.Quaternion();
        pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.cameraRotationX);

        // Combine the yaw and pitch rotations
        const finalQuaternion = new THREE.Quaternion();
        finalQuaternion.multiplyQuaternions(yawQuaternion, pitchQuaternion);

        // Set the camera's quaternion
        this.camera.quaternion.copy(finalQuaternion);
    }

    handleMouseMove(event) {
        if (document.pointerLockElement === document.body) {
            const deltaX = event.movementX || 0;
            const deltaY = event.movementY || 0;

            this.updateCameraRotation(deltaX, deltaY);
        }
    }

    requestPointerLock() {
        document.body.requestPointerLock = document.body.requestPointerLock ||
            document.body.mozRequestPointerLock ||
            document.body.webkitRequestPointerLock;

        document.body.requestPointerLock();
    }

    // called once a frame
    update(delta) {
        this.animateLimbs(delta);
        let sims_per_frame = 10; // number of physics simulations ran / second
        for(let t = 0; t < 1; t += 1/sims_per_frame) this.run(1/sims_per_frame);

        if (this.debugMode) {
            this.flyControls.update(delta); // Update FlyControls if enabled
            return;
        }

        // Update camera position to stay behind and above Kirby
        const cameraOffset = new THREE.Vector3(0, this.cameraHeight, this.cameraDistance);
        cameraOffset.applyQuaternion(this.camera.quaternion); // Align offset with camera's rotation

        // Set the camera's position relative to Kirby
        this.camera.position.copy(this.kirby.position).add(cameraOffset);
    }

    // called once every dt seconds
    // for physics simulations
    run(dt) {
        const netForce = new THREE.Vector3();

        // collision force
        if(!this.isColliding) this.entryVelocity = this.velocity.clone();
        this.isColliding = 0;
        for(let i=0; i<this.collidables.length; i++){
            let collidable = this.collidables[i];
            const collisionReturn = collisions.doCollision(this.kirby, collidable, this.entryVelocity, this.velocity, this);
            const penaltyForce = collisionReturn.penaltyForce;
            if(collisionReturn.isColliding > this.isColliding) this.isColliding = collisionReturn.isColliding;
            if(this.isColliding) netForce.add(penaltyForce);
        }
        this.applySquashAndStretch(dt);

        const restingThreshold = 0.01;
        const allowWallJump = true;
        if (this.isColliding >= 1 && this.velocity.y < restingThreshold) {
            if(allowWallJump) this.onGround = true;
            if (collisions.isOnGround(this.kirby.position, this.collidables, 1)) {
                this.velocity.y = 0.01; // Stop the object
                this.onGround = true;
            }
        }


        // Calculate movement direction based on camera orientation
        const movementForce = new THREE.Vector3();

        if (this.keys.forward) movementForce.z -= 1;
        if (this.keys.backward) movementForce.z += 1;
        if (this.keys.left) movementForce.x -= 1;
        if (this.keys.right) movementForce.x += 1;

        // Normalize the movement direction to ensure consistent speed
        movementForce.normalize();

        // Rotate the movement direction to align with the camera's orientation
        movementForce.applyQuaternion(this.camera.quaternion);

        // Project the movement direction onto the XZ plane (ignore Y component)
        movementForce.y = 0;
        movementForce.normalize(); // Re-normalize after projection

        // Apply movement force
        netForce.add(movementForce.multiplyScalar(this.speed));

        // Apply gravity force
        netForce.y += this.gravity;

        // Apply spring force if grappling hook is active
        if (this.grapplingHook.isActive) {
            netForce.add(this.applySpringForce());

            // Update the rope's position
            if (this.grapplingHook.rope) {
                const ropeStart = this.kirby.position.clone();
                ropeStart.y += 2; // Adjust for Kirby's height
                const ropeEnd = this.grapplingHook.targetPoint.clone();

                // Update the rope's geometry
                this.grapplingHook.rope.geometry.setFromPoints([ropeStart, ropeEnd]);
                this.grapplingHook.rope.geometry.verticesNeedUpdate = true;
            }
        }

        this.acceleration = netForce.clone();

        // Update velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(dt));

        // Clamp horizontal velocity to maximum speed
        const horizontalVelocity = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        if (horizontalVelocity.length() > this.maxSpeed) {
            horizontalVelocity.setLength(this.maxSpeed);
            this.velocity.x = horizontalVelocity.x;
            this.velocity.z = horizontalVelocity.z;
        }


        // Update position
        this.kirby.position.add(this.velocity.clone().multiplyScalar(dt));

        // Rotate Kirby to face the movement direction
        if (movementForce.x !== 0 || movementForce.z !== 0) {
            const targetAngle = Math.atan2(movementForce.x, movementForce.z) - Math.PI / 2;
            this.kirby.rotation.y = targetAngle; // Rotate Kirby to face the movement direction
        }

        // // Simple ground collision
        // if (this.kirby.position.y <= 0) {
        //     this.kirby.position.y = 0;
        //     this.velocity.y = 0;
        //     this.onGround = true;
        // }

        // Apply drag (deceleration) to horizontal movement only
        this.velocity.x *= Math.pow(0.9, dt);
        this.velocity.z *= Math.pow(0.9, dt);
    }
}