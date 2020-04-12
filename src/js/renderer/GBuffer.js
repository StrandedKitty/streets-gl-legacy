import Bloom from "../materials/Bloom";
import FullScreenQuad from "../FullScreenQuad";

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

		this.bloom = new Bloom(renderer, width, height, {
			hdrTexture: this.framebufferHDR.textures[0]
		});

		this.quad = new FullScreenQuad({renderer: renderer}).mesh;
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

		this.framebufferHDR = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [
				this.renderer.createTexture({
					width: this.width,
					height: this.height,
					minFilter: 'NEAREST',
					magFilter: 'NEAREST',
					wrap: 'clamp',
					format: 'RGBA',
					internalFormat: 'RGBA32F',
					type: 'FLOAT'
				})
			]
		});

		this.framebufferOutput = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [
				this.renderer.createTexture({
					width: this.width,
					height: this.height,
					minFilter: 'NEAREST',
					magFilter: 'NEAREST',
					wrap: 'clamp',
					format: 'RGBA',
					internalFormat: 'RGBA8',
					type: 'UNSIGNED_BYTE'
				})
			]
		});
	}

	drawBloom() {
		this.renderer.bindFramebuffer(this.bloom.highLuminanceFramebuffer);

		this.bloom.brightnessFilterMaterial.use();
		this.quad.draw(this.bloom.brightnessFilterMaterial);

		this.renderer.bindFramebuffer(this.bloom.blurredFramebufferTemp);
		this.bloom.blurMaterial.uniforms.tHDR.value = this.bloom.highLuminanceFramebuffer.textures[0];
		this.bloom.blurMaterial.uniforms.direction.value = [1, 0];
		this.bloom.blurMaterial.use();
		this.quad.draw(this.bloom.blurMaterial);

		this.renderer.bindFramebuffer(this.bloom.blurredFramebuffer);
		this.bloom.blurMaterial.uniforms.tHDR.value = this.bloom.blurredFramebufferTemp.textures[0];
		this.bloom.blurMaterial.uniforms.direction.value = [0, 1];
		this.bloom.blurMaterial.use();
		this.quad.draw(this.bloom.blurMaterial);
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
		this.framebuffer.setSize(width, height);
		this.framebufferHDR.setSize(width, height);
		this.framebufferOutput.setSize(width, height);
		this.bloom.setSize(width, height);
	}
}
