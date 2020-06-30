import shaders from '../Shaders';
import Pass from "../Pass";

export default class VolumetricLighting extends Pass {
	constructor(renderer, width, height) {
		super(renderer, width, height);

		this.framebuffers.main = renderer.createFramebuffer({
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

		this.framebuffers.blurred = renderer.createFramebuffer({
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

		this.materials.main = renderer.createMaterial({
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

		this.texture = this.framebuffers.main.textures[0];
		this.blurredTexture = this.framebuffers.blurred.textures[0];
	}
}
