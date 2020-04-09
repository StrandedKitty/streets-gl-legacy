import {clamp, degrees2meters, sphericalToCartesian, tile2meters, tileEncode, toDeg, toRad} from './Utils';
import Config from './Config';
import Frustum from './Frustum';
import Controls from './Controls';
import Tile from './Tile';
import MapWorkerManager from './worker/MapWorkerManager';
import MapMesh from './MapMesh';
import Renderer from "./renderer/Renderer";
import SceneGraph from "./core/SceneGraph";
import PerspectiveCamera from "./renderer/PerspectiveCamera";
import Object3D from "./core/Object3D";
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
import TreeMaterial from "./materials/TreeMaterial";
import Models from "./Models";
import SSAA from "./SSAA";
import VolumetricLighting from "./materials/VolumetricLighting";
import BatchInstanced from "./BatchInstanced";
import Shapes from "./Shapes";
import InstanceMaterial from "./materials/InstanceMaterial";
import FullScreenQuad from "./FullScreenQuad";
import RoadMaterial from "./materials/RoadMaterial";

const SunCalc = require('suncalc');

let scene,
	camera,
	RP,
	controls,
	workerManager;

let view = {};
let tiles = new Map();

const tileSize = 40075016.7 / (1 << 16);

const features = {
	ways: new Map()
};

let ground;
let groundMaterial, groundMaterialDepth, wrapper, buildings, roads, instanceMeshes;
let buildingMaterial, buildingDepthMaterial;
let roadMaterial, roadDepthMaterial;
let quad, quadMaterial;

const gui = new dat.GUI();
let time = 0, delta = 0;
let gBuffer, smaa, ssao, blur, ssaa, volumetricLighting;
let skybox;
let light;
let lightDirection = new vec3(-1, -1, -1);
let csm;

const debugSettings = {
	timeOffset: 0
};

let batchesInstanced = {
	trees: null,
	hydrants: null
};

Models.onload = function () {
	init();
};

function init() {
	Config.set('pixelRatio', window.devicePixelRatio, true);

	RP = new Renderer(canvas);
	RP.setSize(window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
	RP.culling = true;

	Config.set('textureAnisotropy', RP.capabilities.maxAnisotropy);
	console.log(RP.rendererInfo);

	scene = new SceneGraph();

	wrapper = new Object3D();
	scene.add(wrapper);

	buildings = new Object3D();
	wrapper.add(buildings);
	roads = new Object3D();
	wrapper.add(roads);
	instanceMeshes = new Object3D();
	wrapper.add(instanceMeshes);

	camera = new PerspectiveCamera({
		fov: 40,
		near: 1,
		far: 15000,
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

	const groundMaterialInstance = new GroundMaterial(RP);
	groundMaterial = groundMaterialInstance.material;
	groundMaterialDepth = groundMaterialInstance.depthMaterial;

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

	const roadMaterialInstance = new RoadMaterial(RP);
	roadMaterial = roadMaterialInstance.material;
	roadDepthMaterial = roadMaterialInstance.depthMaterial;

	console.log(scene);

	const groundShape = new Shapes.planeSubdivided(tileSize * 64, tileSize * 64, 32, 32);

	ground = RP.createMesh({
		vertices: groundShape.vertices
	});

	ground.addAttribute({
		name: 'uv',
		size: 2,
		type: 'FLOAT'
	});
	ground.setAttributeData('uv', groundShape.uv);

	wrapper.add(ground);

	batchesInstanced.trees = new BatchInstanced(RP, {
		material: new TreeMaterial(RP),
		attributes: Models.Tree.mesh.attributes
	});
	wrapper.add(batchesInstanced.trees.mesh);

	batchesInstanced.hydrants = new BatchInstanced(RP, {
		material: new InstanceMaterial(RP),
		attributes: Models.Hydrant.mesh.attributes
	});
	wrapper.add(batchesInstanced.hydrants.mesh);

	gBuffer = new GBuffer(RP, window.innerWidth * Config.SSAA * Config.pixelRatio, window.innerHeight * Config.SSAA * Config.pixelRatio, [
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

	smaa = new SMAA(RP, window.innerWidth * Config.SSAA * Config.pixelRatio, window.innerHeight * Config.SSAA * Config.pixelRatio);
	ssao = new SSAO(RP, window.innerWidth * Config.SSAOResolution * Config.pixelRatio, window.innerHeight * Config.SSAOResolution * Config.pixelRatio);
	blur = new Blur(RP, window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
	ssaa = new SSAA(RP, window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
	volumetricLighting = new VolumetricLighting(RP, window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);

	light = {
		direction: new Float32Array([-1, -1, -1]),
		range: -1,
		color: new Float32Array([1, 1, 1]),
		intensity: 5,
		position: new Float32Array([0, 0, 0]),
		innerConeCos: 1,
		outerConeCos: 0.7071067811865476,
		type: 0,
		padding: new Float32Array([0, 0])
	};

	quad = new FullScreenQuad({renderer: RP}).mesh;

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
			uVolumetric: {type: 'texture', value: volumetricLighting.blurredTexture},
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
			cameraMatrixWorldInverse: {type: 'Matrix4fv', value: null},
			ambientIntensity: {type: '1f', value: 0.3},
			uExposure: {type: '1f', value: 1.}
		}
	});

	skybox = new Skybox(RP, sky);
	wrapper.add(skybox.mesh);

	workerManager = new MapWorkerManager(navigator.hardwareConcurrency, './js/worker.js');

	gui.add(Config, 'SMAA');
	gui.add(Config, 'SSAO');
	gui.add(Config, 'SSAOBlur');
	gui.add(Config, 'volumetricLighting');
	gui.add(light, 'intensity');
	gui.add(quadMaterial.uniforms.ambientIntensity, 'value');
	gui.add(debugSettings, 'timeOffset', -4e4, 4e4);

	window.addEventListener('resize', function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		view.frustum.aspect = camera.aspect;
		view.frustum.updateViewSpaceVertices();

		csm.resize();

		Config.set('pixelRatio', window.devicePixelRatio, true);

		RP.setSize(window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
		gBuffer.setSize(window.innerWidth * Config.SSAA * Config.pixelRatio, window.innerHeight * Config.SSAA * Config.pixelRatio);
		smaa.setSize(window.innerWidth * Config.SSAA * Config.pixelRatio, window.innerHeight * Config.SSAA * Config.pixelRatio);
		ssao.setSize(window.innerWidth * Config.SSAOResolution * Config.pixelRatio, window.innerHeight * Config.SSAOResolution * Config.pixelRatio);
		blur.setSize(window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
		ssaa.setSize(window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
		volumetricLighting.setSize(window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
	}, false);

	animate();
}

function animate(rafTime) {
	requestAnimationFrame(animate);

	const now = rafTime || 0;
	delta = (now - time) / 1e3;
	time = now;

	let gl = RP.gl;

	controls.update(delta);

	wrapper.position.x = -camera.position.x;
	wrapper.position.z = -camera.position.z;

	ground.setPosition(camera.position.x - camera.position.x % tileSize, 0, camera.position.z - camera.position.z % tileSize);

	scene.updateMatrixRecursively();
	scene.updateMatrixWorldRecursively();

	camera.updateMatrixWorldInverse();
	camera.updateFrustum();

	// Directional light

	const cameraLatLon = controls.latLon();
	const sunPosition = SunCalc.getPosition(Date.now() + 1e3 * debugSettings.timeOffset, cameraLatLon.lat, cameraLatLon.lon);
	const sunDirection = sphericalToCartesian(sunPosition.azimuth + Math.PI, sunPosition.altitude);
	let sunIntensity = 1;

	if(Config.realTimeSun) {
		csm.direction = sunDirection;
		sunIntensity = sunDirection.y < 0 ? 1 : 0
	} else {
		csm.direction = lightDirection;
	}

	const intensityFactor = clamp(-sunDirection.y, 0, 1);
	quadMaterial.uniforms.ambientIntensity.value = intensityFactor * 0.3;
	sunIntensity *= intensityFactor;

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

			let object = ground;

			let modelViewMatrix = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
			groundMaterialDepth.uniforms.modelViewMatrix.value = modelViewMatrix;
			groundMaterialDepth.updateUniform('modelViewMatrix');

			object.draw(groundMaterialDepth);
		}

		{
			buildingDepthMaterial.uniforms.projectionMatrix = {type: 'Matrix4fv', value: rCamera.projectionMatrix};
			buildingDepthMaterial.use();

			for(let j = 0; j < buildings.children.length; j++) {
				let object = buildings.children[j];

				if(i === 0) object.data.tile.time += delta;

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

		for(const batchName in batchesInstanced) {
			const batch = batchesInstanced[batchName];
			const object = batch.mesh;
			const material = batch.materialDepth;

			material.uniforms.projectionMatrix.value = rCamera.projectionMatrix;
			material.use();

			RP.culling = false;

			material.uniforms.modelMatrix.value = object.matrixWorld;
			material.updateUniform('modelMatrix');
			material.uniforms.viewMatrix.value = rCamera.matrixWorldInverse;
			material.updateUniform('viewMatrix');

			object.draw(material);

			RP.culling = true;
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

		const object = ground;

		const modelViewMatrix = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
		groundMaterial.uniforms.modelViewMatrix.value = modelViewMatrix;
		groundMaterial.updateUniform('modelViewMatrix');

		object.draw(groundMaterial);
	}

	RP.depthTest = false;

	{
		roadMaterial.uniforms.projectionMatrix.value = rCamera.projectionMatrix;
		roadMaterial.use();

		for(let i = 0; i < roads.children.length; i++) {
			const object = roads.children[i];

			const inFrustum = object.inCameraFrustum(rCamera);

			if(inFrustum) {
				let modelViewMatrix = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
				roadMaterial.uniforms.modelViewMatrix.value = modelViewMatrix;
				roadMaterial.updateUniform('modelViewMatrix');

				object.draw(roadMaterial);
			}
		}
	}

	RP.depthTest = true;

	{
		buildingMaterial.uniforms.projectionMatrix.value = rCamera.projectionMatrix;
		buildingMaterial.use();

		let noAnimationStreak = 0;

		for(let i = 0; i < buildings.children.length; i++) {
			const object = buildings.children[i];

			const inFrustum = object.inCameraFrustum(rCamera);

			if(inFrustum) {
				let modelViewMatrix = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
				buildingMaterial.uniforms.modelViewMatrix.value = modelViewMatrix;
				buildingMaterial.updateUniform('modelViewMatrix');

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

	for(const batchName in batchesInstanced) {
		const batch = batchesInstanced[batchName];
		const object = batch.mesh;
		const material = batch.material;

		material.uniforms.projectionMatrix.value = rCamera.projectionMatrix;
		material.use();

		RP.culling = false;

		material.uniforms.modelMatrix.value = object.matrixWorld;
		material.updateUniform('modelMatrix');
		material.uniforms.viewMatrix.value = rCamera.matrixWorldInverse;
		material.updateUniform('viewMatrix');

		object.draw(material);

		RP.culling = true;
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

	// Volumetric lighting

	if(Config.volumetricLighting) {
		RP.bindFramebuffer(volumetricLighting.framebuffer);

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		volumetricLighting.material.uniforms.uPosition.value = gBuffer.textures.position;
		volumetricLighting.material.uniforms.cameraMatrixWorld.value = rCamera.matrixWorld;
		volumetricLighting.material.uniforms.cameraMatrixWorldInverse.value = rCamera.matrixWorldInverse;
		volumetricLighting.material.uniforms.lightDirection.value = new Float32Array(vec3.toArray(csm.direction));
		csm.updateUniforms(volumetricLighting.material);
		volumetricLighting.material.use();
		quad.draw(volumetricLighting.material);

		// Blur

		RP.bindFramebuffer(blur.framebufferTemp);

		blur.material.uniforms.tColor.value = volumetricLighting.texture;
		blur.material.uniforms.tDepth.value = gBuffer.framebuffer.depth;
		blur.material.uniforms.direction.value = [0, 1];
		blur.material.use();
		quad.draw(blur.material);

		RP.bindFramebuffer(volumetricLighting.framebufferBlurred);

		blur.material.uniforms.tColor.value = blur.framebufferTemp.textures[0];
		blur.material.uniforms.tDepth.value = gBuffer.framebuffer.depth;
		blur.material.uniforms.direction.value = [1, 0];
		blur.material.use();
		quad.draw(blur.material);
	} else {
		RP.bindFramebuffer(volumetricLighting.framebufferBlurred);

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	// Combine g-buffer textures

	RP.bindFramebuffer(Config.SMAA ? gBuffer.framebufferFinal : ssaa.framebuffer);

	RP.depthWrite = false;
	RP.depthTest = false;

	csm.updateUniforms(quadMaterial);
	quadMaterial.uniforms['uLight.direction'].value = new Float32Array(vec3.toArray(csm.direction));
	quadMaterial.uniforms['uLight.intensity'].value = light.intensity * sunIntensity;
	quadMaterial.uniforms.uAO.value = Config.SSAOBlur ? blur.framebuffer.textures[0] : ssao.framebuffer.textures[0];
	quadMaterial.uniforms.normalMatrix.value = mat4.normalMatrix(rCamera.matrixWorld);
	quadMaterial.uniforms.cameraMatrixWorld.value = rCamera.matrixWorld;
	quadMaterial.uniforms.cameraMatrixWorldInverse.value = rCamera.matrixWorldInverse;
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

		RP.bindFramebuffer(ssaa.framebuffer);

		smaa.materials.blend.uniforms.tColor.value = gBuffer.framebufferFinal.textures[0];
		smaa.materials.blend.use();
		quad.draw(smaa.materials.blend);

		ssaa.blitToScreen();
	} else {
		ssaa.blitToScreen();
	}

	//

	const wsFrustum = view.frustum.toSpace(camera.matrix);
	const frustumTiles = wsFrustum.getTiles(camera.position, 16);

	for(let i = 0; i < frustumTiles.length; i++) {
		const frustumTile = frustumTiles[i];

		frustumTile.x = Math.floor(frustumTile.x);
		frustumTile.y = Math.floor(frustumTile.y);

		const name = tileEncode(frustumTile.x, frustumTile.y);
		const worker = workerManager.getFreeWorker();

		if(!tiles.get(name) && worker) {
			let tile = new Tile(frustumTile.x, frustumTile.y, function (data) {
				const vertices = data.buildings.vertices;
				const normals = data.buildings.normals;
				const uvs = data.buildings.uvs;
				const ids = data.buildings.ids;
				const colors = data.buildings.colors;
				const textures = data.buildings.textures;
				const instances = data.buildings.instances;
				const bbox = {min: data.buildings.bboxMin, max: data.buildings.bboxMax};
				const pivot = tile2meters(this.x, this.y + 1);

				if(isNaN(bbox.min[0]) || isNaN(bbox.max[0])) console.error('Bounding box for tile ' + name + ' was generated incorrectly');

				if(instances.trees.length > 0) {
					const positions = new Float32Array(instances.trees.length / 2 * 3);
					const ids = new Uint16Array(instances.trees.length / 2);
					const types = new Uint8Array(instances.trees.length / 2);

					for(let i = 0; i < instances.trees.length / 2; i++) {
						positions[i * 3] = instances.trees[i * 2];
						positions[i * 3 + 1] = 0;
						positions[i * 3 + 2] = instances.trees[i * 2 + 1];
						ids[i] = i;
						types[i] = i % 2;
					}

					batchesInstanced.trees.addTile({
						tile: this,
						attributes: {
							iPosition: positions,
							iId: ids,
							iType: types
						}
					});
				}

				if(instances.hydrants.length > 0) {
					const positions = new Float32Array(instances.hydrants.length / 2 * 3);
					const ids = new Uint16Array(instances.hydrants.length / 2);
					const types = new Uint8Array(instances.hydrants.length / 2);

					for(let i = 0; i < instances.hydrants.length / 2; i++) {
						positions[i * 3] = instances.hydrants[i * 2];
						positions[i * 3 + 1] = 0;
						positions[i * 3 + 2] = instances.hydrants[i * 2 + 1];
						ids[i] = i;
					}

					batchesInstanced.hydrants.addTile({
						tile: this,
						attributes: {
							iPosition: positions,
							iId: ids,
							iType: types
						}
					});
				}

				const mesh = RP.createMesh({
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

				mesh.setPosition(pivot.x, 0, pivot.z);

				mesh.data.tile = this;

				buildings.add(mesh);

				mesh.setBoundingBox(
					{x: bbox.min[0], y: bbox.min[1], z: bbox.min[2]},
					{x: bbox.max[0], y: bbox.max[1], z: bbox.max[2]}
				);

				this.meshes.buildings = mesh;

				//

				const roadsMesh = RP.createMesh({
					vertices: data.roads.vertices
				});

				roadsMesh.addAttribute({
					name: 'normal',
					size: 3,
					type: 'FLOAT',
					normalized: false
				});
				roadsMesh.setAttributeData('normal', data.roads.normals);

				roadsMesh.addAttribute({
					name: 'uv',
					size: 2,
					type: 'FLOAT',
					normalized: false
				});
				roadsMesh.setAttributeData('uv', data.roads.uvs);

				roadsMesh.setPosition(pivot.x, 0, pivot.z);

				roadsMesh.data.tile = this;

				roads.add(roadsMesh);

				roadsMesh.setBoundingBox(
					{x: 0, y: 0, z: 0},
					{x: tileSize, y: 1, z: tileSize}
				);

				this.meshes.roads = roadsMesh;

				//

				for(let i = 0; i < ids.length; i++) {
					const id = ids[i];

					if(features.ways.get(id)) {
						const object = features.ways.get(id);

						object.setNewParent({
							tile: this
						});
					} else {
						const object = new MapMesh({
							id: id,
							tile: this
						});

						features.ways.set(id, object);

						tile.animate(id);
					}
				}
			}, function () {
				if(!tile.meshes.buildings.inCameraFrustum(camera)) {
					for(const batchName in batchesInstanced) {
						batchesInstanced[batchName].removeTile({
							tile: this
						});
					}

					tiles.delete(this.id);

					for(const id in this.objects) {
						const object = features.ways.get(id);

						if(object) {
							object.removeParent(this);
							if(object.holder === null) features.ways.delete(id);
						}
					}

					return true;
				} else {
					return false;
				}
			});

			tiles.set(name, tile);

			tile.load(worker);

			const deleteCount = tiles.size - Config.maxTiles;

			if(deleteCount > 0) {
				const tilesArray = [];

				for(const [tileId, tile] of tiles.entries()) {
					if(tile.loaded) {
						const worldPosition = tile2meters(tile.x + 0.5, tile.y + 0.5);

						tilesArray.push({
							distance: Math.sqrt((worldPosition.x - camera.position.x) ** 2 + (worldPosition.z - camera.position.z) ** 2),
							id: tileId
						});
					}
				}

				tilesArray.sort((a, b) => (a.distance > b.distance) ? -1 : 1);

				for(let i = 0; i < deleteCount; i++) {
					const tile = tiles.get(tilesArray[i].id);

					tile.delete();
				}
			}
		}
	}
}

export {scene};
