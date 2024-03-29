import {tile2meters, tileEncode, toRad} from "./Utils";
import Config from "./Config";
import Shapes from "./Shapes";

export default class Tile {
	constructor(x, y, callback, onDelete) {
		this.x = x;
		this.y = y;
		this.id = tileEncode(this.x, this.y);
		this.callback = callback;
		this.onDelete = onDelete;
		this.loaded = false;
		this.worker = null;
		this.meshes = {
			buildings: null,
			roads: null,
			water: null
		};
		this.displayBuffer = null;
		this.objects = null;
		this.displayedCount = null;
		this.deleted = false;
		this.time = 0;
	}

	load(worker) {
		this.worker = worker;
		worker.start(this.x, this.y, this.onload.bind(this));
	}

	onload(data) {
		if(data.code === 'error') {
			console.error('Worker error:', data.error, ', retrying...');
			this.load(this.worker);
		} else if(data.code === 'info') {
			console.info('Worker info:', data.info);
		} else {
			this.worker = null;
			this.objects = this.createObjectsTable(data);
			this.displayedCount = data.buildings.ids.length;
			this.displayBuffer = new Uint8Array(data.buildings.vertices.length / 3);
			this.fadeBuffer = new Uint8Array(data.buildings.vertices.length / 3);
			this.callback(data);
			this.loaded = true;
		}
	}

	hideObject(id) {
		id = id.toString();

		const size = this.objects[id].size;
		const offset = this.objects[id].offset;

		for(let i = offset; i < size + offset; i++) {
			this.displayBuffer[i] = 255;
		}

		this.meshes.buildings.setAttributeData('display', this.displayBuffer);
		this.meshes.buildings.updateAttribute('display');

		if(!this.objects[id].visible) console.error('Mesh part ' + id + ' is already hidden');
		else {
			this.objects[id].visible = false;
			--this.displayedCount;
			if(this.displayedCount === 0) this.delete();
		}
	}

	showObject(id) {
		id = id.toString();

		const size = this.objects[id].size;
		const offset = this.objects[id].offset;

		for(let i = offset; i < size + offset; i++) {
			this.displayBuffer[i] = 0;
		}

		this.meshes.buildings.setAttributeData('display', this.displayBuffer);
		this.meshes.buildings.updateAttribute('display');

		if(this.objects[id].visible) console.error('Mesh part ' + id + ' is already displayed');
		else {
			this.objects[id].visible = true;
			++this.displayedCount;
		}
	}

	animate(objectId) {
		const id = objectId.toString();

		const size = this.objects[id].size;
		const offset = this.objects[id].offset;

		for(let i = offset; i < size + offset; i++) {
			this.fadeBuffer[i] = 255;
		}

		this.meshes.buildings.setAttributeData('fade', this.fadeBuffer);
		this.meshes.buildings.updateAttribute('fade');
	}

	getGroundMesh(renderer) {
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

		this.groundMesh.data.tile = this;

		this.groundMesh.setPosition(position.x + tileSize / 2, 0, position.z + tileSize / 2);
		this.groundMesh.updateMatrix();

		this.groundMesh.setBoundingBox({
			x: -tileSize / 2,
			y: 0,
			z: -tileSize / 2
		}, {
			x: tileSize / 2,
			y: 1000,
			z: tileSize / 2
		});

		this.groundMesh.data.time = 0;

		return this.groundMesh;
	}

	createObjectsTable(data) {
		const obj = {};

		this.verts = data.buildings.vertices.length / 3;

		for(let i = 0; i < data.buildings.ids.length; i++) {
			const offset = data.buildings.offsets[i];
			const nextOffset = data.buildings.offsets[i + 1] || (data.buildings.vertices.length / 3);
			const size = nextOffset - offset;

			obj[data.buildings.ids[i]] = {
				visible: true,
				offset,
				size
			};
		}

		return obj;
	}

	delete() {
		this.deleted = this.onDelete();

		if(this.deleted) {
			if(this.groundMesh) this.groundMesh.delete();
			this.groundMesh = null;

			this.meshes.buildings.delete();
			this.meshes.buildings = null;

			this.meshes.roads.delete();
			this.meshes.roads = null;

			if(this.meshes.water) this.meshes.water.delete();
			this.meshes.water = null;

			for(let i = 0; i < this.verts; i++) {
				this.displayBuffer[i] = 255;
			}

			for(let id in this.objects) {
				this.objects.visible = false;
			}
		}
	}
}
