export default class FullScreenQuad {
	constructor(params) {
		this.renderer = params.renderer;

		this.mesh = this.renderer.createMesh({
			vertices: new Float32Array([
				-1, 1, 0,
				-1, -1, 0,
				1, 1, 0,
				-1, -1, 0,
				1, -1, 0,
				1, 1, 0
			])
		});

		this.mesh.addAttribute({
			name: 'uv',
			size: 2,
			type: 'FLOAT',
			normalized: false
		});

		this.mesh.setAttributeData('uv', new Float32Array([
			0, 1,
			0, 0,
			1, 1,
			0, 0,
			1, 0,
			1, 1
		]));
	}
}
