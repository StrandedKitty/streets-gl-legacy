import {scene} from './main';
import {tile2degrees, tile2meters} from "./Utils";

export default class Tile {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.loaded = false;
		this.worker = undefined;
		this.mesh = new THREE.Object3D();
	}

	load(worker) {
		this.worker = worker;
		worker.start(this.x, this.y, this.onload.bind(this));
	}

	onload(data) {
		this.loaded = true;
		this.worker = undefined;

		let geometry = new THREE.BufferGeometry();
		let vertices = new Float32Array(data.vertices);
		let normals = new Float32Array(data.normals);

		geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

		let material = new THREE.MeshBasicMaterial({color: 0x000});
		let mesh = new THREE.Mesh(geometry, material);

		scene.add(mesh);

		let pivot = tile2meters(this.x, this.y + 1);
		mesh.position.set(pivot.x, 0, pivot.z);
	}
}