import * as THREE from 'three';
import * as math from 'https://cdn.jsdelivr.net/npm/mathjs@10.6.4/+esm';
import * as matrixhelper from "./matrixhelper.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CCDIKSolver } from 'three/addons/animation/CCDIKSolver.js';

export default class Spider {
    constructor() {
        this.initialized = false;
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    addToScene(scene) {
        const loader = new GLTFLoader();

        loader.load(
            '/static/gltf/spider.gltf',
            (gltf) => {
                scene.add(gltf.scene);

                // traverse the scene to find the skeleton
                let skinnedMesh;
                gltf.scene.traverse((object) => {
                    if (object.isBone) {
                        console.log("Bone found:", object.name);
                    }
                    if (object.isSkinnedMesh) {
                        skinnedMesh = object;
                        console.log("SkinnedMesh found:", skinnedMesh);
                        console.log("Skeleton:", skinnedMesh.skeleton);
                    }
                });

                // find leg bones
                const femur = gltf.scene.getObjectByName("Leg1_L_1_33");
                const patella = gltf.scene.getObjectByName("Leg1_L_2_32");
                const tibia = gltf.scene.getObjectByName("Leg1_L_3_31");
                const metatarsus = gltf.scene.getObjectByName("Leg1_L_4_30");
                const tarsus = gltf.scene.getObjectByName("Leg1_L_5_29");

                // Create a new bone to act as the target
                const targetBone = new THREE.Bone();
                targetBone.name = "IKTargetBone";
                targetBone.position.set(0, 10, 0);
                skinnedMesh.skeleton.bones.push(targetBone);
                skinnedMesh.skeleton.bones[0].add(targetBone) // parent it to the scene bone
                const inverseMatrix = new THREE.Matrix4().copy(targetBone.matrixWorld).invert();
                skinnedMesh.skeleton.boneInverses.push(inverseMatrix);

                // Find the index of the new target bone
                // const targetBoneIndex = skinnedMesh.skeleton.bones.indexOf(targetBone);

                // create an IK chain
                const ikChain = {
                    target: skinnedMesh.skeleton.bones.indexOf(targetBone), // End effector (e.g., foot)
                    effector: skinnedMesh.skeleton.bones.indexOf(tarsus), // Index of the effector bone
                    links: [
                        { index: skinnedMesh.skeleton.bones.indexOf(metatarsus) },
                        { index: skinnedMesh.skeleton.bones.indexOf(tibia) },
                        { index: skinnedMesh.skeleton.bones.indexOf(patella) },
                        { index: skinnedMesh.skeleton.bones.indexOf(femur) }
                    ]
                };

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

                this.ikSolver = new CCDIKSolver(skinnedMesh, [ikChain]);

                this.target = targetBone

                scene.add(this.ikSolver.createHelper());
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

    onKeyDown(event) {
        if (event.code === 'KeyJ') {
            this.target.position.add(new THREE.Vector3(-0.1,0,0));
        }
        if (event.code === 'KeyL') {
            this.target.position.add(new THREE.Vector3(0.1,0,0));
        }
        if (event.code === 'KeyI') {
            this.target.position.add(new THREE.Vector3(0,0.1,0));
            console.log(this.target.position);
        }
        if (event.code === 'KeyK') {
            this.target.position.add(new THREE.Vector3(0,-0.1,0));
        }
        if (event.code === 'KeyT') {
            console.log("reset goal");
            const goal = new THREE.Vector3(0, 0, 0); // Example goal position
            this.target.position.copy(goal);
        }
        if (event.code === 'KeyY') {
            console.log("update");
            this.ikSolver.update();
        }
    }

    tick() {
        if(!this.initialized || this.ikSolver == null) return;
        // this.ikSolver.update();
    }

}