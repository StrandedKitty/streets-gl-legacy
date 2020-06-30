import shaders from '../Shaders';
import Config from "../Config";
import MaterialGroup from "../MaterialGroup";

export default class RoadMaterial extends MaterialGroup {
	constructor(renderer) {
		super(renderer);

		this.default = renderer.createMaterial({
			name: 'water',
			vertexShader: shaders.water.vertex,
			fragmentShader: shaders.water.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrixPrev: {type: 'Matrix4fv', value: null},
				tNormal: {type: 'texture', value: this.renderer.createTexture({url: '/textures/water_normal.jpg', anisotropy: Config.textureAnisotropy})},
				time: {type: '1f', value: 0}
			}
		});
	}
}
