import {degrees2meters, sphericalToCartesian, tile2meters, tileEncode, toDeg, toRad} from './Utils';
import Config from './Config';
import Frustum from './Frustum';
import Controls from './Controls';
import Tile from './Tile';
import MapWorkerManager from './MapWorkerManager';
import MapMesh from './MapMesh';
import Meshes from './Meshes';
import Renderer from "./renderer/Renderer";
import SceneGraph from "./renderer/SceneGraph";
import PerspectiveCamera from "./renderer/PerspectiveCamera";
import Object3D from "./renderer/Object3D";
import Mesh from "./renderer/Mesh";
import vec3 from "./math/vec3";
import mat4 from "./math/mat4";
import GBuffer from "./renderer/GBuffer";
import shaders from "./Shaders";
import SMAA from "./materials/SMAA";
import SSAO from "./materials/SSAO";
import Blur from "./materials/Blur";
import Skybox from "./Skybox";
import BuildingMaterial from "./materials/BuildingMaterial";
import GroundMaterial from "./materials/GroundMaterial";
import CSM from "./CSM";

const SunCalc = require('suncalc');

let scene,
	camera,
	RP,
	controls,
	workerManager;

let view = {};
let tiles = new Map();
let objects = {
	meshes: new Map()
};
let meshes = {};

let mesh, groundMaterial, groundMaterialDepth, wrapper, buildings, buildingMaterial, buildingDepthMaterial, tileMeshes;
let quad, quadMaterial;

const gui = new dat.GUI();
let time = 0, delta = 0;
let gBuffer, smaa, ssao, blur;
let skybox;
let light;
let lightDirection = new vec3(-1, -1, -1);
let csm;

init();
animate();

function init() {
	RP = new Renderer(canvas);
	RP.setPixelRatio(Config.SSAA);
	RP.setSize(window.innerWidth, window.innerHeight);
	RP.culling = true;

	Config.set('textureAnisotropy', RP.capabilities.maxAnisotropy);
	console.log(RP.rendererInfo);

	scene = new SceneGraph();

	wrapper = new Object3D();
	scene.add(wrapper);

	buildings = new Object3D();
	wrapper.add(buildings);
	tileMeshes = new Object3D();
	wrapper.add(tileMeshes);

	camera = new PerspectiveCamera({
		fov: 40,
		near: 1,
		far: 10000,
		aspect: window.innerWidth / window.innerHeight
	});
	wrapper.add(camera);

	csm = new CSM({
		renderer: RP,
		camera: camera,
		parent: wrapper,
		cascades: 3,
		size: 4096,
		far: 4000
	});

	view.frustum = new Frustum(camera.fov, camera.aspect, 1, Config.drawDistance);
	view.frustum.updateViewSpaceVertices();

	controls = new Controls(camera);

	groundMaterial = new GroundMaterial(RP).material;
	groundMaterialDepth = new GroundMaterial(RP).depthMaterial;

	const sky = RP.createTextureCube({
		urls: [
			'/textures/sky/px.png',
			'/textures/sky/nx.png',
			'/textures/sky/py.png',
			'/textures/sky/ny.png',
			'/textures/sky/pz.png',
			'/textures/sky/nz.png',
		]
	});

	const buildingMaterialInstance = new BuildingMaterial(RP);

	buildingMaterial = buildingMaterialInstance.material;
	buildingDepthMaterial = buildingMaterialInstance.depthMaterial;

	mesh = RP.createMesh({
		vertices: new Float32Array([
			-5, 0, -5,
			0, 0, 5,
			5, 0, -5
		])
	});

	wrapper.add(mesh);
	console.log(scene);

	let position = degrees2meters(49.8969, 36.2894);
	mesh.setPosition(position.x, 0, position.z);

	gBuffer = new GBuffer(RP, window.innerWidth * Config.SSAA, window.innerHeight * Config.SSAA, [
		{
			name: 'color',
			internalFormat: 'RGBA8',
			format: 'RGBA',
			type: 'UNSIGNED_BYTE'
		}, {
			name: 'normal',
			internalFormat: 'RGB8',
			format: 'RGB',
			type: 'UNSIGNED_BYTE'
		}, {
			name: 'position',
			internalFormat: 'RGBA32F',
			format: 'RGBA',
			type: 'FLOAT'
		}, {
			name: 'metallicRoughness',
			internalFormat: 'RGBA8',
			format: 'RGBA',
			type: 'UNSIGNED_BYTE'
		}
	]);

	smaa = new SMAA(RP, window.innerWidth * Config.SSAA, window.innerHeight * Config.SSAA);
	ssao = new SSAO(RP, window.innerWidth * Config.SSAO, window.innerHeight * Config.SSAO);
	blur = new Blur(RP, window.innerWidth, window.innerHeight);

	quad = RP.createMesh({
		vertices: new Float32Array([
			-1, 1, 0,
			-1, -1, 0,
			1, 1, 0,
			-1, -1, 0,
			1, -1, 0,
			1, 1, 0
		])
	});

	quad.addAttribute({
		name: 'uv',
		size: 2,
		type: 'FLOAT',
		normalized: false
	});

	quad.setAttributeData('uv', new Float32Array([
		0, 1,
		0, 0,
		1, 1,
		0, 0,
		1, 0,
		1, 1
	]));

	light = {
		direction: new Float32Array([-1, -1, -1]),
		range: -1,
		color: new Float32Array([1, 1, 1]),
		intensity: 4,
		position: new Float32Array([0, 0, 0]),
		innerConeCos: 1,
		outerConeCos: 0.7071067811865476,
		type: 0,
		padding: new Float32Array([0, 0])
	};

	quadMaterial = RP.createMaterial({
		name: 'quad',
		vertexShader: shaders.quad.vertex,
		fragmentShader: shaders.quad.fragment,
		uniforms: {
			uColor: {type: 'texture', value: gBuffer.textures.color},
			uNormal: {type: 'texture', value: gBuffer.textures.normal},
			uPosition: {type: 'texture', value: gBuffer.textures.position},
			uMetallicRoughness: {type: 'texture', value: gBuffer.textures.metallicRoughness},
			uAO: {type: 'texture', value: null},
			sky: {type: 'textureCube', value: sky},
			tBRDF: {type: 'texture', value: RP.createTexture({url: '/textures/brdf.png', minFilter: 'LINEAR', wrap: 'clamp'})},
			'uLight.direction': {type: '3fv', value: light.direction},
			'uLight.range': {type: '1f', value: light.range},
			'uLight.color': {type: '3fv', value: light.color},
			'uLight.intensity': {type: '1f', value: light.intensity},
			'uLight.position': {type: '3fv', value: light.position},
			'uLight.innerConeCos': {type: '1f', value: light.innerConeCos},
			'uLight.outerConeCos': {type: '1f', value: light.outerConeCos},
			'uLight.type': {type: '1i', value: light.type},
			'uLight.padding': {type: '2fv', value: light.padding},
			normalMatrix: {type: 'Matrix3fv', value: null},
			cameraMatrixWorld: {type: 'Matrix4fv', value: null},
			ambientIntensity: {type: '1f', value: 0.2},
			uExposure: {type: '1f', value: 1.}
		}
	});

	skybox = new Skybox(RP, sky);
	wrapper.add(skybox.mesh);

	workerManager = new MapWorkerManager(navigator.hardwareConcurrency, './js/worker.js');

	gui.add(Config, 'SMAA');
	gui.add(Config, 'SSAO');
	gui.add(Config, 'SSAOBlur');
	gui.add(light, 'intensity');
	gui.add(quadMaterial.uniforms['ambientIntensity'], 'value');

	window.addEventListener('resize', function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		view.frustum.aspect = camera.aspect;
		view.frustum.updateViewSpaceVertices();

		csm.resize();

		RP.setPixelRatio(Config.SSAA);
		RP.setSize(window.innerWidth, window.innerHeight);
		gBuffer.setSize(window.innerWidth * Config.SSAA, window.innerHeight * Config.SSAA);
		smaa.setSize(window.innerWidth * Config.SSAA, window.innerHeight * Config.SSAA);
		ssao.setSize(window.innerWidth * Config.SSAOResolution, window.innerHeight * Config.SSAOResolution);
		blur.setSize(window.innerWidth, window.innerHeight);
	}, false);
}

function animate() {
	requestAnimationFrame(animate);

	const now = performance.now();
	delta = (now - time) / 1e3;
	time = now;

	let gl = RP.gl;

	controls.update(delta);

	wrapper.position.x = -camera.position.x;
	wrapper.position.z = -camera.position.z;

	scene.updateMatrixRecursively();
	scene.updateMatrixWorldRecursively();

	camera.updateMatrixWorldInverse();
	camera.updateFrustum();

	// Directional light

	const cameraLatLon = controls.latLon();
	const sunPosition = SunCalc.getPosition(Date.now(), cameraLatLon.lat, cameraLatLon.lon);
	const sunDirection = sphericalToCartesian(sunPosition.azimuth + Math.PI, sunPosition.altitude);
	const sunIntensity = sunDirection.y < 0 ? 1 : 0;

	csm.direction = sunDirection;
	csm.update(camera.matrix);

	// Shadow mapping

	for(let i = 0; i < csm.lights.length; i++) {
		let rCamera = csm.lights[i].camera;

		rCamera.updateFrustum();

		RP.bindFramebuffer(csm.lights[i].framebuffer);

		RP.depthTest = true;
		RP.depthWrite = true;

		gl.clearColor(100000, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		{
			groundMaterialDepth.uniforms.projectionMatrix = {type: 'Matrix4fv', value: rCamera.projectionMatrix};
			groundMaterialDepth.use();

			for(let i = 0; i < tileMeshes.children.length; i++) {
				let object = tileMeshes.children[i];

				object.data.time += delta;

				if(object instanceof Mesh) {
					const inFrustum = object.inCameraFrustum(rCamera);

					if(inFrustum) {
						let modelViewMatrix = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
						groundMaterialDepth.uniforms.modelViewMatrix.value = modelViewMatrix;
						groundMaterialDepth.updateUniform('modelViewMatrix');

						object.draw(groundMaterialDepth);
					}
				}
			}
		}

		{
			buildingDepthMaterial.uniforms.projectionMatrix = {type: 'Matrix4fv', value: rCamera.projectionMatrix};
			buildingDepthMaterial.use();

			for(let i = 0; i < buildings.children.length; i++) {
				let object = buildings.children[i];

				object.data.tile.time += delta;

				const inFrustum = object.inCameraFrustum(rCamera);

				if(inFrustum) {
					let modelViewMatrix = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
					buildingDepthMaterial.uniforms.modelViewMatrix.value = modelViewMatrix;
					buildingDepthMaterial.updateUniform('modelViewMatrix');

					buildingDepthMaterial.uniforms.time.value = object.data.tile.time;
					buildingDepthMaterial.updateUniform('time');

					object.draw(buildingMaterial);
				}
			}
		}
	}

	// Rendering camera

	let rCamera = camera;

	// Draw to g-buffer

	RP.bindFramebuffer(gBuffer.framebuffer);

	RP.depthTest = true;
	RP.depthWrite = true;

	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	RP.depthWrite = false;

	skybox.render(rCamera);

	RP.depthWrite = true;

	{
		groundMaterial.uniforms.projectionMatrix = {type: 'Matrix4fv', value: rCamera.projectionMatrix};
		groundMaterial.use();

		let noAnimationStreak = 0;

		for(let i = 0; i < tileMeshes.children.length; i++) {
			let object = tileMeshes.children[i];

			//object.data.time += delta;

			if(object instanceof Mesh) {
				const inFrustum = object.inCameraFrustum(rCamera);

				if(inFrustum) {
					let modelViewMatrix = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
					let normalMatrix = mat4.normalMatrix(modelViewMatrix);
					groundMaterial.uniforms.modelViewMatrix.value = modelViewMatrix;
					groundMaterial.uniforms.normalMatrix.value = normalMatrix;
					groundMaterial.updateUniform('modelViewMatrix');
					groundMaterial.updateUniform('normalMatrix');

					if(object.data.time - delta < 1) {
						groundMaterial.uniforms.time = {type: '1f', value: object.data.time};
						groundMaterial.updateUniform('time');
						noAnimationStreak = 0;
					} else {
						if(noAnimationStreak === 0) {
							groundMaterial.uniforms.time = {type: '1f', value: 1};
							groundMaterial.updateUniform('time');
						}

						++noAnimationStreak;
					}

					object.draw(groundMaterial);
				}
			}
		}
	}

	{
		buildingMaterial.uniforms.projectionMatrix.value = rCamera.projectionMatrix;
		buildingMaterial.use();

		let noAnimationStreak = 0;

		for(let i = 0; i < buildings.children.length; i++) {
			let object = buildings.children[i];

			//object.data.tile.time += delta;

			const inFrustum = object.inCameraFrustum(rCamera);

			if(inFrustum) {
				let modelViewMatrix = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
				let normalMatrix = mat4.normalMatrix(modelViewMatrix);
				buildingMaterial.uniforms.modelViewMatrix.value = modelViewMatrix;
				buildingMaterial.uniforms.normalMatrix.value = normalMatrix;
				buildingMaterial.updateUniform('modelViewMatrix');
				buildingMaterial.updateUniform('normalMatrix');

				if(object.data.tile.time - delta < 1) {
					buildingMaterial.uniforms.time.value = object.data.tile.time;
					buildingMaterial.updateUniform('time');
					noAnimationStreak = 0;
				} else {
					if(noAnimationStreak === 0) {
						buildingMaterial.uniforms.time.value = 1;
						buildingMaterial.updateUniform('time');
					}

					++noAnimationStreak;
				}

				object.draw(buildingMaterial);
			}
		}
	}

	RP.depthWrite = false;
	RP.depthTest = false;

	// SSAO

	if(Config.SSAO) {
		RP.bindFramebuffer(ssao.framebuffer);

		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		ssao.material.uniforms.tPosition.value = gBuffer.textures.position;
		ssao.material.uniforms.tNormal.value = gBuffer.textures.normal;
		ssao.material.uniforms.cameraProjectionMatrix.value = rCamera.projectionMatrix;
		ssao.material.use();
		quad.draw(ssao.material);

		// Blur

		RP.bindFramebuffer(blur.framebufferTemp);

		blur.material.uniforms.tColor.value = ssao.framebuffer.textures[0];
		blur.material.uniforms.tDepth.value = gBuffer.framebuffer.depth;
		blur.material.uniforms.direction.value = [0, 1];
		blur.material.use();
		quad.draw(blur.material);

		RP.bindFramebuffer(blur.framebuffer);

		blur.material.uniforms.tColor.value = blur.framebufferTemp.textures[0];
		blur.material.uniforms.tDepth.value = gBuffer.framebuffer.depth;
		blur.material.uniforms.direction.value = [1, 0];
		blur.material.use();
		quad.draw(blur.material);
	} else {
		RP.bindFramebuffer(blur.framebuffer);

		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		RP.bindFramebuffer(ssao.framebuffer);

		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	// Combine g-buffer textures

	RP.bindFramebuffer(Config.SMAA ? gBuffer.framebufferFinal : null);

	RP.depthWrite = false;
	RP.depthTest = false;

	csm.updateUniforms(quadMaterial);
	quadMaterial.uniforms['uLight.direction'].value = new Float32Array(vec3.toArray(sunDirection));
	quadMaterial.uniforms['uLight.intensity'].value = light.intensity * sunIntensity;
	quadMaterial.uniforms.uAO.value = Config.SSAOBlur ? blur.framebuffer.textures[0] : ssao.framebuffer.textures[0];
	quadMaterial.uniforms.normalMatrix.value = mat4.normalMatrix(rCamera.matrixWorld);
	quadMaterial.uniforms.cameraMatrixWorld.value = rCamera.matrixWorld;
	quadMaterial.use();
	quad.draw(quadMaterial);

	// SMAA

	if(Config.SMAA) {
		RP.bindFramebuffer(smaa.edgesFB);

		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		smaa.materials.edges.uniforms.tDiffuse.value = gBuffer.framebufferFinal.textures[0];
		smaa.materials.edges.use();
		quad.draw(smaa.materials.edges);

		RP.bindFramebuffer(smaa.weightsFB);

		smaa.materials.weights.use();
		quad.draw(smaa.materials.weights);

		RP.bindFramebuffer(null);

		smaa.materials.blend.uniforms.tColor.value = gBuffer.framebufferFinal.textures[0];
		smaa.materials.blend.use();
		quad.draw(smaa.materials.blend);
	}

	//

	let wsFrustum = view.frustum.toSpace(camera.matrix);
	let frustumTiles = wsFrustum.getTiles(camera.position, 16);

	for(let i = 0; i < frustumTiles.length; i++) {
		let frustumTile = frustumTiles[i];

		frustumTile.x = Math.floor(frustumTile.x);
		frustumTile.y = Math.floor(frustumTile.y);

		const name = tileEncode(frustumTile.x, frustumTile.y);
		const worker = workerManager.getFreeWorker();

		if(!tiles.get(name) && worker) {
			let tile = new Tile(frustumTile.x, frustumTile.y, function (data) {
				const vertices = new Float32Array(data.vertices);
				const normals = new Float32Array(data.normals);
				const uvs = new Float32Array(data.uvs);
				const ids = data.ids;
				const offsets = data.offsets;
				const colors = new Uint8Array(data.colors);
				const textures = new Float32Array(data.textures);
				const instances = data.instances;
				const bbox = {min: data.bboxMin, max: data.bboxMax};

				let mesh = RP.createMesh({
					vertices: vertices
				});

				mesh.addAttribute({
					name: 'color',
					size: 3,
					type: 'UNSIGNED_BYTE',
					normalized: true
				});
				mesh.setAttributeData('color', colors);

				mesh.addAttribute({
					name: 'normal',
					size: 3,
					type: 'FLOAT',
					normalized: false
				});
				mesh.setAttributeData('normal', normals);

				mesh.addAttribute({
					name: 'uv',
					size: 2,
					type: 'FLOAT',
					normalized: false
				});
				mesh.setAttributeData('uv', uvs);

				mesh.addAttribute({
					name: 'textureId',
					size: 1,
					type: 'FLOAT',
					normalized: false
				});
				mesh.setAttributeData('textureId', textures);

				mesh.addAttribute({
					name: 'display',
					size: 1,
					type: 'UNSIGNED_BYTE',
					normalized: true
				});
				mesh.setAttributeData('display', this.displayBuffer);

				mesh.addAttribute({
					name: 'fade',
					size: 1,
					type: 'UNSIGNED_BYTE',
					normalized: true
				});
				mesh.setAttributeData('fade', this.fadeBuffer);

				const pivot = tile2meters(this.x, this.y + 1);
				mesh.setPosition(pivot.x, 0, pivot.z);

				mesh.data.tile = this;

				buildings.add(mesh);

				mesh.setBoundingBox(
					{x: bbox.min[0], y: bbox.min[1], z: bbox.min[2]},
					{x: bbox.max[0], y: bbox.max[1], z: bbox.max[2]}
				);

				this.mesh = mesh;

				for(let i = 0; i < ids.length; i++) {
					const id = ids[i];

					if(objects.meshes.get(id)) {
						const object = objects.meshes.get(id);

						object.setNewParent({
							tile: this
						});
					} else {
						const object = new MapMesh({
							id: id,
							tile: this
						});

						objects.meshes.set(id, object);

						tile.animate(id);
					}
				}
			}, function () {
				if(!tile.mesh.inCameraFrustum(camera)) {
					tiles.delete(this.id);

					for(const id in this.objects) {
						let object = objects.meshes.get(parseInt(id));

						if(object) {
							object.removeParent(this);
							if(object.holder === null) objects.meshes.delete(parseInt(id));
						}
					}

					return true;
				} else {
					return false;
				}
			});

			tiles.set(name, tile);

			let ground = tile.getGroundMesh(RP);
			tileMeshes.add(ground);

			tile.load(worker);

			const deleteCount = tiles.size - Config.maxTiles;

			const arr = Array.from(tiles.keys());
			for(let i = 0; i < deleteCount; i++) {
				const id = arr[i];
				const tile = tiles.get(id);
				if(tile.loaded) {
					tile.delete();
				}
			}
		}
	}
}

export {scene};
