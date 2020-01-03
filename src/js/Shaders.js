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
	}
}

export default new Shaders();