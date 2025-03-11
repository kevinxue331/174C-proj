import * as THREE from 'three';

class Particle {
    constructor(px, py, pz, vx, vy, vz, m) {
        this.position = new THREE.Vector3(px, py, pz);
        this.velocity = new THREE.Vector3(vx, vy, vz);
        this.mass = m;
    }
}

class Spring {
    constructor(p1, p2, ks, kd, len) {
        this.particle1 = p1;
        this.particle2 = p2;
        this.ks = ks;
        this.kd = kd;
        this.len = len;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.springs = [];
        this.integrationMethod = "euler";
        this.dt = 0.01;
        this.gravity = new THREE.Vector3(0, -9.8, 0);
    }

    createParticles(num) {
        this.particles = [];
        for (let i = 0; i < num; i++) {
            this.particles.push(new Particle(0, 0, 0, 0, 0, 0, 1.0));
        }
    }

    setParticle(index, mass, x, y, z, vx, vy, vz) {
        if (index >= 0 && index < this.particles.length) {
            this.particles[index] = new Particle(x, y, z, vx, vy, vz, mass);
        }
    }

    createSpring(p1Index, p2Index, ks, kd) {
        let p1 = this.particles[p1Index];
        let p2 = this.particles[p2Index];
        let restLength = p1.position.distanceTo(p2.position);

        this.springs.push(new Spring(p1, p2, ks, kd, restLength));
    }

    removeSprings() {
        this.springs = [];
    }

    update() {
        let forces = this.computeForces();
        this.forwardEuler(forces);
    }

    computeForces() {
        let forces = this.particles.map(() => new THREE.Vector3(0, 0, 0));

        // Apply gravity
        this.particles.forEach((p, i) => {
            forces[i].add(this.gravity.clone().multiplyScalar(p.mass));
        });

        // Spring forces (grappling)
        this.springs.forEach(s => {
            let dir = new THREE.Vector3().subVectors(s.particle2.position, s.particle1.position);
            let dist = dir.length();
            let normDir = dir.normalize();

            let springForce = normDir.multiplyScalar(s.ks * (dist - s.len));
            let relVel = s.particle1.velocity.clone().sub(s.particle2.velocity);
            let dampingForce = normDir.multiplyScalar(s.kd * relVel.dot(normDir));

            let totalForce = springForce.add(dampingForce);
            forces[this.particles.indexOf(s.particle1)].add(totalForce);
            forces[this.particles.indexOf(s.particle2)].sub(totalForce);
        });

        return forces;
    }

    forwardEuler(forces) {
        this.particles.forEach((p, i) => {
            if (p.mass === 0) return; // Skip stationary particle
            let acceleration = forces[i].clone().divideScalar(p.mass);
            p.velocity.add(acceleration.multiplyScalar(this.dt));
            p.position.add(p.velocity.clone().multiplyScalar(this.dt));
        });
    }
}

export { ParticleSystem };
