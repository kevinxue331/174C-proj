import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import Spider from "./spider.js";

const noise = new SimplexNoise();

export default class ThreeManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.cube = null;

        this.init();
    }

    // initialize objects, scene, camera, lights
    init() {
        // Create a cube
        const geometry = new THREE.BoxGeometry(5,5,5);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);

        // create a ball
        const icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4);
        const lambertMaterial = new THREE.MeshLambertMaterial({
            color: 0xff00ee,
            wireframe: true
        });
        this.ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);

        // create planes
        const planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
        const planeMaterial = new THREE.MeshLambertMaterial({
            color: 0x6904ce,
            side: THREE.DoubleSide,
            wireframe: true
        });

        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.rotation.x = -0.5 * Math.PI;
        this.plane.position.set(0, 45, 0);

        this.plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane2.rotation.x = -0.5 * Math.PI;
        this.plane2.position.set(0, -45, 0);

        // add objects to scene
        //this.scene.add(this.plane);
        //this.scene.add(this.plane2);
        // this.scene.add(this.ball);

        // light
        const ambientLight = new THREE.AmbientLight(0xaaaaaa,1);
        this.scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff);
        spotLight.intensity = 10000;
        spotLight.position.set(-50, 0, 20);
        spotLight.lookAt(this.ball);
        spotLight.castShadow = true;
        this.scene.add(spotLight);


        // Camera position
        this.camera.position.z = 30;

        // OBJ
        // OBJS
        let objLoader = new OBJLoader();
        this.geoList = [];
        var objMat = new THREE.MeshToonMaterial({ wireframe: true, side: THREE.DoubleSide, flatShading: true, color: 0x00fcec});

        objLoader.load(
            'static/obj/miku_lp.obj',
            (object) => {
                // const geometry = object.children[0].geometry;
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.scale(0.075,0.075,0.075)
                const mesh = new THREE.Mesh(geometry, objMat);
                this.shovel = mesh;
                this.geoList.push(geometry.clone());
                this.shovel.position.set(0, -5, 15);
                //this.scene.add(this.shovel);
            }
        );
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
            '/static/obj/building_elliptical.obj',
            (object) => {
                this.scene.add(object);
            }
        );

        spotLight.lookAt(this.ball);

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


        this.makeRoughGround(this.plane2, 1);

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


}