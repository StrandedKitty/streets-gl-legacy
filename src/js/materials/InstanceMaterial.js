import shaders from '../Shaders';
import Config from "../Config";

export default class TreeMaterial {
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
				tDiffuse: {type: 'texture', value: renderer.createTexture({url: '/textures/hydrant/diffuse.png', anisotropy: Config.textureAnisotropy})},
				tNormal: {type: 'texture', value: renderer.createTexture({url: '/textures/hydrant/normal.png', anisotropy: Config.textureAnisotropy})},
			}
		});

		this.materialDepth = renderer.createMaterial({
			name: 'instanceDepth',
			vertexShader: shaders.instanceDepth.vertex,
			fragmentShader: shaders.instanceDepth.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelMatrix: {type: 'Matrix4fv', value: null},
				viewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null}
			}
		});
	}
}
