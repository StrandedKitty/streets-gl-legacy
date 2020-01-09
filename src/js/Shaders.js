class Shaders {
	constructor() {
		this.building = {
			fragment: require('../glsl/building.frag').default,
			vertex: require('../glsl/building.vert').default
		};
		this.ground = {
			fragment: require('../glsl/ground.frag').default,
			vertex: require('../glsl/ground.vert').default
		};
		this.quad = {
			fragment: require('../glsl/quad.frag').default,
			vertex: require('../glsl/quad.vert').default
		};
		this.smaa = {
			blend: {
				fragment: require('../glsl/smaa/blend.frag').default,
				vertex: require('../glsl/smaa/blend.vert').default,
			},
			edges: {
				fragment: require('../glsl/smaa/edges.frag').default,
				vertex: require('../glsl/smaa/edges.vert').default
			},
			weights: {
				fragment: require('../glsl/smaa/weights.frag').default,
				vertex: require('../glsl/smaa/weights.vert').default
			}
		};
		this.sao = {
			fragment: require('../glsl/sao.frag').default,
			vertex: require('../glsl/sao.vert').default
		};
		this.blur = {
			fragment: require('../glsl/blur.frag').default,
			vertex: require('../glsl/quad.vert').default
		};
	}
}

export default new Shaders();