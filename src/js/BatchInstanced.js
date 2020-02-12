import Models from "./Models";
import ModelUtils from "./ModelUtils";
import {tile2meters, tileDecode} from "./Utils";

export default class BatchInstanced {
	constructor(renderer, params) {
		this.renderer = renderer;

		this.tiles = new Map();
		this.pivot = {x: 0, y: 0};

		this.mergedAttributes = {};

		this.mesh = null;

		this.generateMesh();
	}

	addTile(params) {
		this.tiles.set(params.tile.id, params.attributes);

		this.pivot = tile2meters(params.tile.x, params.tile.y + 1);

		this.updateAttributes();
	}

	removeTile(params) {
		this.tiles.delete(params.tile.id);

		this.updateAttributes();
	}

	updateAttributes() {
		for (const [tileId, attributes] of this.tiles.entries()) {
			const array = new Float32Array(attributes.iPosition.length / 3 * 2);

			const tilePosition = tileDecode(tileId);
			const tilePivot = tile2meters(tilePosition.x, tilePosition.y + 1);
			const delta = {x: tilePivot.x - this.pivot.x, z: tilePivot.z - this.pivot.z};

			attributes.iOffset = ModelUtils.fillTypedArraySequence(array, new Float32Array([delta.x, delta.z]));
		}

		this.mergeAttributes();

		this.mesh.setAttributeData('iPosition', this.mergedAttributes.iPosition);
		this.mesh.updateAttribute('iPosition');

		this.mesh.setAttributeData('iOffset', this.mergedAttributes.iOffset);
		this.mesh.updateAttribute('iOffset');

		if(this.mergedAttributes.iPosition) this.mesh.instances = this.mergedAttributes.iPosition.length / 3;
		else this.mesh.instances = 0;

		this.mesh.setPosition(this.pivot.x, 0, this.pivot.z);
	}

	mergeAttributes() {
		const attributesArrays = {};

		for (const attributes of this.tiles.values()) {
			for (const name in attributes) {
				if (!attributesArrays[name]) attributesArrays[name] = [];

				attributesArrays[name].push(attributes[name]);
			}
		}

		for (const name in attributesArrays) {
			this.mergedAttributes[name] = ModelUtils.mergeTypedArrays(attributesArrays[name]);
		}
	}

	generateMesh() {
		const mesh = this.renderer.createMeshInstanced({
			vertices: Models.Tree.mesh.attributes.POSITION,
			indices: Models.Tree.mesh.indices,
			instances: 0
		});

		this.mesh = mesh;

		mesh.addAttribute({
			name: 'normal',
			size: 3,
			type: 'FLOAT',
			normalized: false
		});
		mesh.setAttributeData('normal', Models.Tree.mesh.attributes.NORMAL);

		mesh.addAttribute({
			name: 'uv',
			size: 2,
			type: 'FLOAT',
			normalized: false
		});
		mesh.setAttributeData('uv', Models.Tree.mesh.attributes.TEXCOORD_0);

		mesh.addAttribute({
			name: 'mesh',
			size: 1,
			type: 'UNSIGNED_BYTE',
			dataFormat: 'integer',
			normalized: false
		});
		mesh.setAttributeData('mesh', Models.Tree.mesh.attributes.MESH);

		mesh.addAttribute({
			name: 'iPosition',
			size: 3,
			type: 'FLOAT',
			normalized: false,
			instanced: true
		});
		mesh.setAttributeData('iPosition', null);

		mesh.addAttribute({
			name: 'iOffset',
			size: 2,
			type: 'FLOAT',
			normalized: false,
			instanced: true
		});
		mesh.setAttributeData('iOffset', null);
	}
}
