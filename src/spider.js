import * as THREE from 'three';
import * as math from 'https://cdn.jsdelivr.net/npm/mathjs@10.6.4/+esm';
import * as matrixhelper from "./matrixhelper.js"
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export default class Spider {
    constructor() {
        const geo = new THREE.BoxGeometry(5,5,5);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geo, mat);
        this.bodyTheta = 0;
        this.bodyY = 3;
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        // initialize body
        const geometry = new THREE.BoxGeometry(2.5,2.5,2.5);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.body = new Node("body", new THREE.Mesh(geometry, material), math.identity(4));
        this.shoulder = new Arc("arc", this.body, null, matrixhelper.translationMatrix(1.25,0,0));
        this.shoulder.set_dof(false,true,false);
        this.body.children_arcs.push(this.shoulder);
        this.root = new Arc("root", null, this.body, matrixhelper.translationMatrix(-10,3,10));
        this.root.set_dof(false,false,false);
        // initialize legs
        this.leg = new Leg(this.body, this.root, this.shoulder);
    }

    addToScene(scene) {
        // scene.add(this.cube);
        this.leg.addToScene(scene);
    }

    onKeyDown(event) {
        if (event.code === 'Space') {
            // this.leg.Pg = math.add(this.leg.Pg, [-1,0,0]);
            this.leg.apply_theta();
        }
        if (event.code === 'KeyJ') {
            this.root.location_matrix = math.multiply(matrixhelper.translationMatrix(-0.1,0,0), this.root.location_matrix);
            // this.leg.apply_theta();
        }
        if (event.code === 'KeyL') {
            this.root.location_matrix = math.multiply(matrixhelper.translationMatrix(0.1,0,0), this.root.location_matrix);
            // this.leg.apply_theta();
        }
        if (event.code === 'KeyI') {
            this.root.location_matrix = math.multiply(matrixhelper.translationMatrix(0,0,-0.1), this.root.location_matrix);
            // this.leg.apply_theta();
        }
        if (event.code === 'KeyK') {
            this.root.location_matrix = math.multiply(matrixhelper.translationMatrix(0,0,0.1), this.root.location_matrix);
            // this.leg.apply_theta();
        }
        if (event.code === 'KeyY') {
            this.bodyTheta+=0.0174533;
            this.leg.root.articulation_matrix = matrixhelper.rotationZ(this.bodyTheta)
            this.leg.update();
        }
        if (event.code === 'KeyT') {
            this.bodyY += 0.1;
            this.leg.root.location_matrix = matrixhelper.translationMatrix(0, this.bodyY, 0)
            this.leg.update();
        }
    }

    tick() {
        const leg_rest = [3, -2, 0, 1]
        const global_position = math.multiply(this.root.location_matrix, math.multiply(this.root.articulation_matrix, leg_rest)).toArray();
        const leg_rest_global = [global_position[0], global_position[1], global_position[2]];
        const distance_to_rest = math.distance(this.leg.Pg, leg_rest_global);
        // console.log(distance_to_rest);

        if(distance_to_rest > 1) this.leg.stepping = true;
        else this.leg.update();

        if(this.leg.stepping) {
            // const to_rest_vec = math.divide(math.subtract(leg_rest_global, this.leg.Pg), math.norm(math.subtract(leg_rest_global, this.leg.Pg)));
            const to_rest_vec = math.subtract(leg_rest_global, this.leg.Pg)
            const to_rest_vec_norm = math.divide(to_rest_vec, math.norm(to_rest_vec));
            // console.log(to_rest_vec);
            const next_Pg = math.add(this.leg.Pg, math.multiply(to_rest_vec_norm, 0.25));
            this.leg.set_goal(next_Pg);
        }

        if(this.leg.stepping && distance_to_rest <= 0.25) this.leg.stepping = false;
        this.leg.apply_theta();

    }
}

class Leg {
    constructor(body, root, shoulder) {
        this.body = body;
        this.root = root;
        this.shoulder = shoulder;
        this.nodes = [this.body];
        this.arcs = [this.root, this.shoulder];
        this.Pg = [0, 0, 0];
        this.stepping = false;
    }

    addNode(length, shape) {
        // right upper arm node
        let node_transform = matrixhelper.scalingMatrix(length, 0.2, 0.2);
        node_transform = math.multiply(matrixhelper.translationMatrix(length/2, 0, 0), node_transform);
        let node = new Node("node", shape, node_transform);
        this.arcs[this.arcs.length-1].child_node = node;
        this.nodes.push(node);

        let arc_location = matrixhelper.translationMatrix(length, 0, 0)

        let arc = new Arc("arc", node, null, arc_location);
        arc.set_dof(false, false, true);
        node.children_arcs.push(arc);
        this.arcs.push(arc);
    }

    addToScene(scene) {
        const geometry = new THREE.BoxGeometry(1,1,1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const uarmmat = new THREE.MeshBasicMaterial({ color: 0x03fcec });
        const larmmat = new THREE.MeshBasicMaterial({ color: 0x002fff });
        const handmat = new THREE.MeshBasicMaterial({ color: 0xff006f });

        this.addNode(2, new THREE.Mesh(geometry, uarmmat));
        this.addNode(2.5, new THREE.Mesh(geometry, larmmat));
        this.addNode(1.5, new THREE.Mesh(geometry, handmat));
        // this.addNode(1, new THREE.Mesh(geometry, handmat));

        this.goal = new THREE.Mesh(geometry, material);
        scene.add(this.goal)

        for(let i=0; i<this.nodes.length; i++){
            scene.add(this.nodes[i].shape);
        }

        // here I only use 7 dof
        this.dof = 0;
        for(let i=0; i<this.arcs.length; i++){
            if(this.arcs[i].dof.Rx) this.dof++;
            if(this.arcs[i].dof.Ry) this.dof++;
            if(this.arcs[i].dof.Rz) this.dof++;
        }

        this.theta = Array(this.dof).fill(0);

        this.update()
    }

    set_goal(goal) {
        this.Pg = goal;
        // this.apply_theta();
    }

    update() {
        this.matrix_stack = [];
        this._rec_draw(this.arcs[0], math.identity(4));
    }

    _rec_draw(arc, matrix) {
        if (arc !== null) {
            const L = arc.location_matrix;
            const A = arc.articulation_matrix;
            matrix = math.multiply(matrix, math.multiply(L, A))
            this.matrix_stack.push(math.clone(matrix));

            const node = arc.child_node;
            if(node == null) {
                matrix = matrix.toArray();
                this.end_effector = [matrix[0][3], matrix[1][3], matrix[2][3]]
                return;
            }
            const T = node.transform_matrix;
            matrix = math.multiply(matrix, T)
            const decomp = matrixhelper.decomposeMathMatrixToThree(matrix);
            node.shape.position.x = decomp.translation.x;
            node.shape.position.y = decomp.translation.y;
            node.shape.position.z = decomp.translation.z;
            node.shape.scale.x = decomp.scale.x;
            node.shape.scale.y = decomp.scale.y;
            node.shape.scale.z = decomp.scale.z;
            node.shape.setRotationFromQuaternion(decomp.rotation);
            if(arc.end_effector) {
                let lp = arc.end_effector.local_position;
                let ef_matrix = matrix;
            }

            matrix = this.matrix_stack.pop();
            for (const next_arc of node.children_arcs) {
                if(!this.arcs.includes(next_arc)) continue;
                this.matrix_stack.push(math.clone(matrix));
                this._rec_draw(next_arc, matrix);
                matrix = this.matrix_stack.pop();
            }
        }
    }

    // mapping from global theta to each joint theta
    apply_theta() {
        this.goal.position.x = this.Pg[0];
        this.goal.position.y = this.Pg[1];
        this.goal.position.z = this.Pg[2];

        if (this.end_effector == null) return;

        this.E = math.subtract(this.Pg, this.end_effector);
        if (math.norm(this.E) <= 0.1) return;

        let iterations = 0;
        let prev_error = Infinity;
        const max_iterations = 20;
        const min_error_change = 0.001;

        // for(let i=0; i<this.arcs.length; i++) {
        //     this.arcs[i].update_articulation([0,0,0]);
        // }
        this.shoulder.articulation_matrix = matrixhelper.rotationZ(0.785398)
        while (math.norm(this.E) > 0.1 && iterations < max_iterations) {
            prev_error = math.norm(this.E);
            iterations++;

            const k = 0.5; // Adaptive step size
            const dx = math.multiply(k, this.E);

            this.Jacobian = this.calculate_Jacobian();
            const d_theta = this.calculate_delta_theta(this.Jacobian, dx);

            this.theta = math.add(this.theta, d_theta); // Update joint angles

            // Apply joint limits (if any)
            // this.theta = math.max(min_limits, math.min(max_limits, this.theta));

            // Update joint positions
            let applied_dofs = 0;
            for (let i = 0; i < this.arcs.length; i++) {
                let rx = 0, ry = 0, rz = 0;
                let hasDOFs = this.arcs[i].dof.Rx || this.arcs[i].dof.Ry || this.arcs[i].dof.Rz;
                if(!hasDOFs) break;
                if (this.arcs[i].dof.Rx) rx = this.theta[applied_dofs++];
                if (this.arcs[i].dof.Ry) ry = this.theta[applied_dofs++];
                if (this.arcs[i].dof.Rz) rz = this.theta[applied_dofs++];
                this.arcs[i].update_articulation([rx, ry, rz]);
            }

            this.update(); // Update end-effector position
            this.E = math.subtract(this.Pg, this.end_effector);
        }
        console.log("iterations: " + iterations);

    }

    calculate_Jacobian() {
        let J = new Array(3);
        for (let i = 0; i < 3; i++) {
            J[i] = new Array(this.dof);
        }

        // TODO: Implement your Jacobian here
        // we will proceed with numerical differentiation
        const s = 0.1;

        let dof = 0;
        let applied_dofs = 0;
        for(let i=0; i<this.arcs.length; i++) {
            let rx = 0;
            let ry = 0;
            let rz = 0;
            if(this.arcs[i].dof.Rx) {
                rx = this.theta[applied_dofs];
                applied_dofs++;
            }
            if(this.arcs[i].dof.Ry) {
                ry = this.theta[applied_dofs];
                applied_dofs++;
            }
            if(this.arcs[i].dof.Rz) {
                rz = this.theta[applied_dofs];
                applied_dofs++;
            }
            dof = this.set_jacobian_section(this.arcs[i], s, J, dof, [rx, ry, rz]);
        }

        return J;
    }

    set_jacobian_section(arc, s, J, dof, init_theta) {
        for(let i = 0; i < 3; i++) {
            let j_dofs = [arc.dof.Rx, arc.dof.Ry, arc.dof.Rz];
            if(j_dofs[i] === false) continue;

            let theta = [0,0,0];
            theta[i] = s;

            let init_ef_pos = this.end_effector;
            arc.update_articulation(math.add(init_theta,theta))
            this.update()
            let new_ef_pos = this.end_effector;
            let d_ef = math.subtract(new_ef_pos, init_ef_pos);

            J[0][dof] = d_ef[0]/s;
            J[1][dof] = d_ef[1]/s;
            J[2][dof] = d_ef[2]/s;

            arc.update_articulation(init_theta);
            dof++;
        }
        return dof;
    }

    calculate_delta_theta(J, dx) {
        const J_T = math.transpose(J);
        const J_JT = math.multiply(J, J_T);
        const inv_J_JT = math.inv(J_JT);
        const J_pseudo = math.multiply(J_T, inv_J_JT);
        return math.multiply(J_pseudo, dx);
    }

}

class Node {
    constructor(name, shape, transform) {
        this.name = name;
        this.shape = shape;
        this.transform_matrix = transform;
        this.children_arcs = [];
    }
}

class Arc {
    constructor(name, parent, child, location) {
        this.name = name;
        this.parent_node = parent;
        this.child_node = child;
        this.location_matrix = location;
        this.articulation_matrix = math.identity(4);
        this.end_effector = null;
        // Here I only implement rotational DOF
        this.dof = {
            Rx: false,
            Ry: false,
            Rz: false,
        }
    }

    // Here I only implement rotational DOF
    set_dof(x, y, z) {
        this.dof.Rx = x;
        this.dof.Ry = y;
        this.dof.Rz = z;
    }

    update_articulation(theta) {
        this.articulation_matrix = math.identity(4);
        if (this.dof.Rx) {
            this.articulation_matrix = math.multiply(matrixhelper.rotationX(theta[0]), this.articulation_matrix);
        }
        if (this.dof.Ry) {
            this.articulation_matrix = math.multiply(matrixhelper.rotationY(theta[1]), this.articulation_matrix);
        }
        if (this.dof.Rz) {
            this.articulation_matrix = math.multiply(matrixhelper.rotationZ(theta[2]), this.articulation_matrix);
        }
    }
}