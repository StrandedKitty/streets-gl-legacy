export default class GBuffer {
	constructor(renderer, width, height, structure) {
		this.renderer = renderer;
		this.structure = structure;
		this.width = width;
		this.height = height;
		this.textures = {};
		this.texturesArray = [];

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
				type: element.type,
				anisotropy: 1
			});

			this.texturesArray.push(texture);
			this.textures[element.name] = texture;
		}
	}

	initFramebuffers() {
		this.framebuffer = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: this.texturesArray
		});

		this.framebufferFinal = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [
				this.renderer.createTexture({
					width: this.width,
					height: this.height,
					minFilter: 'LINEAR',
					magFilter: 'LINEAR',
					wrap: 'clamp',
					format: 'RGBA',
					internalFormat: 'RGBA8',
					type: 'UNSIGNED_BYTE'
				})
			]
		});
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
		this.framebuffer.setSize(width, height);
		this.framebufferFinal.setSize(width, height);
	}
}
