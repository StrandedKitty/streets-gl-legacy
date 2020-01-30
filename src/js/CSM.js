import vec3 from "./math/vec3";
import Frustum from "./Frustum";
import AABB from "./AABB";

export default class CSM {
	constructor(params) {
		this.renderer = params.renderer;

		this.camera = params.camera;
		this.parent = params.parent;

		this.near = params.near || this.camera.near;
		this.far = params.far || this.camera.far;

		this.cascades = params.cascades;
		this.size = params.size || 2048;
		this.bias = params.bias || 0;
		this.direction = new vec3(-1, -1, -1);
		this.bias = [-1, -3, -8];

		this.lights = [];
		this.materials = [];

		this.createLights();
		this.createFrustums();
	}

	createLights() {
		for(let i = 0; i < this.cascades; i++) {
			const light = this.renderer.createDirectionalLight({
				resolution: this.size,
				near: 1,
				far: 10000
			});

			this.parent.add(light);
			this.lights.push(light);
		}
	}

	createFrustums() {
		this.mainFrustum = new Frustum(this.camera.fov, this.camera.aspect, this.near, this.far);

		this.mainFrustum.updateViewSpaceVertices();

		this.getBreaks();
		this.frustums = this.mainFrustum.split(this.breaks);
	}

	getBreaks() {
		this.breaks = practicalSplit(this.cascades, this.near, this.far, 0.5);

		function uniformSplit(amount, near, far) {
			const r = [];

			for(let i = 1; i < amount; i++) {
				r.push((near + (far - near) * i / amount) / far);
			}

			r.push(1);
			return r;
		}

		function logarithmicSplit(amount, near, far) {
			const r = [];

			for(let i = 1; i < amount; i++) {
				r.push((near * (far / near) ** (i / amount)) / far);
			}

			r.push(1);
			return r;
		}

		function practicalSplit(amount, near, far, lambda) {
			const log = logarithmicSplit(amount, near, far);
			const uni = uniformSplit(amount, near, far);
			const r = [];

			for(let i = 1; i < amount; i++) {
				r.push(lambda * log[i - 1] + (1 - lambda) * uni[i - 1]);
			}

			r.push(1);
			return r;
		}
	}

	update(cameraMatrixWorld) {
		for(let i = 0; i < this.frustums.length; i++) {
			const worldSpaceFrustum = this.frustums[i].toSpace(cameraMatrixWorld);

			const light = this.lights[i];
			const lightSpaceFrustum = worldSpaceFrustum.toSpace(light.camera.matrixWorldInverse);

			const bbox = new AABB().fromFrustum(lightSpaceFrustum);

			const bboxDims = bbox.getSize();
			let bboxCenter = bbox.getCenter();

			const squaredBBWidth = Math.max(bboxDims.x, bboxDims.y);

			bboxCenter = vec3.applyMatrix(bboxCenter, light.camera.matrixWorld);

			light.camera.left = -squaredBBWidth / 2;
			light.camera.right = squaredBBWidth / 2;
			light.camera.top = squaredBBWidth / 2;
			light.camera.bottom = -squaredBBWidth / 2;

			light.camera.updateProjectionMatrix();

			light.setPosition(bboxCenter.x, bboxCenter.y, bboxCenter.z);

			const target = vec3.add(bboxCenter, this.direction);
			light.lookAt(target);

			light.updateMatrixWorld();
			light.camera.updateMatrixWorld();
			light.camera.updateMatrixWorldInverse();
		}
	}

	resize() {
		this.createFrustums();
	}

	getUniformBreaks() {
		let res = [this.near];

		for(let i = 0; i < this.breaks.length; i++) {
			res.push(this.breaks[i] * (this.far - this.near) + this.near)
		}

		return res;
	}

	updateUniforms(material) {
		for(let i = 0; i < this.cascades; i++) {
			material.uniforms['cascades[' + i + '].shadowMap'] = {type: 'texture', value: this.lights[i].texture};
			material.uniforms['cascades[' + i + '].matrixWorldInverse'] = {type: 'Matrix4fv', value: this.lights[i].camera.matrixWorldInverse};
			material.uniforms['cascades[' + i + '].resolution'] = {type: '1f', value: this.lights[i].resolution};
			material.uniforms['cascades[' + i + '].size'] = {type: '1f', value: this.lights[i].camera.right};
			material.uniforms['cascades[' + i + '].bias'] = {type: '1f', value: this.bias[i]};
			material.uniforms['shadowSplits'] = {type: '1fv', value: new Float32Array(this.getUniformBreaks())};
		}
	}
}
