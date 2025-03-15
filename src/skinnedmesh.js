import * as THREE from 'three';

export class SkinnedCylinder {
    constructor(material, height = 5, radius = 5, radialSegments = 5, heightSegments = 15, boneCount = 3) {
        this.height = height;
        this.boneCount = boneCount;
        this.boneHeight = height / boneCount;

        // Create geometry
        this.geometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments, heightSegments, true);

        // Compute skin indices & weights
        this.setupSkinning();

        // Create skeleton
        this.bones = this.createBones();
        this.skeleton = new THREE.Skeleton(this.bones);

        // Create skinned mesh
        this.mesh = new THREE.SkinnedMesh(this.geometry, material);

        // Add the root bone to the mesh
        this.mesh.add(this.bones[0]);

        // Bind the skeleton to the mesh
        this.mesh.bind(this.skeleton);
    }

    setupSkinning() {
        const position = this.geometry.attributes.position;
        const skinIndices = [];
        const skinWeights = [];

        const halfHeight = this.height / 2;

        for (let i = 0; i < position.count; i++) {
            const vertex = new THREE.Vector3().fromBufferAttribute(position, i);
            const y = vertex.y + halfHeight; // Map y to [0, height]

            // Determine which two bones influence this vertex
            const boneIndex = Math.floor(y / this.boneHeight);
            const weight = (y % this.boneHeight) / this.boneHeight;

            // Ensure valid indices
            const skinIndex1 = Math.min(boneIndex, this.boneCount - 1);
            const skinIndex2 = Math.min(boneIndex + 1, this.boneCount - 1);

            skinIndices.push(skinIndex1, skinIndex2, 0, 0);
            skinWeights.push(1 - weight, weight, 0, 0);
        }

        this.geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
        this.geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
    }

    createBones() {
        const bones = [];
        let prevBone = null;

        for (let i = 0; i < this.boneCount; i++) {
            const bone = new THREE.Bone();
            bone.position.y = i * this.boneHeight; // Position bones along Y-axis
            if (prevBone) prevBone.add(bone); // Make each bone a child of the previous one
            bones.push(bone);
            prevBone = bone;
        }

        return bones;
    }

    rotateBone(index, angleX, angleY, angleZ) {
        if (index >= 0 && index < this.boneCount) {
            this.bones[index].rotation.set(angleX, angleY, angleZ);
        }
    }

    getMesh() {
        return this.mesh;
    }
}

export default SkinnedCylinder;
