import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import Spider from "./spider.js";
import Player from './Player.js';
import GameManager from './gamemanager.js';
import City from './city.js';

const noise = new SimplexNoise();

export default class ThreeManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
        document.body.appendChild(this.renderer.domElement);
        this.initPointerLock();
        this.setupKeyListeners();
        this.initCrosshair();
        
        this.gamemanager = null;

        this.tick = 0;

        this.cube = null;
        this.player = null;

        this.init();
        console.log("manager constructor")
    }

    updateScore(amt) {
        this.score += amt;
        this.scoreboard.textContent = `Score: ${this.score}`;
    }

    // initialize objects, scene, camera, lights
    init() {
        // Create a cubea
        /*
        const geometry = new THREE.BoxGeometry(5,5,5);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);

         */

        // create a ball
        /*
        const icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4);
        const lambertMaterial = new THREE.MeshStandardMaterial({
            color: 0xff00ee,
            wireframe: true
        });

         */


        //direction light
        this.directionalLight = new THREE.DirectionalLight( 0xfcf4e6, 4);
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(-4, 30, -5);
        this.directionalLight.shadow.mapSize.width = 22512;
        this.directionalLight.shadow.mapSize.height = 22512;
        this.directionalLight.shadow.camera.near = 0.1; // default
        this.directionalLight.shadow.camera.far = 10000; // default

        this.directionalLight.shadow.camera.top = 500;
        this.directionalLight.shadow.camera.bottom = -500;
        this.directionalLight.shadow.camera.left = 500;
        this.directionalLight.shadow.camera.right = -500;
        this.scene.add( this.directionalLight );

        // light
        const ambientLight = new THREE.AmbientLight(0xcce0ff,0.5);
        this.scene.add(ambientLight);
        ambientLight.castShadow = false;


        let textureLoader = new THREE.TextureLoader()

        //skybox
        const cubetexture_loader = new THREE.CubeTextureLoader();
        const skybox_texture = cubetexture_loader.load([
            'static/tex/skybox/pos-x.bmp',
            'static/tex/skybox/neg-x.bmp',
            'static/tex/skybox/pos-y.bmp',
            'static/tex/skybox/neg-y.bmp',
            'static/tex/skybox/pos-z.bmp',
            'static/tex/skybox/neg-z.bmp',
        ]);
        this.scene.background = skybox_texture;

        //kirby tex
        const kirby_tex = textureLoader.load('/static/tex/kirby.jpg');

        //kirby mat
        const kirby_mat = new THREE.MeshStandardMaterial({ map: kirby_tex });

        /*
        const geo = new THREE.BoxGeometry(1, 1, 1);
        this.cube = new THREE.Mesh(geo, building2_mat)
        this.scene.add(this.cube)
         */

        //draw city
        this.city = new City(this.scene);

        // Camera position
        this.camera.position.z = 30;
        this.camera.position.y = 10;

        /*
        forward back left right (translate): WASD
        up down: R, F
        pitch, yaw (look up/down, look left/right): direction arrows
         */
        this.controls = new FlyControls( this.camera, this.renderer.domElement );
        this.controls.movementSpeed = 100;
        this.controls.rollSpeed = Math.PI / 16;
        this.controls.autoForward = false;
        this.controls.dragToLook = true;


        // OBJS
        let objLoader = new OBJLoader();
        this.geoList = [];
        //var objMat = new THREE.MeshToonMaterial({ wireframe: true, side: THREE.DoubleSide, flatShading: true, color: 0x00fcec});
        this.player = new Player(this.scene, this.camera, { x: 0, y: 3, z: 0 }, this.renderer.domElement, this.city.all);

        this.gamemanager = new GameManager(() => this.resetGame());

        objLoader.load(
            '/static/obj/kirby_torso.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
                const mesh = new THREE.Mesh(geo, kirby_mat);
                mesh.castShadow = true;
                mesh.receiveShadowShadow = true;
                this.player.addBodyPart(mesh);
            }
        );
        objLoader.load(
            '/static/obj/kirby_torso.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
                const mesh = new THREE.Mesh(geo, kirby_mat);
                mesh.castShadow = true;
                mesh.receiveShadowShadow = true;
                this.player.addBodyPart(mesh);
            }
        );
     // Update each of your objLoader.load calls like this:

        objLoader.load(
            '/static/obj/kirby_L_arm.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
                // Add a name to the geometry
                geo.name = 'kirby_L_arm';
                
                const mesh = new THREE.Mesh(geo, kirby_mat);
                mesh.castShadow = true;
                mesh.receiveShadowShadow = true;
                // Add information to userData
                
                
                this.player.addBodyPart(mesh);
            }
        );
        objLoader.load(
            '/static/obj/kirby_R_arm.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
                geo.name= 'kirby_R_arm';
                const mesh = new THREE.Mesh(geo, kirby_mat);
                mesh.castShadow = true;
                mesh.receiveShadowShadow = true;
                
                this.player.addBodyPart(mesh);
                this.player.addRArm(mesh);
            }
        );
        objLoader.load(
            '/static/obj/kirby_L_foot.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
                geo.name= 'kirby_L_foot';
                const mesh = new THREE.Mesh(geo, kirby_mat);
                this.player.addBodyPart(mesh);
            }
        );
        objLoader.load(
            '/static/obj/kirby_R_foot.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
                geo.name= 'kirby_R_foot';
                const mesh = new THREE.Mesh(geo, kirby_mat);
                this.player.addBodyPart(mesh);
                console.log("kirby loaded");
            }
        );

        // SPIDER
        this.spider = new Spider(this.player, this.city.all, true, 2);
        this.spider.addToScene(this.scene, new THREE.Vector3(0,0,0));

        this.bigSpider = new Spider(this.player, this.city.all, false, 10, 0.5);
        this.bigSpider.addToScene(this.scene,  new THREE.Vector3(100,0,0));

        // Handling resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        console.log("end of init");
    }

    // runs every frame
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.tick++;
        if(this.tick%10 ==0){
            this.gamemanager.updateScore(100);
        }

        // tick the spider
        this.spider.tick();
        this.bigSpider.tick();

        if(this.spider.spiderRoot !== undefined && this.bigSpider.spiderRoot !== undefined) {
            if(this.player.kirby.position.distanceToSquared(this.spider.spiderRoot.position.clone().add(new THREE.Vector3(0,this.spider.sizeScale*2,0))) <= 15*Math.pow(this.spider.sizeScale, 2)) this.gamemanager.gameOver();
            else if(this.player.kirby.position.distanceToSquared(this.bigSpider.spiderRoot.position.clone().add(new THREE.Vector3(0,this.spider.sizeScale*2,0))) <= 15*Math.pow(this.spider.sizeScale, 2)) this.gamemanager.gameOver();
        }

        if(!this.gamemanager.isGameOver) {
            this.controls.update(0.02);
            if (this.player) this.player.update(0.02);
        }

        this.renderer.render(this.scene, this.camera);
    }
    
    resetGame(){
        if (!this.player) return;
        this.tick = 0;
        this.player.reset();
        this.bigSpider.spiderRoot.position.set(100, 0, 0);
        this.spider.spiderRoot.position.set(0, 0, 0);
    }

    start() {
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    initPointerLock() {
        const canvas = this.renderer.domElement;

        // Add a click event listener to the canvas
        const clickToStart = document.getElementById('click-to-start');
        clickToStart.addEventListener('click', async () => {
            try {
                // Hide the click-to-start overlay

                // Request pointer lock
                await canvas.requestPointerLock();
            } catch (err) {
                console.error('Failed to enable pointer lock:', err);
            }
        });

        // Listen for pointer lock change events
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === canvas) {
                // Pointer is locked, start tracking mouse movement
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
            } else {
                // Pointer is unlocked, stop tracking mouse movement
                document.removeEventListener('mousemove', this.onMouseMove.bind(this));
            }
        });
    }
    onMouseMove(event) {
        if (!this.player) return;

        const deltaX = event.movementX || event.mozMovementX || 0;
        const deltaY = event.movementY || event.mozMovementY || 0;

        

        // Update the player's camera rotation based on mouse movement
        this.player.updateCameraRotation(deltaX, deltaY);
    }
    setupKeyListeners() {
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.enableFullscreenAndHideCursor();
            }
            if (event.key === 'Escape') {
                this.exitFullscreen();
            }
        });
    }

    enableFullscreenAndHideCursor() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }

        // Lock the pointer (hide cursor)
        document.body.requestPointerLock = document.body.requestPointerLock || document.body.mozRequestPointerLock;
        if (document.body.requestPointerLock) {
            document.body.requestPointerLock();
        }
    }
    exitFullscreen() {
        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            // Exit fullscreen
            document.exitFullscreen && document.exitFullscreen();
            document.mozCancelFullScreen && document.mozCancelFullScreen();
            document.webkitExitFullscreen && document.webkitExitFullscreen();
            document.msExitFullscreen && document.msExitFullscreen();

            // Release the pointer lock
            if (document.exitPointerLock) {
                document.exitPointerLock();
            }
        }
    }
    initCrosshair() {
        const crosshair = document.createElement("div");
        crosshair.id = "crosshair";
        document.body.appendChild(crosshair);
    }
    


}