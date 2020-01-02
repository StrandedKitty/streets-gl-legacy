export default class FramebufferMultisample {
	constructor(renderer, params) {
		this.renderer = renderer;
		this.gl = renderer.gl;

		this.renderbuffers = params.renderbuffers || [];
		this.width = params.width || 1;
		this.height = params.height || 1;
		this.WebGLFramebuffer = this.gl.createFramebuffer();

		this.renderer.bindFramebuffer(this);

		let attachments = [];

		for(let i = 0; i < this.renderbuffers.length; i++) {
			const attachment = this.gl.COLOR_ATTACHMENT0 + i;
			this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, attachment, this.gl.RENDERBUFFER, this.renderbuffers[i].WebGLRenderbuffer);
			attachments.push(attachment);
		}

		let depthTexture = this.renderer.createRenderbuffer({
			internalFormat: 'DEPTH_COMPONENT32F',
			width: window.innerWidth,
			height: window.innerHeight
		});
		this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, depthTexture.WebGLRenderbuffer);
		this.depth = depthTexture;

		this.gl.drawBuffers(attachments);

		this.renderer.bindFramebuffer(null);
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
	}
}