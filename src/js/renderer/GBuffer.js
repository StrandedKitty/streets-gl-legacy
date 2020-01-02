export default class GBuffer {
	constructor(renderer, width, height, structure) {
		this.renderer = renderer;
		this.structure = structure;
		this.width = width;
		this.height = height;
		this.textures = {};
		this.texturesArray = [];
		this.renderbuffers = {};
		this.renderbuffersArray = [];

		this.initTextures();
		this.initFramebuffers();
	}

	initTextures() {
		for(let i = 0; i < this.structure.length; i++) {
			const element = this.structure[i];

			const texture = this.renderer.createTexture({
				width: this.width,
				height: this.height,
				minFilter: 'NEAREST',
				magFilter: 'NEAREST',
				wrap: 'clamp',
				format: element.format,
				internalFormat: element.internalFormat,
				type: 'UNSIGNED_BYTE',
				anisotropy: 1
			});

			const renderbuffer = this.renderer.createRenderbuffer({
				width: this.width,
				height: this.height,
				internalFormat: element.internalFormat
			});

			this.texturesArray.push(texture);
			this.textures[element.name] = texture;
			this.renderbuffersArray.push(renderbuffer);
			this.renderbuffers[element.name] = renderbuffer;
		}
	}

	initFramebuffers() {
		this.framebufferSource = this.renderer.createFramebufferMultisample({
			width: this.width,
			height: this.height,
			renderbuffers: this.renderbuffersArray
		});

		this.framebuffer = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: this.texturesArray
		});
	}
}