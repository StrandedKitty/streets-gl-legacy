import shaders from '../Shaders';

export default class HDRCompose {
	constructor(renderer, params) {
		this.renderer = renderer;

		this.gBuffer = params.gBuffer;

		this.material = this.renderer.createMaterial({
			name: 'HDR compose',
			vertexShader: shaders.quad.vertex,
			fragmentShader: shaders.quad.fragment,
			uniforms: {
				uColor: {type: 'texture', value: this.gBuffer.textures.color},
				uNormal: {type: 'texture', value: this.gBuffer.textures.normal},
				uPosition: {type: 'texture', value: this.gBuffer.textures.position},
				uMetallicRoughness: {type: 'texture', value: this.gBuffer.textures.metallicRoughness},
				uEmission: {type: 'texture', value: this.gBuffer.textures.emission},
				uAO: {type: 'texture', value: null},
				uVolumetric: {type: 'texture', value: params.volumetricTexture},
				sky: {type: 'textureCube', value: params.skybox.cubeTexture},
				tBRDF: {type: 'texture', value: this.renderer.createTexture({url: '/textures/brdf.png', minFilter: 'LINEAR', wrap: 'clamp'})},
				'uLight.direction': {type: '3fv', value: params.light.direction},
				'uLight.range': {type: '1f', value: params.light.range},
				'uLight.color': {type: '3fv', value: params.light.color},
				'uLight.intensity': {type: '1f', value: params.light.intensity},
				'uLight.position': {type: '3fv', value: params.light.position},
				'uLight.innerConeCos': {type: '1f', value: params.light.innerConeCos},
				'uLight.outerConeCos': {type: '1f', value: params.light.outerConeCos},
				'uLight.type': {type: '1i', value: params.light.type},
				'uLight.padding': {type: '2fv', value: params.light.padding},
				normalMatrix: {type: 'Matrix3fv', value: null},
				cameraMatrixWorld: {type: 'Matrix4fv', value: null},
				cameraMatrixWorldInverse: {type: 'Matrix4fv', value: null},
				ambientIntensity: {type: '1f', value: 0.3},
				sunIntensity: {type: '1f', value: 1.},
				uEmissionFactor: {type: '1f', value: 10},
				fogColor: {type: '3fv', value: new Float32Array([.77, .86, .91])}
			}
		});
	}
}
