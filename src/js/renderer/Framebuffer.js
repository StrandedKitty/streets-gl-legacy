export default class Framebuffer {
	constructor(renderer, params) {
		this.gl = renderer.gl;

		this.textures = params.textures || [];
		this.WebGLFramebuffer = this.gl.createFramebuffer();

		renderer.bindFramebuffer(this);

		for(let i = 0; i < this.textures.length; i++) {
			this.gl.framebufferTexture2D(this.gl.DRAW_FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + i, this.gl.TEXTURE_2D, this.textures[i].WebGLTexture, 0);
		}

		renderer.bindFramebuffer(null);
	}
}