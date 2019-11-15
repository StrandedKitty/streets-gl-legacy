export default class Tile {
	constructor(x, y, callback) {
		this.x = x;
		this.y = y;
		this.id = this.y * 65536 + this.x;
		this.callback = callback;
		this.loaded = false;
		this.worker = undefined;
		this.mesh = new THREE.Object3D();
		this.displayBuffer = new Uint8Array();
		this.objects = [];
	}

	load(worker) {
		this.worker = worker;
		worker.start(this.x, this.y, this.onload.bind(this));
	}

	onload(data) {
		this.loaded = true;
		this.worker = undefined;

		this.objects = data.ids;

		this.callback(data);
	}

	hideObject(offset, size) {
		for(let i = offset; i < size + offset; i++) {
			this.displayBuffer[i] = 1;
		}

		this.mesh.geometry.attributes.display.needsUpdate = true;
	}

	showObject(offset, size) {
		for(let i = offset; i < size + offset; i++) {
			this.displayBuffer[i] = 0;
		}

		this.mesh.geometry.attributes.display.needsUpdate = true;
	}
}