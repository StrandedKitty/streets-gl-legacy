import shaders from '../Shaders';
import Pass from "../Pass";

export default class BilateralBlur extends Pass {
	constructor(renderer, width, height) {
		super(renderer, width, height);

		this.framebuffers.temp = this.renderer.createFramebuffer({
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

		this.materials.main = renderer.createMaterial({
			name: 'Bilateral blur',
			vertexShader: shaders.bilateralBlur.vertex,
			fragmentShader: shaders.bilateralBlur.fragment,
			uniforms: {
				samplerOffsets: {type: '1fv', value: [-15.5, -13.5, -11.5, -9.5, -7.5, -5.5, -3.5, -1.5, 0.5, 2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5]},
				direction: {type: '2fv', value: [1, 0]},
				texelSize: {type: '1f', value: 0.23},
				resolution: {type: '2fv', value: [this.width, this.height]},
				tColor: {type: 'texture', value: null},
				tDepth: {type: 'texture', value: null},
			}
		});
	}
}
