import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import ModelUtils from './ModelUtils';

class Tree {
	constructor(loader) {
		this.loader = loader;
		this.mesh = {};
		this.data = null;

		this.load().then(function () {
			this.processData() }.bind(this)
		);
	}

	async load() {
		this.data = await load('/models/tree_billboard.gltf', GLTFLoader);
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

class Hydrant {
	constructor(loader) {
		this.loader = loader;
		this.mesh = {};
		this.data = null;

		this.load().then(function () {
			this.processData() }.bind(this)
		);
	}

	async load() {
		this.data = await load('/models/fire_hydrant.gltf', GLTFLoader);
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
		this.loaded = false;
		this.onload = null;

		this.load();
	}

	load() {
		this.totalCount = 2;
		this.loadedCount = 0;
		this.Tree = new Tree(this);
		this.Hydrant = new Hydrant(this);
	}

	loadComplete() {
		this.loaded = true;

		++this.loadedCount;
		if(this.loadedCount === this.totalCount) this.onload();
	}
}

export default new Models();
