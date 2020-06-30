import shaders from '../Shaders';
import {clamp} from "../Utils";
import Pass from "../Pass";

export default class HDRCompose extends Pass {
	constructor(renderer, {
		gBuffer,
		skybox,
		volumetricTexture,
		cloudsTexture,
		light
	}) {
		super(renderer, gBuffer.width, gBuffer.height);

		this.gBuffer = gBuffer;

		this.materials.main = this.renderer.createMaterial({
			name: 'HDR compose',
			vertexShader: shaders.quad.vertex,
			fragmentShader: shaders.quad.fragment,
			uniforms: {
				uColor: {type: 'texture', value: this.gBuffer.textures.color},
				uDepth: {type: 'texture', value: this.gBuffer.textures.depth},
				uNormal: {type: 'texture', value: this.gBuffer.textures.normal},
				uPosition: {type: 'texture', value: this.gBuffer.textures.position},
				uMetallicRoughness: {type: 'texture', value: this.gBuffer.textures.metallicRoughness},
				uEmission: {type: 'texture', value: this.gBuffer.textures.emission},
				uAO: {type: 'texture', value: null},
				uVolumetric: {type: 'texture', value: volumetricTexture},
				sky: {type: 'textureCube', value: skybox.cubeTexture},
				tBRDF: {type: 'texture', value: this.renderer.createTexture({url: '/textures/brdf.png', minFilter: 'LINEAR', wrap: 'clamp'})},
				'uLight.direction': {type: '3fv', value: light.direction},
				'uLight.range': {type: '1f', value: light.range},
				'uLight.color': {type: '3fv', value: light.color},
				'uLight.intensity': {type: '1f', value: light.intensity},
				'uLight.position': {type: '3fv', value: light.position},
				'uLight.innerConeCos': {type: '1f', value: light.innerConeCos},
				'uLight.outerConeCos': {type: '1f', value: light.outerConeCos},
				'uLight.type': {type: '1i', value: light.type},
				'uLight.padding': {type: '2fv', value: light.padding},
				normalMatrix: {type: 'Matrix3fv', value: null},
				cameraMatrixWorld: {type: 'Matrix4fv', value: null},
				cameraMatrixWorldInverse: {type: 'Matrix4fv', value: null},
				ambientIntensity: {type: '1f', value: 0.3},
				sunIntensity: {type: '1f', value: 1.},
				uEmissionFactor: {type: '1f', value: 30},
				fogColor: {type: '3fv', value: new Float32Array([.77, .86, .91])},
				uClouds: {type: 'texture', value: cloudsTexture},
				shadowMapping: {type: '1i', value: 0}
			}
		});
	}
}
