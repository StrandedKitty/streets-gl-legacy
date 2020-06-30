import Bloom from "../passes/Bloom";
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
				minFilter: element.mipmaps ? 'NEAREST_MIPMAP_NEAREST' : 'NEAREST',
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
			textures: this.texturesArray,
			usesDepth: true
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
					internalFormat: 'RGBA16F',
					type: 'FLOAT'
				})
			]
		});

		this.textures.depth = this.framebuffer.depth;

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
		this.renderer.bindFramebuffer(this.bloom.framebuffers.highLuminance);

		this.bloom.materials.brightnessFilter.use();
		this.quad.draw();

		this.bloom.framebuffers.highLuminance.textures[0].generateMipmaps();
		this.bloom.buildDownscaledTextures();

		for(let i = 0; i < this.bloom.passes; i++) {
			this.renderer.bindFramebuffer(this.bloom.downscaledFramebuffersTemp[i]);
			this.bloom.materials.blur.uniforms.tHDR.value = this.bloom.downscaledTextures[i];
			this.bloom.materials.blur.uniforms.direction.value = [1, 0];
			this.bloom.materials.blur.use();
			this.quad.draw();

			this.renderer.bindFramebuffer(this.bloom.downscaledFramebuffers[i]);
			this.bloom.materials.blur.uniforms.tHDR.value = this.bloom.downscaledFramebuffersTemp[i].textures[0];
			this.bloom.materials.blur.uniforms.direction.value = [0, 1];
			this.bloom.materials.blur.use();
			this.quad.draw();
		}

		this.renderer.bindFramebuffer(this.bloom.framebuffers.blurred);
		this.bloom.materials.combine.use();
		this.quad.draw();
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
