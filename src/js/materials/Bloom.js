import shaders from '../Shaders';

export default class Bloom {
	constructor(renderer, width, height, params) {
		this.width = width;
		this.height = height;

		this.highLuminanceFramebuffer = renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [renderer.createTexture({
				width: this.width,
				height: this.height,
				internalFormat: 'RGBA32F',
				format: 'RGBA',
				type: 'FLOAT',
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
				internalFormat: 'RGBA32F',
				format: 'RGBA',
				type: 'FLOAT',
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
				internalFormat: 'RGBA32F',
				format: 'RGBA',
				type: 'FLOAT',
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
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;

		this.highLuminanceFramebuffer.setSize(width, height);
		this.blurredFramebuffer.setSize(width, height);
		this.blurredFramebufferTemp.setSize(width, height);

		this.blurMaterial.uniforms.resolution.value = [width, height];
	}
}
