export default class Tile {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.loaded = false;
		this.worker = undefined;
		this.mesh = new THREE.Object3D();
	}

	load(worker /* MapWorker */) {
		this.worker = worker;
		let callback = this.onload;
		worker.start(this.x, this.y, callback);
	}

	abortLoading() {
		if(!this.loaded && this.worker) this.worker.abort();
	}

	onload(e) {
		this.loaded = true;
		this.worker = undefined;
		console.log(e);
	}
}