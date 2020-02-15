import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import ModelUtils from './ModelUtils';

class Tree {
	constructor(loader) {
		this.mesh = {};
		this.data = null;
		this.load();
		this.loader = loader;
	}

	async load() {
		this.data = await load('/models/tree_billboard.gltf', GLTFLoader);
		this.processData();
	}

	processData() {
		const combinedData = ModelUtils.combineAttributes({
			primitives: [this.data.meshes[0].primitives[0]]
		});

		this.mesh = ModelUtils.toNonIndexed({
			attributes: combinedData.attributes,
			indices: combinedData.indices
		});

		this.loader.loadComplete();
	}
}

class Models {
	constructor() {
		this.Tree = new Tree(this);
		this.loaded = false;
		this.callback = null;
	}

	loadComplete() {
		this.loaded = true;
		this.callback();
	}
}

export default new Models();
