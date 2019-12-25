export default class VAO {
	constructor(renderer, params) {
		this.gl = renderer.gl;

		this.vertexArrayObject = this.gl.createVertexArray();
	}

	bind() {
		this.gl.bindVertexArray(this.vertexArrayObject);
	}

	unbind() {
		this.gl.bindVertexArray(null);
	}
}