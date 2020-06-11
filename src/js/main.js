import {clamp, hexToRgb, sphericalToCartesian, tile2meters, tileEncode, toDeg, toRad} from './Utils';
import Config from './Config';
import Frustum from './core/Frustum';
import Controls from './Controls';
import Tile from './Tile';
import MapWorkerManager from './worker/MapWorkerManager';
import MapMesh from './MapMesh';
import Renderer from "./renderer/Renderer";
import SceneGraph from "./core/SceneGraph";
import PerspectiveCamera from "./core/PerspectiveCamera";
import Object3D from "./core/Object3D";
import vec3 from "./math/vec3";
import mat4 from "./math/mat4";
import GBuffer from "./renderer/GBuffer";
import SMAA from "./materials/SMAA";
import SSAO from "./materials/SSAO";
import BilateralBlur from "./materials/BilateralBlur";
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
import WaterMaterial from "./materials/WaterMaterial";
import HDRCompose from "./materials/HDRCompose";
import LDRCompose from "./materials/LDRCompose";
import MapNavigator from "./MapNavigator";
import VolumetricClouds from "./materials/VolumetricClouds";
import TAA from "./materials/TAA";

const SunCalc = require('suncalc');

let scene,
	camera,
	RP,
	controls,
	mapNavigator,
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
let quad, hdrCompose, ldrCompose;

const gui = new dat.GUI();
let time = 0, delta = 0;
let gBuffer, smaa, ssao, blur, ssaa, volumetricLighting, volumetricClouds, taa;
let skybox;
let light;
let lightDirection = new vec3(-1, -1, -1);
let csm;
let waterMeshes, waterMaterial;

const debugSettings = {
	timeOffset: 0
};

const batchesInstanced = {
	trees: null,
	hydrants: null
};

Models.onload = function () {
	init();
};

function init() {
	Config.set('pixelRatio', window.devicePixelRatio, true);

	RP = new Renderer(document.getElementById('canvas'));
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
	waterMeshes = new Object3D();
	wrapper.add(waterMeshes);
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
		size: 2048,
		far: 4000
	});

	view.frustum = new Frustum(camera.fov, camera.aspect, 1, Config.drawDistance);
	view.frustum.updateViewSpaceVertices();

	controls = new Controls(camera);
	mapNavigator = new MapNavigator();

	//mapNavigator.getCurrentPosition(controls);

	const groundMaterialInstance = new GroundMaterial(RP);
	groundMaterial = groundMaterialInstance.material;
	groundMaterialDepth = groundMaterialInstance.depthMaterial;

	const buildingMaterialInstance = new BuildingMaterial(RP);
	buildingMaterial = buildingMaterialInstance.material;
	buildingDepthMaterial = buildingMaterialInstance.depthMaterial;

	const roadMaterialInstance = new RoadMaterial(RP);
	roadMaterial = roadMaterialInstance.material;
	roadDepthMaterial = roadMaterialInstance.depthMaterial;

	const waterMaterialInstance = new WaterMaterial(RP);
	waterMaterial = waterMaterialInstance.material;

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

	skybox = new Skybox(RP);
	wrapper.add(skybox.mesh);

	gBuffer = new GBuffer(RP, window.innerWidth * Config.SSAA * Config.pixelRatio, window.innerHeight * Config.SSAA * Config.pixelRatio, [
		{
			name: 'color',
			internalFormat: 'RGBA8',
			format: 'RGBA',
			type: 'UNSIGNED_BYTE',
			mipmaps: false
		}, {
			name: 'normal',
			internalFormat: 'RGB8',
			format: 'RGB',
			type: 'UNSIGNED_BYTE',
			mipmaps: false
		}, {
			name: 'position',
			internalFormat: 'RGBA32F',
			format: 'RGBA',
			type: 'FLOAT',
			mipmaps: true
		}, {
			name: 'metallicRoughness',
			internalFormat: 'RGBA8',
			format: 'RGBA',
			type: 'UNSIGNED_BYTE',
			mipmaps: false
		}, {
			name: 'emission',
			internalFormat: 'RGBA8',
			format: 'RGBA',
			type: 'UNSIGNED_BYTE',
			mipmaps: false
		}, {
			name: 'motion',
			internalFormat: 'RGBA32F',
			format: 'RGBA',
			type: 'FLOAT',
			mipmaps: false
		}
	]);

	smaa = new SMAA(RP, window.innerWidth * Config.SSAA * Config.pixelRatio, window.innerHeight * Config.SSAA * Config.pixelRatio);
	ssao = new SSAO(RP, window.innerWidth * Config.SSAOResolution * Config.pixelRatio, window.innerHeight * Config.SSAOResolution * Config.pixelRatio);
	blur = new BilateralBlur(RP, window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
	ssaa = new SSAA(RP, window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
	volumetricLighting = new VolumetricLighting(RP, window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
	volumetricClouds = new VolumetricClouds(RP, window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
	taa = new TAA(RP, window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);

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

	hdrCompose = new HDRCompose(RP, {
		gBuffer: gBuffer,
		skybox: skybox,
		volumetricTexture: volumetricLighting.blurredTexture,
		cloudsTexture: volumetricClouds.texture,
		light: light
	});

	ldrCompose = new LDRCompose(RP, {
		gBuffer: gBuffer
	});

	workerManager = new MapWorkerManager(navigator.hardwareConcurrency, './js/worker.js');

	gui.add(Config, 'TAA');
	gui.add(Config, 'SMAA');
	gui.add(Config, 'SSAO');
	gui.add(Config, 'SSAOBlur');
	gui.add(Config, 'volumetricLighting');
	gui.add(light, 'intensity');
	gui.add(hdrCompose.material.uniforms.ambientIntensity, 'value');
	gui.add(debugSettings, 'timeOffset', -4e4, 4e4);
	gui.add(volumetricClouds.material.uniforms.densityFactor, 'value', 0.001, 0.1);
	gui.add(volumetricClouds.material.uniforms.densityFactor2, 'value', 0, 1);
	//gui.add(volumetricClouds.material.uniforms.powderFactor, 'value', 0, 1);
	gui.addColor({color: '#1861b3'}, 'color').onChange(function (e) {
		const v = hexToRgb(e);
		hdrCompose.material.uniforms.fogColor.value = new Float32Array([v[0] / 255, v[1] / 255, v[2] / 255]);
	});

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
		volumetricClouds.setSize(window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
		taa.setSize(window.innerWidth * Config.pixelRatio, window.innerHeight * Config.pixelRatio);
		taa.material.uniforms.ignoreHistory.value = 1;
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

	wrapper.position.x += camera.position.x % 10000;
	wrapper.position.z += camera.position.z % 10000;

	ground.setPosition(camera.position.x - camera.position.x % (tileSize * 2), 0, camera.position.z - camera.position.z % (tileSize * 2));

	scene.updateMatrixRecursively();
	scene.updateMatrixWorldRecursively();

	camera.updateMatrixWorldInverse();
	camera.updateFrustum();

	// Jitter camera projection matrix for TAA

	const defaultProjectionMatrix = mat4.copy(camera.projectionMatrix);

	if(Config.TAA) {
		const jitteredProjection = camera.projectionMatrix;
		const offsets = [
			[-7 / 8, 1 / 8],
			[-5 / 8, -5 / 8],
			[-1 / 8, -3 / 8],
			[3 / 8, -7 / 8],
			[5 / 8, -1 / 8],
			[7 / 8, 7 / 8],
			[1 / 8, 3 / 8],
			[-3 / 8, 5 / 8]
		];
		jitteredProjection[8] = offsets[taa.frameCount % offsets.length][0] / (window.innerWidth * Config.pixelRatio);
		jitteredProjection[9] = offsets[taa.frameCount % offsets.length][1] / (window.innerHeight * Config.pixelRatio);

		defaultProjectionMatrix[8] = 0.;
		defaultProjectionMatrix[9] = 0.;

		taa.frameCount++;
	}

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

	const intensityFactor = clamp(-csm.direction.y, 0, 1);
	hdrCompose.material.uniforms.ambientIntensity.value = intensityFactor * 0.3;
	sunIntensity *= intensityFactor;

	csm.update(camera.matrix);

	// Shadow mapping

	for(let i = 0; i < csm.lights.length; i++) {
		let rCamera = csm.lights[i].camera;

		rCamera.updateFrustum();

		RP.bindFramebuffer(csm.lights[i].framebuffer);

		RP.depthTest = true;
		RP.depthWrite = true;

		RP.clearFramebuffer({
			clearColor: [1, 1, 1, 1],
			color: true,
			depth: true
		});

		{
			groundMaterialDepth.uniforms.projectionMatrix = {type: 'Matrix4fv', value: rCamera.projectionMatrix};
			groundMaterialDepth.use();

			let object = ground;

			let modelViewMatrix = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
			groundMaterialDepth.uniforms.modelViewMatrix.value = modelViewMatrix;
			groundMaterialDepth.updateUniform('modelViewMatrix');

			object.draw();
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

					object.draw();
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

			object.draw();

			RP.culling = true;
		}
	}

	// Rendering camera

	let rCamera = camera;

	// Draw to g-buffer

	RP.bindFramebuffer(gBuffer.framebuffer);

	RP.depthTest = true;
	RP.depthWrite = true;

	RP.clearFramebuffer({
		clearColor: [0, 0, 0, 0],
		color: true,
		depth: true
	});

	RP.depthWrite = false;

	skybox.render(rCamera, taa.matrixWorldInversePrev);

	RP.depthWrite = true;

	{
		groundMaterial.uniforms.projectionMatrix = {type: 'Matrix4fv', value: rCamera.projectionMatrix};
		groundMaterial.use();

		const object = ground;

		groundMaterial.uniforms.modelViewMatrix.value = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
		groundMaterial.uniforms.modelViewMatrixPrev.value = mat4.multiply(taa.matrixWorldInversePrev || rCamera.matrixWorldInverse, object.matrixWorld);
		groundMaterial.updateUniform('modelViewMatrix');
		groundMaterial.updateUniform('modelViewMatrixPrev');

		object.draw();
	}

	RP.depthTest = false;

	waterMaterial.uniforms.time.value += delta;
	{
		waterMaterial.uniforms.projectionMatrix.value = rCamera.projectionMatrix;
		waterMaterial.use();

		for (let i = 0; i < waterMeshes.children.length; i++) {
			const object = waterMeshes.children[i];

			const inFrustum = object.inCameraFrustum(rCamera);

			if (inFrustum) {
				waterMaterial.uniforms.modelViewMatrix.value = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
				waterMaterial.uniforms.modelViewMatrixPrev.value = mat4.multiply(taa.matrixWorldInversePrev || rCamera.matrixWorldInverse, object.matrixWorld);
				waterMaterial.updateUniform('modelViewMatrix');
				waterMaterial.updateUniform('modelViewMatrixPrev');

				object.draw();
			}
		}
	}

	{
		roadMaterial.uniforms.projectionMatrix.value = rCamera.projectionMatrix;
		roadMaterial.use();

		for(let i = 0; i < roads.children.length; i++) {
			const object = roads.children[i];

			const inFrustum = object.inCameraFrustum(rCamera);

			if(inFrustum) {
				roadMaterial.uniforms.modelViewMatrix.value = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
				roadMaterial.uniforms.modelViewMatrixPrev.value = mat4.multiply(taa.matrixWorldInversePrev || rCamera.matrixWorldInverse, object.matrixWorld);
				roadMaterial.updateUniform('modelViewMatrix');
				roadMaterial.updateUniform('modelViewMatrixPrev');

				object.draw();
			}
		}
	}

	RP.depthTest = true;

	{
		buildingMaterial.uniforms.projectionMatrix.value = rCamera.projectionMatrix;
		buildingMaterial.uniforms.uSunIntensity.value = sunIntensity;
		buildingMaterial.use();

		let noAnimationStreak = 0;

		for(let i = 0; i < buildings.children.length; i++) {
			const object = buildings.children[i];

			const inFrustum = object.inCameraFrustum(rCamera);

			if(inFrustum) {
				buildingMaterial.uniforms.modelViewMatrix.value = mat4.multiply(rCamera.matrixWorldInverse, object.matrixWorld);
				buildingMaterial.uniforms.modelViewMatrixPrev.value = mat4.multiply(taa.matrixWorldInversePrev || rCamera.matrixWorldInverse, object.matrixWorld);
				buildingMaterial.updateUniform('modelViewMatrix');
				buildingMaterial.updateUniform('modelViewMatrixPrev');

				if(object.data.tile.time - delta < 1) {
					buildingMaterial.uniforms.time.value = object.data.tile.time;
					buildingMaterial.uniforms.timeDelta.value = Math.min(delta, 1 - object.data.tile.time);
					buildingMaterial.updateUniform('time');
					buildingMaterial.updateUniform('timeDelta');
					noAnimationStreak = 0;
				} else {
					if(noAnimationStreak === 0) {
						buildingMaterial.uniforms.time.value = 1;
						buildingMaterial.updateUniform('time');
					}

					++noAnimationStreak;
				}

				object.draw();
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
		material.uniforms.viewMatrixPrev.value = taa.matrixWorldInversePrev;
		material.updateUniform('viewMatrix');

		object.draw();

		RP.culling = true;
	}

	RP.depthWrite = false;
	RP.depthTest = false;

	// SSAO

	if(Config.SSAO) {
		RP.bindFramebuffer(ssao.framebuffer);

		RP.clearFramebuffer({
			clearColor: [1, 1, 1, 1],
			color: true
		});

		ssao.material.uniforms.tPosition.value = gBuffer.textures.position;
		ssao.material.uniforms.tNormal.value = gBuffer.textures.normal;
		ssao.material.uniforms.cameraProjectionMatrix.value = rCamera.projectionMatrix;
		ssao.material.use();
		quad.draw();

		// Blur

		RP.bindFramebuffer(blur.framebufferTemp);

		blur.material.uniforms.tColor.value = ssao.framebuffer.textures[0];
		blur.material.uniforms.tDepth.value = gBuffer.framebuffer.depth;
		blur.material.uniforms.direction.value = [0, 1];
		blur.material.use();
		quad.draw();

		RP.bindFramebuffer(blur.framebuffer);

		blur.material.uniforms.tColor.value = blur.framebufferTemp.textures[0];
		blur.material.uniforms.tDepth.value = gBuffer.framebuffer.depth;
		blur.material.uniforms.direction.value = [1, 0];
		blur.material.use();
		quad.draw();
	} else {
		RP.bindFramebuffer(blur.framebuffer);

		RP.clearFramebuffer({
			clearColor: [1, 1, 1, 1],
			color: true
		});

		RP.bindFramebuffer(ssao.framebuffer);

		RP.clearFramebuffer({
			clearColor: [1, 1, 1, 1],
			color: true
		});
	}

	// Volumetric lighting

	if(Config.volumetricLighting) {
		RP.bindFramebuffer(volumetricLighting.framebuffer);

		RP.clearFramebuffer({
			clearColor: [0, 0, 0, 0],
			color: true
		});

		volumetricLighting.material.uniforms.uPosition.value = gBuffer.textures.position;
		volumetricLighting.material.uniforms.cameraMatrixWorld.value = rCamera.matrixWorld;
		volumetricLighting.material.uniforms.cameraMatrixWorldInverse.value = rCamera.matrixWorldInverse;
		volumetricLighting.material.uniforms.lightDirection.value = new Float32Array(vec3.toArray(csm.direction));
		csm.updateUniforms(volumetricLighting.material);
		volumetricLighting.material.use();
		quad.draw();

		// Blur

		RP.bindFramebuffer(blur.framebufferTemp);

		blur.material.uniforms.tColor.value = volumetricLighting.texture;
		blur.material.uniforms.tDepth.value = gBuffer.framebuffer.depth;
		blur.material.uniforms.direction.value = [0, 1];
		blur.material.use();
		quad.draw();

		RP.bindFramebuffer(volumetricLighting.framebufferBlurred);

		blur.material.uniforms.tColor.value = blur.framebufferTemp.textures[0];
		blur.material.uniforms.tDepth.value = gBuffer.framebuffer.depth;
		blur.material.uniforms.direction.value = [1, 0];
		blur.material.use();
		quad.draw();
	} else {
		RP.bindFramebuffer(volumetricLighting.framebufferBlurred);

		RP.clearFramebuffer({
			clearColor: [0, 0, 0, 0],
			color: true
		});
	}

	// Clouds

	RP.bindFramebuffer(volumetricClouds.framebuffer);

	gBuffer.textures.position.generateMipmaps();
	volumetricClouds.material.uniforms.tPosition.value = gBuffer.textures.position;
	//volumetricClouds.material.uniforms.cameraPositionE5.value = new Float32Array([camera.position.x % 1e5, camera.position.y, camera.position.z % 1e5]);
	volumetricClouds.material.uniforms.cameraPositionE5.value = new Float32Array([0, 0, 0]);
	volumetricClouds.material.uniforms.lightDirection.value = new Float32Array(vec3.toArray(csm.direction));
	volumetricClouds.material.uniforms.normalMatrix.value = mat4.normalMatrix(rCamera.matrixWorld);
	volumetricClouds.material.uniforms.projectionMatrix.value = rCamera.projectionMatrix;
	volumetricClouds.material.uniforms.mvMatrixCurr.value = rCamera.matrixWorldInverse;
	volumetricClouds.material.uniforms.mvMatrixPrev.value = volumetricClouds.mvMatrix || null;
	volumetricClouds.material.uniforms.time.value += delta;
	volumetricClouds.material.use();

	quad.draw();

	volumetricClouds.material.uniforms.needsFullUpdate.value = 0;
	volumetricClouds.mvMatrix = mat4.copy(rCamera.matrixWorldInverse);

	volumetricClouds.copyResultToOutput();

	// Combine g-buffer textures

	RP.bindFramebuffer(gBuffer.framebufferHDR);

	RP.depthWrite = false;
	RP.depthTest = false;

	csm.updateUniforms(hdrCompose.material);
	hdrCompose.material.uniforms['uLight.direction'].value = new Float32Array(vec3.toArray(csm.direction));
	hdrCompose.material.uniforms['uLight.intensity'].value = light.intensity * sunIntensity;
	hdrCompose.material.uniforms.sunIntensity.value = sunIntensity;
	hdrCompose.material.uniforms.uAO.value = Config.SSAOBlur ? blur.framebuffer.textures[0] : ssao.framebuffer.textures[0];
	hdrCompose.material.uniforms.normalMatrix.value = mat4.normalMatrix(rCamera.matrixWorld);
	hdrCompose.material.uniforms.cameraMatrixWorld.value = rCamera.matrixWorld;
	hdrCompose.material.uniforms.cameraMatrixWorldInverse.value = rCamera.matrixWorldInverse;
	hdrCompose.material.use();
	quad.draw();

	// TAA

	if(TAA) {
		RP.bindFramebuffer(taa.framebuffer);

		taa.material.uniforms.tNew.value = gBuffer.framebufferHDR.textures[0];
		taa.material.uniforms.tMotion.value = gBuffer.textures.motion;
		taa.material.uniforms.tPosition.value = gBuffer.textures.position;
		taa.material.use();

		quad.draw();

		taa.copyResultToOutput();

		taa.matrixWorldInversePrev = mat4.copy(rCamera.matrixWorldInverse);
		taa.material.uniforms.ignoreHistory.value = 0;
	}

	// HDR to LDR texture

	gBuffer.drawBloom();

	if(Config.SMAA) RP.bindFramebuffer(gBuffer.framebufferOutput);
	else RP.bindFramebuffer(ssaa.framebuffer);

	ldrCompose.material.uniforms.tHDR.value = Config.TAA ? taa.framebuffer.textures[0] : gBuffer.framebufferHDR.textures[0];
	ldrCompose.material.use();
	quad.draw();

	// SMAA

	if(Config.SMAA) {
		RP.bindFramebuffer(smaa.edgesFB);

		RP.clearFramebuffer({
			clearColor: [0, 0, 0, 1],
			color: true
		});

		smaa.materials.edges.uniforms.tDiffuse.value = gBuffer.framebufferOutput.textures[0];
		smaa.materials.edges.use();
		quad.draw();

		RP.bindFramebuffer(smaa.weightsFB);

		smaa.materials.weights.use();
		quad.draw();

		RP.bindFramebuffer(ssaa.framebuffer);

		smaa.materials.blend.uniforms.tColor.value = gBuffer.framebufferOutput.textures[0];
		smaa.materials.blend.use();
		quad.draw();

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
					type: 'UNSIGNED_BYTE',
					normalized: false,
					dataFormat: 'integer'
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

				if(data.water.length > 0) {
					const waterMesh = RP.createMesh({
						vertices: data.water
					});

					waterMesh.addAttribute({
						name: 'normal',
						size: 3,
						type: 'FLOAT',
						normalized: false
					});
					waterMesh.setAttributeData('normal', new Float32Array(data.water.length));

					waterMesh.setPosition(pivot.x, 0, pivot.z);

					waterMesh.data.tile = this;

					waterMeshes.add(waterMesh);

					waterMesh.setBoundingBox(
						{x: 0, y: 0, z: 0},
						{x: tileSize, y: 1, z: tileSize}
					);

					this.meshes.water = waterMesh;
				}

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
