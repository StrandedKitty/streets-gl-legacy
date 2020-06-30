import shaders from '../Shaders';
import Pass from "../Pass";

export default class Bloom extends Pass {
	constructor(renderer, width, height, params) {
		super(renderer, width, height);

		this.passes = 4;

		this.framebuffers.highLuminance = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [this.renderer.createTexture({
				width: this.width,
				height: this.height,
				internalFormat: 'RGBA16F',
				format: 'RGBA',
				type: 'HALF_FLOAT',
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp'
			})]
		});

		this.framebuffers.blurredTemp = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [this.renderer.createTexture({
				width: this.width,
				height: this.height,
				internalFormat: 'RGBA16F',
				format: 'RGBA',
				type: 'HALF_FLOAT',
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp'
			})]
		});

		this.framebuffers.blurred = this.renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [this.renderer.createTexture({
				width: this.width,
				height: this.height,
				internalFormat: 'RGBA16F',
				format: 'RGBA',
				type: 'HALF_FLOAT',
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp'
			})]
		});

		this.materials.brightnessFilter = renderer.createMaterial({
			name: 'Brightness filter',
			vertexShader: shaders.brightnessFilter.vertex,
			fragmentShader: shaders.brightnessFilter.fragment,
			uniforms: {
				tHDR: {type: 'texture', value: params.hdrTexture},
				uThreshold: {type: '1f', value: 1}
			}
		});

		this.materials.blur = renderer.createMaterial({
			name: 'Blur',
			vertexShader: shaders.blur.vertex,
			fragmentShader: shaders.blur.fragment,
			uniforms: {
				tHDR: {type: 'texture', value: this.framebuffers.highLuminance.textures[0]},
				resolution: {type: '2fv', value: [width, height]},
				direction: {type: '2fv', value: [1, 0]}
			}
		});

		this.downscaledFramebuffers = new Array(this.passes);
		this.downscaledFramebuffersTemp = new Array(this.passes);
		this.downscaledTextures = new Array(this.passes);

		for(let i = 0; i < this.passes; i++) {
			this.downscaledFramebuffers[i] = this.renderer.createFramebuffer({
				width: Math.floor(this.width / 2 ** (i + 1)),
				height: Math.floor(this.height / 2 ** (i + 1)),
				textures: [this.renderer.createTexture({
					width: Math.floor(this.width / 2 ** (i + 1)),
					height: Math.floor(this.height / 2 ** (i + 1)),
					internalFormat: 'RGBA16F',
					format: 'RGBA',
					type: 'HALF_FLOAT',
					minFilter: 'LINEAR',
					magFilter: 'LINEAR',
					wrap: 'clamp'
				})]
			});

			this.downscaledFramebuffersTemp[i] = this.renderer.createFramebuffer({
				width: Math.floor(this.width / 2 ** (i + 1)),
				height: Math.floor(this.height / 2 ** (i + 1)),
				textures: [renderer.createTexture({
					width: Math.floor(this.width / 2 ** (i + 1)),
					height: Math.floor(this.height / 2 ** (i + 1)),
					internalFormat: 'RGBA16F',
					format: 'RGBA',
					type: 'HALF_FLOAT',
					minFilter: 'LINEAR',
					magFilter: 'LINEAR',
					wrap: 'clamp'
				})]
			});

			this.downscaledTextures[i] = this.downscaledFramebuffers[i].textures[0];
		}

		this.materials.combine = renderer.createMaterial({
			name: 'Blur combine',
			vertexShader: shaders.blurCombine.vertex,
			fragmentShader: shaders.blurCombine.fragment,
			uniforms: {
				'maps[0]': {type: 'texture', value: this.downscaledFramebuffers[0].textures[0]},
				'maps[1]': {type: 'texture', value: this.downscaledFramebuffers[1].textures[0]},
				'maps[2]': {type: 'texture', value: this.downscaledFramebuffers[2].textures[0]},
				'maps[3]': {type: 'texture', value: this.downscaledFramebuffers[3].textures[0]}
			}
		});
	}

	buildDownscaledTextures() {
		for(let i = 0; i < this.passes; i++) {
			const source = i === 0 ? this.framebuffers.highLuminance : this.downscaledFramebuffers[i - 1];

			this.renderer.blitFramebuffer({
				source: source,
				destination: this.downscaledFramebuffers[i],
				destinationWidth: this.downscaledFramebuffers[i].textures[0].width,
				destinationHeight: this.downscaledFramebuffers[i].textures[0].height,
				depth: false,
				filter: 'LINEAR'
			});
		}
	}

	setSize(width, height) {
		super.setSize(width, height);

		for(let i = 0; i < this.passes; i++) {
			this.downscaledFramebuffers[i].setSize(Math.floor(width / 2 ** (i + 1)), Math.floor(height / 2 ** (i + 1)));
			this.downscaledFramebuffersTemp[i].setSize(Math.floor(width / 2 ** (i + 1)), Math.floor(height / 2 ** (i + 1)));
		}
	}
}
