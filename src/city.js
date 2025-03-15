import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


export default class City {
    constructor(scene) {
        this.all = [];
        this.scene = scene;
        this.global_scale = 1;
        this.loadModels();
        console.log("city constructor")
    }

    loadModels() {
        let objLoader = new OBJLoader();
        let textureLoader = new THREE.TextureLoader()

        //**------------textures-------------------------------------------------------------------------------------------------
        //building tex
        const glass_tex = textureLoader.load('/static/tex/building_glass_tex.jpg');
        const tex2 = textureLoader.load('/static/tex/building_tex_2.png');
        const tex3 = textureLoader.load('/static/tex/building_tex_1.jpg');
        //street tex
        const street_tex = textureLoader.load('/static/tex/street_tex.jpg');
        const ground_tex = textureLoader.load('/static/tex/ground_tex.jpg');
        //sky tex
        const sky_tex = textureLoader.load('/static/tex/sky_tex.jpg');

        //**------------materials----------------------------------------------------------------------------------------------
        //building mat
        const glass_building_mat = new THREE.MeshStandardMaterial({ map: glass_tex });
        const building2_mat = new THREE.MeshStandardMaterial({ map: tex2 });
        const building1_mat = new THREE.MeshStandardMaterial({ map: tex3 });
        //street mat
        const street_tex_mat = new THREE.MeshStandardMaterial({ map: street_tex });
        //ground mat
        const ground_mat = new THREE.MeshStandardMaterial({ map: ground_tex });

        //**--------------- ground and sky sphere -------------------------------------------------------------------------
        //ground
        const planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
        this.plane = new THREE.Mesh(planeGeometry, ground_mat);
        this.plane.rotation.x = -0.5 * Math.PI;
        this.plane.castShadow = false;
        this.plane.receiveShadow = true;
        this.scene.add(this.plane);
        this.global_scale = [2, 2, 2];



        //**--------------obj import---------------------------------------------------------------------------------------
        objLoader.load(
            '/static/obj/building_elliptical.obj',
            (object) => {
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.scale(this.global_scale[0], this.global_scale[1], this.global_scale[2]);
                this.building1 = new THREE.Mesh(geometry, glass_building_mat);

                let building1_list = this.get_building1_positions();

                for (let i=0; i<building1_list.length; i++) {
                    const clone = this.building1.clone();
                    console.log([building1_list[i][0], building1_list[i][1], building1_list[i][2]])
                    clone.position.set(building1_list[i][0], building1_list[i][1], building1_list[i][2])
                    this.scene.add(clone);
                }

                this.all.push(this.building1)
                this.scene.add(this.building1)
                console.log("building 1 loaded");
            }
        );
        objLoader.load(
            '/static/obj/building_bent.obj',
            async (object) => {
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.translate(30*this.global_scale[0], 0, 5*this.global_scale[0])
                geometry.scale(this.global_scale[0], this.global_scale[1], this.global_scale[2]);
                this.building2 = new THREE.Mesh(geometry, building1_mat)

                this.scene.add(this.building2)

            }
        );
        objLoader.load(
            '/static/obj/building_square_1.obj',
            (object) => {
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.translate(30*this.global_scale[0], 0, 35*this.global_scale[0])
                geometry.scale(this.global_scale[0], this.global_scale[1], this.global_scale[2]);
                this.building3 = new THREE.Mesh(geometry, building2_mat)
                this.scene.add(this.building3);
            }
        );
        objLoader.load(
            '/static/obj/building_box.obj',
            (object) => {
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.translate(30*this.global_scale[0], 0, 65*this.global_scale[0])
                geometry.scale(this.global_scale[0], this.global_scale[1], this.global_scale[2]);
                this.building4 = new THREE.Mesh(geometry, building2_mat)
                this.scene.add(this.building4);
            }
        );
        objLoader.load(
            '/static/obj/street_1.obj',
            (object) => {
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.translate(12*this.global_scale[0], 0.5, 12*this.global_scale[0])
                geometry.scale(this.global_scale[0], this.global_scale[1], this.global_scale[2]);
                this.street1 = new THREE.Mesh(geometry, street_tex_mat)
                this.scene.add(this.street1);
            }
        );
        objLoader.load(
            '/static/obj/street_2.obj',
            (object) => {
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.translate(12*this.global_scale[0], 0.5, 12*this.global_scale[0])
                geometry.scale(this.global_scale[0], this.global_scale[1], this.global_scale[2]);
                this.street2 = new THREE.Mesh(geometry, street_tex_mat)
                this.scene.add(this.street2);
            }
        );
        objLoader.load(
            '/static/obj/street_3.obj',
            (object) => {
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.translate(12*this.global_scale[0], 0.5, 12*this.global_scale[0])
                geometry.scale(this.global_scale[0], this.global_scale[1], this.global_scale[2]);
                this.street3 = new THREE.Mesh(geometry, street_tex_mat)
                this.scene.add(this.street3);
            }
        );
        objLoader.load(
            '/static/obj/street_4.obj',
            (object) => {
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.translate(12*this.global_scale[0], 0.5, 12*this.global_scale[0])
                geometry.scale(this.global_scale[0], this.global_scale[1], this.global_scale[2]);
                this.street4 = new THREE.Mesh(geometry, street_tex_mat)
                this.street4.castShadow = true;
                this.scene.add(this.street4);
            }
        );
    }

    get_building1_positions() {
        let positions = [];
        let x, y, z = 0;
        const offset = [-5, 0, 10];
        //block1
        for (let i=0; i<6; i++) {
            for (let j=0; j<7; j++) {
                x = (offset[0] + i*45) * this.global_scale[0];
                y = (offset[1]) * this.global_scale[1];
                z = (offset[2] + j*25) * this.global_scale[2];
                positions.push([x, y, z]);
                console.log([x, y, z])
            }
        }

        //block2

        //block3
        return positions;
    }


}