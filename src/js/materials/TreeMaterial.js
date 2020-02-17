import shaders from '../Shaders';
import Config from "../Config";

export default class TreeMaterial {
	constructor(renderer) {
		this.material = renderer.createMaterial({
			name: 'tree',
			vertexShader: shaders.tree.vertex,
			fragmentShader: shaders.tree.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelMatrix: {type: 'Matrix4fv', value: null},
				viewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null},
				'tDiffuse[0]': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/tree_beech_diffuse.png', anisotropy: Config.textureAnisotropy})},
				'tDiffuse[1]': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/tree_linden_diffuse.png', anisotropy: Config.textureAnisotropy})},
				'tNormal[0]': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/tree_beech_normal.png', anisotropy: Config.textureAnisotropy})},
				'tNormal[1]': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/tree_linden_normal.png', anisotropy: Config.textureAnisotropy})},
				'tVolumeNormal': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/tree_volume_normal.png', anisotropy: Config.textureAnisotropy})}
			}
		});

		this.materialDepth = renderer.createMaterial({
			name: 'treeDepth',
			vertexShader: shaders.treeDepth.vertex,
			fragmentShader: shaders.treeDepth.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelMatrix: {type: 'Matrix4fv', value: null},
				viewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null},
				'tDiffuse[0]': {type: 'texture', value: renderer.createTexture({url: '/textures/tree/tree_beech_diffuse.png', anisotropy: Config.textureAnisotropy})}
			}
		});
	}
}
