export default class Framebuffer {
	constructor(renderer, params) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.textures = params.textures || [];
		this.width = params.width || 1;
		this.height = params.height || 1;
		this.WebGLFramebuffer = this.gl.createFramebuffer();

		this.renderer.bindFramebuffer(this);

		let attachments = [];

		for(let i = 0; i < this.textures.length; i++) {
			const attachment = this.gl.COLOR_ATTACHMENT0 + i;
			this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachment, this.gl.TEXTURE_2D, this.textures[i].WebGLTexture, 0);
			attachments.push(attachment);
		}

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

		this.gl.drawBuffers(attachments);

		this.renderer.bindFramebuffer(null);
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
	}
}