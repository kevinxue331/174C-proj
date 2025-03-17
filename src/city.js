import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';


export default class City {
    constructor(scene) {
        this.scene = scene;
        this.global_scale = [2.6, 2.6, 2.6];
        this.objLoader = new OBJLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.loadTextures();
        this.loadModels();

        const ground_tex = this.textureLoader.load('/static/tex/ground_tex.jpg');
        const ground_mat = new THREE.MeshStandardMaterial({ map: ground_tex });
        const planeGeometry = new THREE.PlaneGeometry(500, 500, 20, 20);
        this.plane = new THREE.Mesh(planeGeometry, ground_mat);
        this.plane.rotation.x = -0.5 * Math.PI;
        this.plane.castShadow = false;
        this.plane.receiveShadow = true;
        this.scene.add(this.plane);
    }

    loadTextures() {
        this.textures = {
            glass: this.textureLoader.load('/static/tex/building_glass_tex.jpg'),
            tex2: this.textureLoader.load('/static/tex/building_tex_2.png'),
            tex3: this.textureLoader.load('/static/tex/building_tex_1.jpg'),
            concrete: this.textureLoader.load('/static/tex/concrete_tex.jpg'),
            shed: this.textureLoader.load('/static/tex/shed_tex.jpg'),
            street: this.textureLoader.load('/static/tex/street_tex.jpg'),
            ground: this.textureLoader.load('/static/tex/ground_tex.jpg'),
        };
        this.materials = {
            glass_building: new THREE.MeshStandardMaterial({ map: this.textures.glass }),
            building2: new THREE.MeshStandardMaterial({ map: this.textures.tex2 }),
            building1: new THREE.MeshStandardMaterial({ map: this.textures.tex3 }),
            concrete_building: new THREE.MeshStandardMaterial({ map: this.textures.concrete }),
            shed: new THREE.MeshStandardMaterial({ map: this.textures.shed }),
            street: new THREE.MeshStandardMaterial({ map: this.textures.street }),
            ground: new THREE.MeshStandardMaterial({ map: this.textures.ground }),
        };
    }

    loadModels() {
        this.loadModel('/static/obj/building_elliptical.obj', this.materials.glass_building, this.get_building1_positions());
        this.loadModel('/static/obj/building_bent.obj', this.materials.building1, this.get_building2_positions());
        this.loadModel('/static/obj/building_square_1.obj', this.materials.building2, this.get_building3_positions());
        this.loadModel('/static/obj/building_box.obj', this.materials.building1, this.get_building7_positions());
        this.loadModel('/static/obj/building_circle.obj', this.materials.concrete_building, this.get_building5_positions());
        this.loadModel('/static/obj/building_shed.obj', this.materials.shed, this.get_building6_positions());
        this.loadModel('/static/obj/street_1.obj', this.materials.street, this.get_road1_positions());
        this.loadModel('/static/obj/street_3.obj', this.materials.street, this.get_road3_positions());
        this.loadModel('/static/obj/street_4.obj', this.materials.street, this.get_road4_positions());
    }

    loadModel(path, material, positions) {
        this.objLoader.load(path, (object) => {
            const geometries = object.children.map(child => child.geometry);
            const geometry = BufferGeometryUtils.mergeGeometries(geometries, false);
            geometry.scale(...this.global_scale);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            positions.forEach(([pos, rot]) => {
                const clone = mesh.clone();
                clone.position.set(...pos);
                clone.rotation.set(0, rot[1], 0);
                clone.scale.set(1, 1 + (Math.random()-0.3) *0.8, 1)
                this.scene.add(clone);
            });
        });
    }

    get_building1_positions() {
        //glass
        const offset = [0, 0, 0];
        const a = this.global_scale[0];
        const width = 7.48;
        const pi = Math.PI;

        let positions = [
            [[a*18, 0, a*18], [0, 0, 0]],
            [[a*6, 0, a*110], [0, pi/2, 0]],
            [[a*22, 0, a*80], [0, pi, 0]]
        ]
        return positions;
    }
    get_building2_positions() {
        //bent
        const offset = [0, 0, 0];
        const a = this.global_scale[0];
        const width = 7.48;
        const pi = Math.PI;

        let positions = [
            [[a*48, 0, a*25], [0, pi+0.5, 0]],
            [[], []]
        ]
        return positions;
    }
    get_building3_positions() {
        //tall square
        const offset = [0, 0, 0];
        const a = this.global_scale[0];
        const width = 7.48;
        const pi = Math.PI;

        let positions = [
            [[a*35, 0, a*17], [0, pi, 0]],
            [[], []]
        ]
        return positions;
    }
    get_building5_positions() {
        //cirular
        const offset = [0, 0, 0];
        const a = this.global_scale[0];
        const width = 7.48;
        const pi = Math.PI;

        let positions = [
            [[a*35, 0, a*52], [0, pi+0.5, 0]],
            [[], []]
        ]
        return positions;
    }
    get_building6_positions() {
        //Shed
        const offset = [0, 0, 0];
        const a = this.global_scale[0];
        const width = 7.48;
        const pi = Math.PI;

        let positions = [
            [[a*15, 0, a*52], [0, pi/2, 0]],
            [[a*55, 0, a*-2], [0, pi, 0]],
            [[a*35, 0, a*-2], [0, pi, 0]],
            [[], []]
        ]
        return positions;
    }
    get_building7_positions() {
        //Shed
        const a = this.global_scale[0];
        const width = 7.48;
        const pi = Math.PI;
        let x, y, z = 0;
        let rx, ry, rz = 0;
        let positions = [];

        for (let i=0; i<4; i++) {
            for (let j=0; j<4; j++) {
                const offset = [width * (-2), 0, width * 6];
                x = (offset[0] - i * width * 1.8) * this.global_scale[0];
                y = (offset[1]) * this.global_scale[1];
                z = (offset[2] + j * width * 1.6) * this.global_scale[2];
                ry = Math.PI * 2;
                positions.push([[x, y, z], [rx, ry, rz]]);
            }
        }
        for (let i=0; i<3; i++) {
            for (let j=0; j<2; j++) {
                const offset = [width * (4), 0, width * -2];
                x = (offset[0] + i * width * 1.8) * this.global_scale[0];
                y = (offset[1]) * this.global_scale[1];
                z = (offset[2] - j * width * 1.6) * this.global_scale[2];
                ry = Math.PI/2;
                positions.push([[x, y, z], [rx, ry, rz]]);
            }
        }
        return positions;
    }

    get_road1_positions() {
        const width = 7.48;
        let x, y, z = 0;
        let rx, ry, rz = 0;
        let positions = [];

        //block 1
        for (let i = 0; i < 8; i++) {
            const offset = [width, 0.05, width];
            for (let j = 0; j < 5; j++) {
                x = (offset[0] + i*width) * this.global_scale[0];
                y = (offset[1]) * this.global_scale[1];
                z = (offset[2] + j*width*4) * this.global_scale[2];
                ry = Math.PI * 2;
                positions.push([[x, y, z], [rx, ry, rz]]);
            }
        }
        for (let i = 0; i < 2; i++) {
            const offset = [0, 0.05, 2*width];
            for (let j = 0; j < 16; j++) {
                if ((j+1) % 4 !== 0) {
                    x = (offset[0] + i * width * 9) * this.global_scale[0];
                    y = (offset[1]) * this.global_scale[1];
                    z = (offset[2] + j * width) * this.global_scale[2];
                    ry = Math.PI / 2;
                    positions.push([[x, y, z], [rx, ry, rz]]);
                }
            }
        }
        //connector 1
        for (let i = 0; i < 7; i++) {
            const offset = [-1*width, 0.05, 5*width];
            x = (offset[0] - i*width) * this.global_scale[0];
            y = (offset[1]) * this.global_scale[1];
            z = (offset[2]) * this.global_scale[2];
            ry = Math.PI;
            positions.push([[x, y, z], [rx, ry, rz]]);
        }
        for (let i = 0; i < 5; i++) {
            const offset = [-8*width, 0.05, 4*width];
            x = (offset[0]) * this.global_scale[0];
            y = (offset[1]) * this.global_scale[1];
            z = (offset[2] - i*width) * this.global_scale[2];
            ry = Math.PI/2;
            positions.push([[x, y, z], [rx, ry, rz]]);
        }

        //block2

        //block3
        return positions;
    }
    get_road3_positions() {
        const width = 7.48;
        let x, y, z = 0;
        let rx, ry, rz = 0;
        let positions = [];
        const pi = Math.PI;
        const offset = [0, 0.05, width];
        const a = this.global_scale[0]

        //block 1
        x = (offset[0]) * this.global_scale[0];
        y = (offset[1]) * this.global_scale[1];
        z = (offset[2]) * this.global_scale[2];
        ry = 0;
        positions.push([[x, y, z], [rx, ry, rz]]);

        x = (offset[0] + width*9) * this.global_scale[0];
        y = (offset[1]) * this.global_scale[1];
        z = (offset[2]) * this.global_scale[2];
        ry = pi/-2
        positions.push([[x, y, z], [rx, ry, rz]]);

        x = (offset[0] + width*(-8)) * a;
        y = (offset[1]) * a;
        z = (offset[2] + width*4) * a;
        ry = pi/2
        positions.push([[x, y, z], [rx, ry, rz]]);

        return positions;
        }
    get_road4_positions() {
        const width = 7.48;
        let x, y, z = 0;
        let rx, ry, rz = 0;
        let positions = [];

        //block 1
        for (let i = 0; i < 2; i++) {
            const offset = [0, 0.05, 2*width];
            for (let j = 0; j < 16; j++) {
                if ((j+1) % 4 == 0) {
                    x = (offset[0] + i * width * 9) * this.global_scale[0];
                    y = (offset[1]) * this.global_scale[1];
                    z = (offset[2] + j * width) * this.global_scale[2];
                    ry = Math.PI / 2;
                    positions.push([[x, y, z], [rx, ry, rz]]);
                }
            }
        }

        //block2

        //block3
        return positions;
    }


}