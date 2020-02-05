import Config from "./Config";

export default class SSAA {
	constructor(renderer, width, height) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.width = width;
		this.height = height;

		this.framebuffer = renderer.createFramebuffer({
			width: this.width * Config.SSAA,
			height: this.height * Config.SSAA,
			textures: [renderer.createTexture({
				width: this.width * Config.SSAA,
				height: this.height * Config.SSAA,
				internalFormat: 'RGBA',
				format: 'RGBA',
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp'
			})]
		});
	}

	blitToScreen() {
		this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.framebuffer.WebGLFramebuffer);
		this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null);

		this.gl.blitFramebuffer(0, 0, this.framebuffer.width, this.framebuffer.height,
			0, 0, this.width, this.height,
			this.gl.COLOR_BUFFER_BIT, this.gl.LINEAR);
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
		this.framebuffer.setSize(this.width * Config.SSAA, this.height * Config.SSAA);
	}
}
