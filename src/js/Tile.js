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

	onload(e) {
		this.loaded = true;
		this.worker = undefined;
		console.log(e);
	}
}