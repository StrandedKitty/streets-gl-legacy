export default class Attribute {
	constructor(renderer, params) {
		this.gl = renderer.gl;
		this.name = params.name;
		this.vao = params.vao;
		this.size = params.size || 3;
		this.type = params.type || 'FLOAT';
		this.normalized = params.normalized || false;
		this.data = null;
		this.location = null;

		this.buffer = this.gl.createBuffer();
	}

	locate(program) {
		this.program = program;

		this.vao.bind();

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);

		this.location = this.gl.getAttribLocation(this.program.WebGLProgram, this.name);

		this.gl.vertexAttribPointer(this.location, this.size, this.gl[this.type], this.normalized, 0, 0);
		this.gl.enableVertexAttribArray(this.location);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

		this.vao.unbind();
	}

	setData(typedArray) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, typedArray, this.gl.STATIC_DRAW);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		this.data = typedArray;
	}
}