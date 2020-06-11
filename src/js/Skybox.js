import shaders from "./Shaders";
import mat4 from "./math/mat4";

export default class Skybox {
	constructor(renderer, textureCube) {
		this.renderer = renderer;

		const vertices = new Float32Array([
			-1.0, -1.0, -1.0,
			-1.0, -1.0, 1.0,
			-1.0, 1.0, 1.0,
			1.0, 1.0, -1.0,
			-1.0, -1.0, -1.0,
			-1.0, 1.0, -1.0,
			1.0, -1.0, 1.0,
			-1.0, -1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, 1.0, -1.0,
			1.0, -1.0, -1.0,
			-1.0, -1.0, -1.0,
			-1.0, -1.0, -1.0,
			-1.0, 1.0, 1.0,
			-1.0, 1.0, -1.0,
			1.0, -1.0, 1.0,
			-1.0, -1.0, 1.0,
			-1.0, -1.0, -1.0,
			-1.0, 1.0, 1.0,
			-1.0, -1.0, 1.0,
			1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			1.0, -1.0, -1.0,
			1.0, 1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, 1.0, 1.0,
			1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			1.0, 1.0, -1.0,
			-1.0, 1.0, -1.0,
			1.0, 1.0, 1.0,
			-1.0, 1.0, -1.0,
			-1.0, 1.0, 1.0,
			1.0, 1.0, 1.0,
			-1.0, 1.0, 1.0,
			1.0, -1.0, 1.0
		]);

		this.cubeTexture = renderer.createTextureCube({
			urls: [
				'/textures/sky/px.png',
				'/textures/sky/nx.png',
				'/textures/sky/py.png',
				'/textures/sky/ny.png',
				'/textures/sky/pz.png',
				'/textures/sky/nz.png',
			]
		});

		this.material = renderer.createMaterial({
			name: 'skybox',
			vertexShader: shaders.skybox.vertex,
			fragmentShader: shaders.skybox.fragment,
			uniforms: {
				tCube: {type: 'textureCube', value: this.cubeTexture},
				modelViewMatrix: {type: 'Matrix4fv', value: null},
				modelViewMatrixPrev: {type: 'Matrix4fv', value: null},
				projectionMatrix: {type: 'Matrix4fv', value: null}
			}
		});

		this.mesh = renderer.createMesh({
			vertices: vertices
		});
	}

	render(camera, matrixWorldInversePrev) {
		this.renderer.culling = false;
		this.mesh.setPosition(camera.position.x, camera.position.y, camera.position.z);
		this.mesh.updateMatrix();
		this.mesh.updateMatrixWorld();
		this.material.uniforms.modelViewMatrix.value = mat4.multiply(camera.matrixWorldInverse, this.mesh.matrixWorld);
		this.material.uniforms.modelViewMatrixPrev.value = mat4.multiply(matrixWorldInversePrev || camera.matrixWorldInverse, this.mesh.matrixWorld);
		this.material.uniforms.projectionMatrix.value = camera.projectionMatrix;
		this.material.use();
		this.mesh.draw();
		this.renderer.culling = true;
	}
}
