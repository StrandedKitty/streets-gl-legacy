import shaders from '../Shaders';

export default class VolumetricLighting {
	constructor(renderer, width, height) {
		this.width = width;
		this.height = height;

		this.framebuffer = renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [renderer.createTexture({
				width: this.width,
				height: this.height,
				internalFormat: 'RGBA',
				format: 'RGBA',
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp'
			})]
		});

		this.framebufferBlurred = renderer.createFramebuffer({
			width: this.width,
			height: this.height,
			textures: [renderer.createTexture({
				width: this.width,
				height: this.height,
				internalFormat: 'RGBA',
				format: 'RGBA',
				minFilter: 'LINEAR',
				magFilter: 'LINEAR',
				wrap: 'clamp'
			})]
		});

		this.material = renderer.createMaterial({
			name: 'Volumetric Lighting',
			vertexShader: shaders.volumetricLighting.vertex,
			fragmentShader: shaders.volumetricLighting.fragment,
			uniforms: {
				uPosition: {type: 'texture', value: null},
				cameraMatrixWorld: {type: 'Matrix4fv', value: null},
				cameraMatrixWorldInverse: {type: 'Matrix4fv', value: null},
				lightDirection: {type: '3fv', value: null},
				asymmetryFactor: {type: '1f', value: 0.2}
			}
		});

		this.texture = this.framebuffer.textures[0];
		this.blurredTexture = this.framebufferBlurred.textures[0];
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;

		this.framebuffer.setSize(width, height);
		this.framebufferBlurred.setSize(width, height);
	}
}
