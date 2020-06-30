import shaders from '../Shaders';
import MaterialGroup from "../MaterialGroup";

export default class RoadMaterial extends MaterialGroup {
	constructor(renderer) {
		super(renderer);

		this.default = renderer.createMaterial({
			name: 'roads',
			vertexShader: shaders.road.vertex,
			fragmentShader: shaders.road.fragment,
			uniforms: {
				projectionMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrixPrev: {type: 'Matrix4fv', value: null}
			}
		});

		this.depth = renderer.createMaterial({
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
