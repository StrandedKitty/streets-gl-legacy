import {scene} from './main';
import {tile2degrees, tile2meters} from "./Utils";

export default class Tile {
	constructor(x, y, callback) {
		this.x = x;
		this.y = y;
		this.callback = callback;
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

		this.callback(data);
	}
}