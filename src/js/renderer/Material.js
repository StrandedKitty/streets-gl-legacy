import Program from "./Program";

export default class Material {
	constructor(renderer, params) {
		this.gl = renderer.gl;
		this.shaders = {
			vertexShader: params.vertexShader,
			fragmentShader: params.fragmentShader
		};
		this.uniforms = params.uniforms || {};
		this.uniformsLocations = {};
		this.defines = params.defines || {};
		this.name = params.name;
		this.program = new Program(renderer, this.shaders);

		for (const [name, uniform] of Object.entries(this.uniforms)) {
			this.uniformsLocations[name] = this.gl.getUniformLocation(this.program.WebGLProgram, name);
		}
	}

	use() {
		this.gl.useProgram(this.program.WebGLProgram);

		for (const [name, uniform] of Object.entries(this.uniforms)) {
			let location = this.uniformsLocations[name];

			if(location === undefined) {
				this.uniformsLocations[name] = this.gl.getUniformLocation(this.program.WebGLProgram, name);
				location = this.uniformsLocations[name];
			}

			if(uniform.type[0] === 'M') {
				this.gl['uniform' + uniform.type](location, false, uniform.value);
			} else {
				this.gl['uniform' + uniform.type](location, uniform.value);
			}
		}
	}

	updateUniform(name) {
		let uniform = this.uniforms[name];
		let location = this.uniformsLocations[name];

		if(uniform.type[0] === 'M') {
			this.gl['uniform' + uniform.type](location, false, uniform.value);
		} else {
			this.gl['uniform' + uniform.type](location, uniform.value);
		}
	}
}