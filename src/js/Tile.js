import {tile2meters, toRad} from "./Utils";
import Config from "./Config";

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
		if(data.code === 'error') {
			console.error('Worker error:', data.error);
		} else if(data.code === 'info') {
			console.info('Worker info:', data.info);
		} else {
			this.loaded = true;
			this.worker = undefined;
			this.objects = data.ids;
			this.callback(data);
		}
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

	getGroundMesh() {
		let texture = new THREE.TextureLoader().load('https://a.tile.openstreetmap.org/16/' + this.x + '/' + this.y + '.png');
		texture.anisotropy = Config.textureAnisotropy;
		let material = new THREE.MeshBasicMaterial({
			map: texture
		});
		let geometry = new THREE.PlaneBufferGeometry(40075016.7 / (1 << 16), 40075016.7 / (1 << 16));
		geometry.rotateX(toRad(-90));
		geometry.rotateY(toRad(-90));
		this.groundMesh = new THREE.Mesh(geometry,material);

		let position = tile2meters(this.x, this.y + 1);
		this.groundMesh.position.set(position.x + 20037508.34 / (1 << 16), 0, position.z + 20037508.34 / (1 << 16));

		return this.groundMesh;
	}
}