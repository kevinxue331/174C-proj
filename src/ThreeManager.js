import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import Spider from "./spider.js";
import Player from './Player.js';
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

        this.cube = null;
        this.player = null;

        this.init();
    }

    // initialize objects, scene, camera, lights
    init() {
        // Create a cube
        const geometry = new THREE.BoxGeometry(5,5,5);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);

        // create a ball
        const icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4);
        const lambertMaterial = new THREE.MeshStandardMaterial({
            color: 0xff00ee,
            wireframe: true
        });
        this.ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);

        // create planes
        const planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x6904ce,
            side: THREE.DoubleSide,
            wireframe: false
        });

        //direction light
        this.directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(-4, 30, -5);
        this.directionalLight.shadow.mapSize.width = 512; // default
        this.directionalLight.shadow.mapSize.height = 512; // default
        this.directionalLight.shadow.camera.near = 0.1; // default
        this.directionalLight.shadow.camera.far = 10000; // default
        this.scene.add( this.directionalLight );

        // light
        const ambientLight = new THREE.AmbientLight(0xaaaaaa,0.3);
        this.scene.add(ambientLight);
        ambientLight.castShadow = false;


        let textureLoader = new THREE.TextureLoader()
        //building tex
        const tex1 = textureLoader.load('/static/tex/building_glass_tex.jpg');
        const tex2 = textureLoader.load('/static/tex/building_tex_2.png');
        const tex3 = textureLoader.load('/static/tex/building_tex_1.jpg');

        //kirby tex
        const kirby_tex = textureLoader.load('/static/tex/kirby.jpg');
        //street tex
        const street_tex = textureLoader.load('/static/tex/street_tex.jpg');

        //building mat
        const textureMaterial1 = new THREE.MeshStandardMaterial({ map: tex1 });
        const textureMaterial2 = new THREE.MeshStandardMaterial({ map: tex2 });
        const textureMaterial3 = new THREE.MeshStandardMaterial({ map: tex3 });

        //kirby mat
        const kirby_mat = new THREE.MeshStandardMaterial({ map: kirby_tex });

        //street mat
        const street_tex_mat = new THREE.MeshStandardMaterial({ map: street_tex });

        const geo = new THREE.BoxGeometry(1, 1, 1);
        this.cube = new THREE.Mesh(geo, textureMaterial2)
        this.scene.add(this.cube)

        //dummy ground plane
        this.plane = new THREE.Mesh(planeGeometry, textureMaterial3);
        this.plane.rotation.x = -0.5 * Math.PI;
        this.plane.position.set(0, 0, 0);
        this.plane.castShadow = false;
        this.plane.receiveShadow = true;

        //draw city
        this.city = new City(this.scene);
        this.city.loadModels();

        // add objects to scene
        //this.scene.add(this.plane);
        this.scene.add(this.plane);
        // this.scene.add(this.ball);


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


        // OBJ
        // OBJS
        let objLoader = new OBJLoader();
        this.geoList = [];
        this.buildingList = [];
        this.streetList = [];
        var objMat = new THREE.MeshToonMaterial({ wireframe: true, side: THREE.DoubleSide, flatShading: true, color: 0x00fcec});
        this.player = new Player(this.scene, this.camera, { x: 0, y: 3, z: 0 });
        
        objLoader.load(
            'static/obj/aslkdjf.obj',
            (object) => {
                // const geometry = object.children[0].geometry;
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.scale(5.75,5.75,5.75);
                this.geoList.push(geometry.clone());
            }
        );
        objLoader.load(
            '/static/obj/kirby_torso.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
                const mesh = new THREE.Mesh(geo, kirby_mat);
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
                this.player.addBodyPart(mesh);
            }
        );
        objLoader.load(
            '/static/obj/kirby_L_arm.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
                const mesh = new THREE.Mesh(geo, kirby_mat);
                this.player.addBodyPart(mesh);
            }
        );
        objLoader.load(
            '/static/obj/kirby_R_arm.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
                const mesh = new THREE.Mesh(geo, kirby_mat);
                this.player.addBodyPart(mesh);
            }
        );
        objLoader.load(
            '/static/obj/kirby_L_foot.obj',
            (object) => {
                const geo = BufferGeometryUtils.mergeGeometries(object.children.map(child => child.geometry));
                geo.translate(0, 3, 0);
                geo.scale(0.4, 0.4, 0.4);
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
                const mesh = new THREE.Mesh(geo, kirby_mat);
                this.player.addBodyPart(mesh);
            }
        );


        //this.street1
        //this.scene.add(a_street)

        // SPIDER
        this.spider = new Spider();

        this.spider.addToScene(this.scene);

        // Handling resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    pcnt = 0;
    pauseCounter = 0;
    paused = false;
    // runs every frame
    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Rotate the cube
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;

        if(this.shovel != null) {
            this.shovel.rotation.y += 0.01;
            if(!this.paused) {
                this.pcnt += 0.01;
                let progress = Math.sin(this.pcnt)/2+0.5;
                this.morphMesh(progress);
                if(Math.round(progress*1000)/1000 == 0 || Math.round(progress*1000)/1000 == 1) {
                    this.paused = true;
                    //this.shovel.geometry.computeVertexNormals();
                }
            }
            else {
                this.pauseCounter++
                if(this.pauseCounter >= 75 && this.pauseCounter < 100) {
                    this.pcnt += 0.01;
                    let progress = Math.sin(this.pcnt)/2+0.5;
                    this.morphMesh(progress);
                }
                else if (this.pauseCounter >= 100) {
                    this.paused = false;
                    this.pauseCounter = 0;
                }
            }
        }

        // Rotate the ball
        this.ball.rotation.x += 0.01;
        this.ball.rotation.y += 0.01;

        // tick the spider
        this.spider.tick();


        //this.makeRoughGround(this.plane2, 1);

        this.controls.update(0.02);
        if (this.player) this.player.update();


        this.renderer.render(this.scene, this.camera);
    }
    

    start() {
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // TextManager functions
    // 歌詞の更新
    setLyrics (lyrics)
    {
        this.currentLyrics = lyrics;
    }

    // 再生位置アップデート
    lyricsUpdate (position)
    {
        if (!this.currentLyrics) return;

        // 外枠を残してキャンバスをクリア
        this._ctx.clearRect(8, 8, this._can.width, this._can.height)
        var bufferedTxt = "";

        for (let i = 0, l = this.currentLyrics.length; i < l; i ++)
        {
            let lyric = this.currentLyrics[i];
            // 開始タイム < 再生位置 && 再生位置 < 終了タイム
            if (lyric.startTime <= position && position < lyric.endTime)
            {
                // 歌詞の描画
                var progress = this._easeOutBack(Math.min((position - lyric.startTime) / Math.min(lyric.endTime - lyric.startTime, 200), 1));
                bufferedTxt = lyric.text + progress;
                if (this.currentTxt != bufferedTxt) this._drawText(lyric.text, progress);
                break;
            }
        }
        // テクスチャの更新
        if (this.currentTxt != bufferedTxt) {
            this._tex.needsUpdate = true;
        }
        this.currentTxt = bufferedTxt;
    }

    morphMesh(percent) {
        const object = this.shovel;
        const start = this.geoList[0];
        const end = this.geoList[1]

        const positionAttribute = object.geometry.getAttribute('position');
        const startPosAttribute = start.getAttribute('position');
        const endPosAttribute = end.getAttribute('position');

        const objVertex = new THREE.Vector3();
        const startVertex = new THREE.Vector3();
        const endVertex = new THREE.Vector3();

        const maxVertices = Math.max(startPosAttribute.count, endPosAttribute.count);
        const minVertices = Math.min(startPosAttribute.count, endPosAttribute.count);

        const objCenter = new THREE.Vector3(0,0,0);
        if(maxVertices == startPosAttribute.count) {

        }
        else {

        }
        let i= 0;
        while(i < startPosAttribute.count) {
            for(let j= 0; j < endPosAttribute.count; j ++ ) {
                objVertex.fromBufferAttribute( positionAttribute, i);
                startVertex.fromBufferAttribute( startPosAttribute, i);
                endVertex.fromBufferAttribute( endPosAttribute, j);
                const moveToVertex = new THREE.Vector3().lerpVectors(startVertex, endVertex, percent);
                positionAttribute.setXYZ(i, moveToVertex.x, moveToVertex.y, moveToVertex.z);
                positionAttribute.needsUpdate = true;
                i++;
                if(i >= startPosAttribute.count) break;
            }
        }

        // for ( let i = 0; i < maxVertices; i ++ ) {
        //     objVertex.fromBufferAttribute( positionAttribute, i);
        //     startVertex.fromBufferAttribute( startPosAttribute, i);
        //     endVertex.fromBufferAttribute( endPosAttribute, i);
        //     if(i < endPosAttribute.count) {
        //         endVertex.fromBufferAttribute( endPosAttribute, i);
        //     }
        //     else {
        //         endVertex.fromBufferAttribute( endPosAttribute, endPosAttribute.count-1);
        //     }
        //     const moveToVertex = new THREE.Vector3().lerpVectors(startVertex, endVertex, percent);
        //     positionAttribute.setXYZ(i, moveToVertex.x, moveToVertex.y, moveToVertex.z);
        //     positionAttribute.needsUpdate = true;
        //
        // }
    }

    // Helper functions
    makeRoughGround(mesh, distortionFr) {
        const positionAttribute = mesh.geometry.getAttribute( 'position' );
        const vertex = new THREE.Vector3();

        for ( let vertexIndex = 0; vertexIndex < positionAttribute.count; vertexIndex ++ ) {
            vertex.fromBufferAttribute( positionAttribute, vertexIndex);
            // do something with vertex
            let amp = 20;
            let time = Date.now();
            let distance = (noise.noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
            // if(vertexIndex === 0) console.log(distance);
            vertex.z = distance;
            positionAttribute.setXYZ(vertexIndex, vertex.x, vertex.y, vertex.z);
            positionAttribute.needsUpdate = true;
        }


        // mesh.geometry.getAttribute( 'position' ).forEach(function (vertex, i) {
        //     let amp = 2;
        //     let time = Date.now();
        //     let distance = (noise.noise(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
        //     vertex.z = distance;
        // });

        // deprecated?
        // mesh.geometry.verticesNeedUpdate = true;
        // mesh.geometry.normalsNeedUpdate = true;
        // mesh.geometry.computeVertexNormals();
    }

    // 文字の描画
    _drawText (text, progress)
    {
        console.log("drawing text:" + text)
        var size = this._can.width;
        var fontSize = size * 0.5 * progress;
        this._ctx.textAlign = "center";
        this._ctx.fillStyle = "#000000";
        this._ctx.font = "bold " + fontSize + "px sans-serif";

        this._ctx.fillText(text, size/2, size/2 + fontSize * 0.37);
    }

    _easeOutBack (x) { return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); }

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