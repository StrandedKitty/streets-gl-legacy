export default class Framebuffer {
	constructor(renderer, params) {
		this.gl = renderer.gl;

		this.textures = params.textures || [];
		this.WebGLFramebuffer = this.gl.createFramebuffer();

		this.bind();

		for(let i = 0; i < this.textures.length; i++) {
			this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + i, this.gl.TEXTURE_2D, this.textures[i], 0);
		}

		this.unbind();
	}

	bind() {
		this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, this.WebGLFramebuffer);
	}

	unbind() {
		this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null);
	}
}