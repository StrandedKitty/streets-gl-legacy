import Program from "./Program";

export default class Material {
	constructor(renderer, params) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.shaders = {
			vertexShader: params.vertexShader,
			fragmentShader: params.fragmentShader
		};
		this.uniforms = params.uniforms || {};
		this.uniformsLocations = {};
		this.defines = params.defines || {};
		this.name = params.name;
		this.drawMode = params.drawMode || 'TRIANGLES';
		this.program = new Program(renderer, this.shaders);
	}

	use() {
		this.gl.useProgram(this.program.WebGLProgram);

		let texturesUsed = 0;

		for (const [name, uniform] of Object.entries(this.uniforms)) {
			let location = this.uniformsLocations[name];

			if(location === undefined || location === null) {
				location = this.gl.getUniformLocation(this.program.WebGLProgram, name);
				//if(location === null) console.error('Location for uniform ' + name + ' is ' + location);
				this.uniformsLocations[name] = location;
			}

			if(location !== null && uniform.value !== null) {
				if (uniform.type[0] === 'M') {
					this.gl['uniform' + uniform.type](location, false, uniform.value);
				} else if (uniform.type === 'texture') {
					this.gl.activeTexture(this.gl.TEXTURE0 + texturesUsed);
					this.gl.bindTexture(this.gl.TEXTURE_2D, uniform.value.WebGLTexture);
					this.gl.uniform1i(this.uniformsLocations[name], texturesUsed);
					++texturesUsed;
				} else if (uniform.type === 'textureCube') {
					this.gl.activeTexture(this.gl.TEXTURE0 + texturesUsed);
					if(uniform.value.loaded) this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, uniform.value.WebGLTexture);
					this.gl.uniform1i(this.uniformsLocations[name], texturesUsed);
					++texturesUsed;
				} else if (uniform.type === 'texture2DArray') {
					this.gl.activeTexture(this.gl.TEXTURE0 + texturesUsed);
					this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, uniform.value.WebGLTexture);
					this.gl.uniform1i(this.uniformsLocations[name], texturesUsed);
					++texturesUsed;
				} else if (uniform.type === 'texture3D') {
					this.gl.activeTexture(this.gl.TEXTURE0 + texturesUsed);
					this.gl.bindTexture(this.gl.TEXTURE_3D, uniform.value.WebGLTexture);
					this.gl.uniform1i(this.uniformsLocations[name], texturesUsed);
					++texturesUsed;
				} else {
					this.gl['uniform' + uniform.type](location, uniform.value);
				}
			}
		}

		this.renderer.material = this;
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
