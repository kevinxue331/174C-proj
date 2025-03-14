import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


export default class City {
    constructor(scene) {
        this.scene = scene;
        this.loadModels();

    }

    loadModels() {
        let objLoader = new OBJLoader();
        let textureLoader = new THREE.TextureLoader()

        //**------------textures-------------------------
        //building tex
        const glass_tex = textureLoader.load('/static/tex/building_glass_tex.jpg');
        const tex2 = textureLoader.load('/static/tex/building_tex_2.png');
        const tex3 = textureLoader.load('/static/tex/building_tex_1.jpg');
        //street tex
        const street_tex = textureLoader.load('/static/tex/street_tex.jpg');
        const ground_tex = textureLoader.load('/static/tex/ground_tex.jpg');
        //sky tex
        const sky_tex = textureLoader.load('/static/tex/sky_tex.jpg');

        //**------------materials------------------------
        //building mat
        const glass_building_mat = new THREE.MeshStandardMaterial({ map: glass_tex });
        const building2_mat = new THREE.MeshStandardMaterial({ map: tex2 });
        const building1_mat = new THREE.MeshStandardMaterial({ map: tex3 });
        //street mat
        const street_tex_mat = new THREE.MeshStandardMaterial({ map: street_tex });
        //ground mat
        const ground_mat = new THREE.MeshStandardMaterial({ map: ground_tex });
        //sky mat
        const sky_mat = new THREE.MeshStandardMaterial({ map: sky_tex,
                                                                                    side: THREE.DoubleSide });

        //**--------------- ground and sky sphere -------------------------------------------------------------------------
        //ground
        const planeGeometry = new THREE.PlaneGeometry(800, 800, 20, 20);
        this.plane = new THREE.Mesh(planeGeometry, ground_mat);
        this.plane.rotation.x = -0.5 * Math.PI;
        this.plane.castShadow = false;
        this.plane.receiveShadow = true;
        this.scene.add(this.plane);

        //sky sphere



        //**--------------obj import---------------------------------------------------------------------------------------
        objLoader.load(
            '/static/obj/building_elliptical.obj',
            (object) => {
                const objGeometries = [];
                console.log("hiiii");
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.scale(0.4,0.4,0.4);
                this.building1 = new THREE.Mesh(geometry, glass_building_mat);
                this.scene.add(this.building1)

            }
        );
        objLoader.load(
            '/static/obj/building_bent.obj',
            (object) => {
                const objGeometries = [];
                for (let i = 0; i < object.children.length; i++) {
                    objGeometries.push(object.children[i].geometry);
                }
                const geometry = BufferGeometryUtils.mergeGeometries(objGeometries, false);
                geometry.translate(30, 0, 5)
                geometry.scale(0.4,0.4,0.4);
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
                geometry.translate(30, 0, 35)
                geometry.scale(0.4,0.4,0.4);
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
                geometry.translate(30, 0, 65)
                geometry.scale(0.4,0.4,0.4);
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
                geometry.translate(12, 0.5, 12)
                geometry.scale(0.4,0.4,0.4);
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
                geometry.translate(12, 0.5, 12)
                geometry.scale(0.4,0.4,0.4);
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
                geometry.translate(12, 0.5, 12)
                geometry.scale(0.4,0.4,0.4);
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
                geometry.translate(12, 0.5, 12)
                geometry.scale(0.4,0.4,0.4);
                this.street4 = new THREE.Mesh(geometry, street_tex_mat)
                this.scene.add(this.street4);
            }
        );
    }
    

}