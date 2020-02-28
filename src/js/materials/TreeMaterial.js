import shaders from '../Shaders';
import Config from "../Config";

export default class TreeMaterial {
	constructor(renderer) {
		this.renderer = renderer;

		this.texturesNumber = 2;

		this.textureArrays = {
			color: null,
			normal: null
		};

		this.loadTextures();

		this.material = renderer.createMaterial({
			name: 'tree',
			vertexShader: shaders.tree.vertex,
			fragmentShader: shaders.tree.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelMatrix: {type: 'Matrix4fv', value: null},
				viewMatrix: {type: 'Matrix4fv', value: null},
				normalMatrix: {type: 'Matrix3fv', value: null},
				'tDiffuse': {type: 'texture2DArray', value: this.textureArrays.color},
				'tNormal': {type: 'texture2DArray', value: this.textureArrays.normal},
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
				'tDiffuse': {type: 'texture2DArray', value: this.textureArrays.color}
			}
		});
	}

	loadTextures() {
		this.textureArrays = {
			color: this.renderer.createTexture2DArray({
				url: '/textures/tree/diffuse.png',
				depth: this.texturesNumber,
				anisotropy: Config.textureAnisotropy
			}),
			normal: this.renderer.createTexture2DArray({
				url: '/textures/tree/normal.png',
				depth: this.texturesNumber,
				anisotropy: Config.textureAnisotropy
			})
		};
	}
}
