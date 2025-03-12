import * as THREE from 'three';

export default class Player {
    constructor(scene, camera, position = { x: 0, y: 3, z: 0 }) {
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

        this.initListeners();
    }

    addBodyPart(mesh) {
        this.kirby.add(mesh);
    }

    initListeners() {
        window.addEventListener('keydown', (event) => this.handleKey(event, true));
        window.addEventListener('keyup', (event) => this.handleKey(event, false));
        document.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        document.addEventListener('click', () => this.requestPointerLock());
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
    
        console.log(`Camera Quaternion: X=${this.camera.quaternion.x}, Y=${this.camera.quaternion.y}, Z=${this.camera.quaternion.z}, W=${this.camera.quaternion.w}`); // Debugging
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
        // Request pointer lock on the document body
        document.body.requestPointerLock = document.body.requestPointerLock || 
                                            document.body.mozRequestPointerLock ||
                                            document.body.webkitRequestPointerLock;
        
        document.body.requestPointerLock();
    }
    update() {
        // Calculate the camera's offset from Kirby based on its rotation
        const offset = new THREE.Vector3(0, 0, this.cameraDistance);
        offset.applyQuaternion(this.camera.quaternion);
    
        // Set the camera's position relative to Kirby
        this.camera.position.copy(this.kirby.position).add(offset);
        this.camera.position.y += this.cameraHeight; // Adjust for camera height
    
        console.log(`Camera Position: X=${this.camera.position.x}, Y=${this.camera.position.y}, Z=${this.camera.position.z}`); // Debugging
    
        // Handle movement and velocity
        if (this.keys.forward) this.velocity.z -= this.speed;
        if (this.keys.backward) this.velocity.z += this.speed;
        if (this.keys.left) this.velocity.x -= this.speed;
        if (this.keys.right) this.velocity.x += this.speed;
    
        // Apply gravity
        this.velocity.y += this.gravity;
    
        // Move Kirby
        this.kirby.position.add(this.velocity);
    
        // Simple ground collision
        if (this.kirby.position.y <= 3) {
            this.kirby.position.y = 3;
            this.velocity.y = 0;
            this.onGround = true;
        }
    
        // Apply damping
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
    }
}