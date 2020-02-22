import shaders from '../Shaders';
import Config from "../Config";

export default class RoadMaterial {
	constructor(renderer) {
		this.renderer = renderer;

		this.material = renderer.createMaterial({
			name: 'roads',
			vertexShader: shaders.road.vertex,
			fragmentShader: shaders.road.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null}
			}
		});

		this.depthMaterial = renderer.createMaterial({
			name: 'roadsDepth',
			vertexShader: shaders.roadDepth.vertex,
			fragmentShader: shaders.roadDepth.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null}
			}
		});
	}
}
