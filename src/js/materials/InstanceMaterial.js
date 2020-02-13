import shaders from '../Shaders';
import Config from "../Config";

export default class InstanceMaterial {
	constructor(renderer) {
		this.material = renderer.createMaterial({
			name: 'instance',
			vertexShader: shaders.instance.vertex,
			fragmentShader: shaders.instance.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelMatrix: {type: 'Matrix4fv', value: null},
				viewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null},
				'tDiffuse[0]': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/bark.png', anisotropy: Config.textureAnisotropy})},
				'tDiffuse[1]': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/maple.png', anisotropy: Config.textureAnisotropy})}
			}
		});

		this.depthMaterial = renderer.createMaterial({
			name: 'instanceDepth',
			vertexShader: shaders.instanceDepth.vertex,
			fragmentShader: shaders.instanceDepth.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelMatrix: {type: 'Matrix4fv', value: null},
				viewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null},
				'tDiffuse[0]': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/bark.png', anisotropy: Config.textureAnisotropy})},
				'tDiffuse[1]': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/maple.png', anisotropy: Config.textureAnisotropy})}
			}
		});
	}
}
