import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


export default class City {
    constructor(scene) {
        this.scene = scene;
    }

    loadModels() {
        let objLoader = new OBJLoader();
        let textureLoader = new THREE.TextureLoader()

        //building tex
        const tex1 = textureLoader.load('/static/tex/building_glass_tex.jpg');
        const tex2 = textureLoader.load('/static/tex/building_tex_2.png');
        const tex3 = textureLoader.load('/static/tex/building_tex_1.jpg');
        //street tex
        const street_tex = textureLoader.load('/static/tex/street_tex.jpg');

        //materials
        const textureMaterial1 = new THREE.MeshStandardMaterial({ map: tex1 });
        const textureMaterial2 = new THREE.MeshStandardMaterial({ map: tex2 });
        const textureMaterial3 = new THREE.MeshStandardMaterial({ map: tex3 });
        //street mat
        const street_tex_mat = new THREE.MeshStandardMaterial({ map: street_tex });


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
                this.building1 = new THREE.Mesh(geometry, textureMaterial1);
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
                this.building2 = new THREE.Mesh(geometry, textureMaterial3)
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
                this.building3 = new THREE.Mesh(geometry, textureMaterial2)
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
                this.building4 = new THREE.Mesh(geometry, textureMaterial2)
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