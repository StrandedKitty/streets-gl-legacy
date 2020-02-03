import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import ModelUtils from './ModelUtils';

class Tree {
	constructor() {
		this.mesh = {};
		this.data = null;
		this.load();
	}

	async load() {
		this.data = await load('/models/tree.gltf', GLTFLoader);
		this.processData();
	}

	processData() {
		this.mesh = ModelUtils.combineAttributes({
			primitives: [this.data.meshes[0].primitives[0], this.data.meshes[1].primitives[0]]
		});
	}
}

class Models {
	constructor() {
		this.Tree = new Tree();
	}
}

export default new Models();
