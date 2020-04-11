class Shaders {
	constructor() {
		this.shaders = {};
		this.raw = {};
		this.includes = {};

		this.raw.building = {
			fragment: require('../glsl/building.frag').default,
			vertex: require('../glsl/building.vert').default
		};
		this.raw.buildingDepth = {
			fragment: require('../glsl/buildingDepth.frag').default,
			vertex: require('../glsl/building.vert').default
		};
		this.raw.road = {
			fragment: require('../glsl/road.frag').default,
			vertex: require('../glsl/road.vert').default
		};
		this.raw.water = {
			fragment: require('../glsl/water.frag').default,
			vertex: require('../glsl/water.vert').default
		};
		this.raw.roadDepth = {
			fragment: require('../glsl/roadDepth.frag').default,
			vertex: require('../glsl/road.vert').default
		};
		this.raw.ground = {
			fragment: require('../glsl/ground.frag').default,
			vertex: require('../glsl/ground.vert').default
		};
		this.raw.quad = {
			fragment: require('../glsl/quad.frag').default,
			vertex: require('../glsl/quad.vert').default
		};
		this.raw.smaaBlend = {
			fragment: require('../glsl/smaa/blend.frag').default,
			vertex: require('../glsl/smaa/blend.vert').default,
		};
		this.raw.smaaEdges = {
			fragment: require('../glsl/smaa/edges.frag').default,
			vertex: require('../glsl/smaa/edges.vert').default
		};
		this.raw.smaaWeights = {
			fragment: require('../glsl/smaa/weights.frag').default,
			vertex: require('../glsl/smaa/weights.vert').default
		};
		this.raw.sao = {
			fragment: require('../glsl/sao.frag').default,
			vertex: require('../glsl/sao.vert').default
		};
		this.raw.blur = {
			fragment: require('../glsl/blur.frag').default,
			vertex: require('../glsl/quad.vert').default
		};
		this.raw.skybox = {
			fragment: require('../glsl/skybox.frag').default,
			vertex: require('../glsl/skybox.vert').default
		};
		this.raw.groundDepth = {
			fragment: require('../glsl/groundDepth.frag').default,
			vertex: require('../glsl/groundDepth.vert').default
		};
		this.raw.tree = {
			fragment: require('../glsl/tree.frag').default,
			vertex: require('../glsl/tree.vert').default
		};
		this.raw.treeDepth = {
			fragment: require('../glsl/treeDepth.frag').default,
			vertex: require('../glsl/tree.vert').default
		};
		this.raw.instance = {
			fragment: require('../glsl/instance.frag').default,
			vertex: require('../glsl/instance.vert').default
		};
		this.raw.instanceDepth = {
			fragment: require('../glsl/instanceDepth.frag').default,
			vertex: require('../glsl/instance.vert').default
		};
		this.raw.volumetricLighting = {
			fragment: require('../glsl/godrays.frag').default,
			vertex: require('../glsl/godrays.vert').default
		};

		this.includes.tonemapping = require('../glsl/includes/tonemapping.glsl').default;
		this.includes.shadowmapping = require('../glsl/includes/shadowmapping.glsl').default;
		this.includes.noise = require('../glsl/includes/noise.glsl').default;

		this.addIncludes();
	}

	addIncludes() {
		const includePattern = /^[ \t]*#include +<([\w\d./]+)>/gm;
		const chunks = this.includes;

		for(const [name, raw] of Object.entries(this.raw)) {
			this.shaders[name] = {};

			this.shaders[name].vertex = raw.vertex.replace(includePattern, function (match, include) {
				const string = chunks[include];

				if (string === undefined) {
					throw new Error('Can not resolve #include <' + include + '>');
				}

				return string;
			});

			this.shaders[name].fragment = raw.fragment.replace(includePattern, function (match, include) {
				const string = chunks[include];

				if (string === undefined) {
					throw new Error('Can not resolve #include <' + include + '>');
				}

				return string;
			});
		}
	}
}

export default new Shaders().shaders;
