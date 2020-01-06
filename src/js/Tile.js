import {tile2meters, tileEncode, toRad} from "./Utils";
import Config from "./Config";
import Shapes from "./renderer/Shapes";

export default class Tile {
	constructor(x, y, callback) {
		this.x = x;
		this.y = y;
		this.id = tileEncode(this.x, this.y);
		this.callback = callback;
		this.loaded = false;
		this.worker = null;
		this.mesh = null;
		this.displayBuffer = null;
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
			this.worker = null;
			this.objects = data.ids;
			this.displayBuffer = new Uint8Array(data.vertices.length / 3);
			this.callback(data);
		}
	}

	hideObject(offset, size) {
		for(let i = offset; i < size + offset; i++) {
			this.displayBuffer[i] = 255;
		}

		this.mesh.setAttributeData('display', this.displayBuffer);
		this.mesh.updateAttribute('display');
	}

	showObject(offset, size) {
		for(let i = offset; i < size + offset; i++) {
			this.displayBuffer[i] = 0;
		}

		this.mesh.setAttributeData('display', this.displayBuffer);
		this.mesh.updateAttribute('display');
	}

	getGroundMesh(renderer) {
		/*let loader = new THREE.TextureLoader();
		loader.crossOrigin = '';
		let texture = loader.load('https://tile.osmand.net/hd/16/' + this.x + '/' + this.y + '.png');
		texture.anisotropy = Config.textureAnisotropy;
		let material = new THREE.MeshBasicMaterial({
			map: texture,
			depthWrite: false
		});*/
		const tileSize = 40075016.7 / (1 << 16);
		const position = tile2meters(this.x, this.y + 1);
		let vertices = (new Shapes.plane(tileSize, tileSize)).vertices;
		let uv = (new Shapes.plane(tileSize, tileSize)).uv;

		this.groundMesh = renderer.createMesh({
			vertices: vertices
		});

		this.groundMesh.addAttribute({
			name: 'uv',
			size: 2,
			type: 'FLOAT'
		});

		this.groundMesh.setAttributeData('uv', uv);
		this.groundMesh.updateAttribute('uv');

		this.groundMesh.id = ~~(Math.random() * 1000);

		this.groundMesh.setPosition(position.x + tileSize / 2, 0, position.z + tileSize / 2);
		this.groundMesh.updateMatrix();

		return this.groundMesh;
	}
}