import * as THREE from 'three';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';

export default class Player {
    constructor(scene, camera, position = { x: 0, y: 3, z: 0 }, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.speed = 0.1;
        this.gravity = -0.02;
        this.jumpStrength = 0.5;
        this.onGround = false;

        // Create Kirby's mesh
        this.kirby = new THREE.Group();
        this.kirby.position.set(position.x, position.y, position.z);
        this.scene.add(this.kirby);

        this.camera.lookAt(this.kirby.position); // initially look at kirby

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
    
        setTimeout(() => this.scene.remove(rope), 3000); // Remove rope after 3s
    }
    shootRope() {
        const maxLength = 50; // Maximum rope length
        const ropeStartY = 2;
        const direction = new THREE.Vector3();
        let ropeStart = this.kirby.position.clone();
        ropeStart.y = ropeStart.y + ropeStartY; // move rope up a bit so it looks like its coming from kirby

        this.camera.getWorldDirection(direction); // Get camera's forward direction
    
        const raycaster = new THREE.Raycaster(ropeStart, direction.normalize(), 0, maxLength);
        const intersects = raycaster.intersectObjects(this.scene.children, true); // Check for collisions
    
        let ropeEnd;
        if (intersects.length > 0) {
            ropeEnd = intersects[0].point; // Stop at first collision
        } else {
            ropeEnd = this.kirby.position.clone().addScaledVector(direction, maxLength); // Max length reached
        }
    
        this.createRope(ropeStart, ropeEnd);
    }
        

    handleKey(event, isPressed) {
        switch (event.code) {
            case 'KeyW': this.keys.forward = isPressed; break;
            case 'KeyS': this.keys.backward = isPressed; break;
            case 'KeyA': this.keys.left = isPressed; break;
            case 'KeyD': this.keys.right = isPressed; break;
            case 'Space': 
                if (isPressed && this.onGround) {
                    this.velocity.y = this.jumpStrength;
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
            // Use movementX/Y which gives delta from last position regardless of screen boundaries
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

        // Calculate the camera's offset from Kirby based on its rotation
        const offset = new THREE.Vector3(0, 0, this.cameraDistance);
        offset.applyQuaternion(this.camera.quaternion);

        // Set the camera's position relative to Kirby
        this.camera.position.copy(this.kirby.position).add(offset);
        this.camera.position.y += this.cameraHeight; // Adjust for camera height


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

        // Update velocity based on movement direction
        this.velocity.x = movementDirection.x * this.speed;
        this.velocity.z = movementDirection.z * this.speed;

        // Apply gravity
        this.velocity.y += this.gravity;

        // Move Kirby
        this.kirby.position.add(this.velocity);

        // Rotate Kirby to face the movement direction
        if (movementDirection.x !== 0 || movementDirection.z !== 0) {
            const targetAngle = Math.atan2(movementDirection.x, movementDirection.z)-Math.PI / 2;
            this.kirby.rotation.y = targetAngle; // Rotate Kirby to face the movement direction
        }

        // Simple ground collision
        if (this.kirby.position.y <= 0) {
            this.kirby.position.y = 0;
            this.velocity.y = 0;
            this.onGround = true;
        }

        // Apply damping
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
    }
    
}