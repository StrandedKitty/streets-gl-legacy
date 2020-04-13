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
		this.renderer.blitFramebuffer({
			source: this.framebuffer,
			destination: null,
			destinationWidth: this.width,
			destinationHeight: this.height,
			filter: 'LINEAR',
			depth: false
		});
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
		this.framebuffer.setSize(this.width * Config.SSAA, this.height * Config.SSAA);
	}
}
