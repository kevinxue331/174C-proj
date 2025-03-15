import * as THREE from 'three';
import * as math from 'https://cdn.jsdelivr.net/npm/mathjs@10.6.4/+esm';
import * as matrixhelper from "./matrixhelper.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CCDIKSolver } from 'three/addons/animation/CCDIKSolver.js';

export default class Spider {
    constructor() {
        this.initialized = false;
        this.root_bone_inverse_matrix = null;
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

                let ik_chains = [];
                this.left_targets = [];
                this.right_targets = [];
                function create_front_leg_ik_chain(femur_name, patella_name, tibia_name, meta_name, tarsus_name, target_array) {
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

                    console.log("initial rot:")
                    console.log(patella.rotation);

                    const initial_femur = new THREE.Vector3(femur.rotation.x, femur.rotation.y, femur.rotation.z);
                    const femur_affordance = new THREE.Vector3(Math.PI/8,Math.PI/8,0);

                    const initial_patella = new THREE.Vector3(patella.rotation.x, patella.rotation.y, patella.rotation.z);
                    const patella_affordance = new THREE.Vector3(Math.PI/6, Math.PI/12, 0);

                    const initial_tibia = new THREE.Vector3(tibia.rotation.x, tibia.rotation.y, tibia.rotation.z);
                    const tibia_affordance = new THREE.Vector3(Math.PI/8,Math.PI/8,0);

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
                function create_leg_ik_chain(femur_name, tibia_name, meta_name, tarsus_name, target_array) {
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

                    const initial_femur = new THREE.Vector3(femur.rotation.x, femur.rotation.y, femur.rotation.z);
                    const femur_affordance = new THREE.Vector3(Math.PI/8,Math.PI/8,0);

                    const initial_tibia = new THREE.Vector3(tibia.rotation.x, tibia.rotation.y, tibia.rotation.z);
                    const tibia_affordance = new THREE.Vector3(Math.PI/8,Math.PI/8,0);

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
                    "Leg1_L_3_31", "Leg1_L_4_30", "Leg1_L_5_29", this.left_targets);
                create_leg_ik_chain("Leg2_L_1_37", "Leg2_L_2_36",
                    "Leg2_L_3_35", "Leg2_L_4_34", this.left_targets);
                create_leg_ik_chain("Leg3_L_1_41", "Leg3_L_2_40",
                    "Leg3_L_3_39", "Leg3_L_4_38", this.left_targets);
                create_leg_ik_chain("Leg4_L_1_45", "Leg4_L_2_44",
                    "Leg4_L_3_43", "Leg4_L_4_42", this.left_targets);
                create_front_leg_ik_chain("Leg1_R_1_12", "Leg1_R_2_11",
                    "Leg1_R_3_10", "Leg1_R_4_9", "Leg1_R_5_8", this.right_targets);
                create_leg_ik_chain("Leg2_R_1_16", "Leg2_R_2_15",
                    "Leg2_R_3_14", "Leg2_R_4_13", this.right_targets);
                create_leg_ik_chain("Leg3_R_1_20", "Leg3_R_2_19",
                    "Leg3_R_3_18", "Leg3_R_4_17", this.right_targets);
                create_leg_ik_chain("Leg4_R_1_24", "Leg4_R_2_23",
                    "Leg4_R_3_22", "Leg4_R_4_21", this.right_targets);



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
            this.left_targets[0].position.add(new THREE.Vector3(-0.1,0,0));
        }
        if (event.code === 'KeyL') {
            this.left_targets[0].position.add(new THREE.Vector3(0.1,0,0));
        }
        if (event.code === 'KeyI') {
            this.left_targets[0].position.add(new THREE.Vector3(0,0.1,0));
        }
        if (event.code === 'KeyK') {
            this.left_targets[0].position.add(new THREE.Vector3(0,-0.1,0));
        }
        if (event.code === 'KeyT') {
            console.log("reset goal");
            const goal = new THREE.Vector3(0, 0, 0); // Example goal position
            this.left_targets[0].position.copy(goal);
        }
        if (event.code === 'KeyY') {
            console.log("update");
            this.ikSolver.update();
        }
        if (event.code === 'KeyX') {
            const world_pos = new THREE.Vector3(0,1,0);
            this.left_targets[0].getWorldPosition(world_pos);
            console.log("local: ")
            console.log(this.left_targets[0].position);
            console.log("world: ")
            console.log(world_pos);
        }
    }

    tick() {
        if(!this.initialized || this.ikSolver == null) return;
        // console.log(this.left_targets[0].position);
        // console.log("updating")
        this.ikSolver.update();
    }

}