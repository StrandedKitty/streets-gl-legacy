import shaders from '../Shaders';

export default class LDRCompose {
	constructor(renderer, params) {
		this.renderer = renderer;

		this.material = this.renderer.createMaterial({
			name: 'LDR compose',
			vertexShader: shaders.ldrCompose.vertex,
			fragmentShader: shaders.ldrCompose.fragment,
			uniforms: {
				tHDR: {type: 'texture', value: params.gBuffer.framebufferHDR.textures[0]},
				tBloom: {type: 'texture', value: params.gBuffer.bloom.blurredFramebuffer.textures[0]},
				uExposure: {type: '1f', value: 1.},
				uBloomStrength: {type: '1f', value: 0.5},
			}
		});
	}
}
