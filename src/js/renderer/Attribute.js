export default class Attribute {
	constructor(renderer, params) {
		this.gl = renderer.gl;
		this.name = params.name;
		this.size = params.size || 3;
		this.type = params.type || 'FLOAT';
		this.normalized = params.normalized || false;
		this.instanced = params.instanced || false;
		this.dataFormat = params.dataFormat || 'float';
		this.data = null;
		this.location = null;

		this.buffer = this.gl.createBuffer();
	}

	locate(program) {
		this.program = program;

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);

		this.location = this.gl.getAttribLocation(this.program.WebGLProgram, this.name);

		if(this.location !== -1) {
			if(this.dataFormat === 'integer') {
				this.gl.vertexAttribIPointer(this.location, this.size, this.gl[this.type], 0, 0);
			} else {
				this.gl.vertexAttribPointer(this.location, this.size, this.gl[this.type], this.normalized, 0, 0);
			}


			if(this.instanced) this.gl.vertexAttribDivisor(this.location, 1);
			this.gl.enableVertexAttribArray(this.location);

			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		}
	}

	setData(typedArray) {
		if(typedArray) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, typedArray, this.gl.DYNAMIC_DRAW);
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
			this.data = typedArray;
		}
	}

	delete() {
		this.gl.deleteBuffer(this.buffer);
	}
}
