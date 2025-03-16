import * as THREE from 'three';
import { FlyControls } from 'three/addons/controls/FlyControls.js';

export default class Player {
    constructor(scene, camera, position = { x: 0, y: 3, z: 0 }, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.speed = 0.1;
        this.maxSpeed = 0.5;
        this.jumpForce = 0.8;
        this.gravity = -0.02;
        this.onGround = false;

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

        this.initListeners();
    }

    addBodyPart(mesh) {
        this.kirby.add(mesh);
    }

    initListeners() {
        window.addEventListener('keydown', (event) => this.handleKey(event, true));
        window.addEventListener('keyup', (event) => this.handleKey(event, false));
        document.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        window.addEventListener('click', () => {
            this.requestPointerLock(); // Lock pointer
            this.shootRope(); // Shoot rope
        });
    }

    createRope(start, end) {
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
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
        }
    }

    applySpringForce() {
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
        this.acceleration.add(springForce);
    
        // Apply gravity to create the pendulum effect
        this.acceleration.y += this.gravity;
    
        // Add a sideways force to simulate swinging
        const swingForce = new THREE.Vector3()
            .crossVectors(ropeVector, new THREE.Vector3(0, 1, 0)) // Cross product with up vector
            .normalize()
            .multiplyScalar(this.velocity.length() * 0.5); // Increased swing force scaling



        const maxSwingForce = 2; // Maximum swing force magnitude
        if (swingForce.length() > maxSwingForce) {
            swingForce.setLength(maxSwingForce);
        }

        
    
        this.acceleration.add(swingForce);
    
        // Check if Kirby is close enough to the target point to deactivate the grappling hook
        const distanceToTarget = this.kirby.position.distanceTo(this.grapplingHook.targetPoint);
        if (distanceToTarget < 1) {
            console.log("Disabling grappling hook");
            this.deactivateGrapplingHook();
        }
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

    update(delta) {
        if (this.debugMode) {
            this.flyControls.update(delta); // Update FlyControls if enabled
            return;
        }
    
        // Reset acceleration
        this.acceleration.set(0, 0, 0);
    
        // Calculate movement direction based on camera orientation
        const movementDirection = new THREE.Vector3();
    
        if (this.keys.forward) movementDirection.z -= 1;
        if (this.keys.backward) movementDirection.z += 1;
        if (this.keys.left) movementDirection.x -= 1;
        if (this.keys.right) movementDirection.x += 1;
    
        // Normalize the movement direction to ensure consistent speed
        movementDirection.normalize();
    
        // Rotate the movement direction to align with the camera's orientation
        movementDirection.applyQuaternion(this.camera.quaternion);
    
        // Project the movement direction onto the XZ plane (ignore Y component)
        movementDirection.y = 0;
        movementDirection.normalize(); // Re-normalize after projection
    
        // Apply movement force
        this.acceleration.add(movementDirection.multiplyScalar(this.speed));
    
        // Apply gravity
        this.acceleration.y += this.gravity;
    
        // Apply spring force if grappling hook is active
        if (this.grapplingHook.isActive) {
            this.applySpringForce();
    
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
    
        // Update velocity based on acceleration
        this.velocity.add(this.acceleration);
    
        // Clamp horizontal velocity to maximum speed
        const horizontalVelocity = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        if (horizontalVelocity.length() > this.maxSpeed) {
            horizontalVelocity.setLength(this.maxSpeed);
            this.velocity.x = horizontalVelocity.x;
            this.velocity.z = horizontalVelocity.z;
        }
    
        // Move Kirby
        this.kirby.position.add(this.velocity);
    
        // Rotate Kirby to face the movement direction
        if (movementDirection.x !== 0 || movementDirection.z !== 0) {
            const targetAngle = Math.atan2(movementDirection.x, movementDirection.z) - Math.PI / 2;
            this.kirby.rotation.y = targetAngle; // Rotate Kirby to face the movement direction
        }
    
        // Simple ground collision
        if (this.kirby.position.y <= 0) {
            this.kirby.position.y = 0;
            this.velocity.y = 0;
            this.onGround = true;
        }
    
        // Apply drag (deceleration) to horizontal movement only
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
    
        // Update camera position to stay behind and above Kirby
        const cameraOffset = new THREE.Vector3(0, this.cameraHeight, this.cameraDistance);
        cameraOffset.applyQuaternion(this.camera.quaternion); // Align offset with camera's rotation
    
        // Set the camera's position relative to Kirby
        this.camera.position.copy(this.kirby.position).add(cameraOffset);
    }
}