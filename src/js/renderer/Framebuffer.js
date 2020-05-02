import Texture3D from "./Texture3D";

export default class Framebuffer {
	constructor(renderer, params) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.textures = params.textures || [];
		this.width = params.width || 1;
		this.height = params.height || 1;
		this.WebGLFramebuffer = this.gl.createFramebuffer();
		this.usesDepth = params.usesDepth || false;

		this.renderer.bindFramebuffer(this);

		let attachments = [];

		for(let i = 0; i < this.textures.length; i++) {
			const attachment = this.gl.COLOR_ATTACHMENT0 + i;
			this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachment, this.gl.TEXTURE_2D, this.textures[i].WebGLTexture, 0);
			attachments.push(attachment);
		}

		if(this.usesDepth) {
			this.depth = this.renderer.createTexture({
				width: this.width,
				height: this.height,
				minFilter: 'NEAREST',
				magFilter: 'NEAREST',
				wrap: 'clamp',
				internalFormat: 'DEPTH_COMPONENT32F',
				format: 'DEPTH_COMPONENT',
				type: 'FLOAT'
			});

			this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.TEXTURE_2D, this.depth.WebGLTexture, 0);
		}

		this.gl.drawBuffers(attachments);

		this.renderer.bindFramebuffer(null);
	}

	attachTexture3D(texture, layer, attachment = 0) {
		this.renderer.bindFramebuffer(this);
		this.renderer.gl.framebufferTextureLayer(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0 + attachment, texture.WebGLTexture, 0, layer);

		const attachments = [];

		for(let i = 0; i <= attachment; i++) {
			attachments.push(this.gl.COLOR_ATTACHMENT0 + i);
		}

		this.gl.drawBuffers(attachments);
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;

		this.renderer.bindFramebuffer(this);

		if(this.depth) this.depth.setSize(width, height);

		for(let i = 0; i < this.textures.length; i++) {
			this.textures[i].setSize(width, height);
		}

		this.renderer.bindFramebuffer(null);
	}
}
