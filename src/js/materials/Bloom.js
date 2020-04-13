import shaders from '../Shaders';

export default class Bloom {
	constructor(renderer, width, height, params) {
		this.width = width;
		this.height = height;
		this.renderer = renderer;
		this.passes = 4;

		this.highLuminanceFramebuffer = renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [renderer.createTexture({
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

		this.blurredFramebufferTemp = renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [renderer.createTexture({
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

		this.blurredFramebuffer = renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [renderer.createTexture({
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

		this.brightnessFilterMaterial = renderer.createMaterial({
			name: 'Brightness filter',
			vertexShader: shaders.brightnessFilter.vertex,
			fragmentShader: shaders.brightnessFilter.fragment,
			uniforms: {
				tHDR: {type: 'texture', value: params.hdrTexture},
				uThreshold: {type: '1f', value: 1}
			}
		});

		this.blurMaterial = renderer.createMaterial({
			name: 'Blur',
			vertexShader: shaders.blur.vertex,
			fragmentShader: shaders.blur.fragment,
			uniforms: {
				tHDR: {type: 'texture', value: this.highLuminanceFramebuffer.textures[0]},
				resolution: {type: '2fv', value: [width, height]},
				direction: {type: '2fv', value: [1, 0]}
			}
		});

		this.downscaledFramebuffers = new Array(this.passes);
		this.downscaledFramebuffersTemp = new Array(this.passes);
		this.downscaledTextures = new Array(this.passes);

		for(let i = 0; i < this.passes; i++) {
			this.downscaledFramebuffers[i] = renderer.createFramebuffer({
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

			this.downscaledFramebuffersTemp[i] = renderer.createFramebuffer({
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

		this.blurCombineMaterial = renderer.createMaterial({
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
			const source = i === 0 ? this.highLuminanceFramebuffer : this.downscaledFramebuffers[i - 1];

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

	blurTextures() {

	}

	setSize(width, height) {
		this.width = width;
		this.height = height;

		this.highLuminanceFramebuffer.setSize(width, height);
		this.blurredFramebuffer.setSize(width, height);
		this.blurredFramebufferTemp.setSize(width, height);

		for(let i = 0; i < this.passes; i++) {
			this.downscaledFramebuffers[i].setSize(Math.floor(width / 2 ** (i + 1)), Math.floor(height / 2 ** (i + 1)));
			this.downscaledFramebuffersTemp[i].setSize(Math.floor(width / 2 ** (i + 1)), Math.floor(height / 2 ** (i + 1)));
		}

		this.blurMaterial.uniforms.resolution.value = [width, height];
	}
}
