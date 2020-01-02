export default class Renderbuffer {
	constructor(renderer, params) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.internalFormat = params.internalFormat;
		this.width = params.width || 1;
		this.height = params.height || 1;

		this.WebGLRenderbuffer = this.gl.createRenderbuffer();
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.WebGLRenderbuffer);
		this.gl.renderbufferStorageMultisample(this.gl.RENDERBUFFER, 8, this.gl[this.internalFormat], this.width, this.height);
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
	}
}