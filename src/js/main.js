import {degrees2meters, tile2meters, tileEncode, toRad} from './Utils';
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
import SAO from "./materials/SAO";

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

let mesh, material, wrapper, buildings, buildingMaterial;
let quad, quadMaterial;

const gui = new dat.GUI();
let time = 0, delta = 0;
let gBuffer, smaa, sao;

init();
animate();

function init() {
	/*scene = new THREE.Scene();
	scene.background = new THREE.Color('#a4d2f5');
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 15000);
	scene.add(camera);

	let canvas = document.getElementById('canvas');
	let context = canvas.getContext('webgl2');
	renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas, context: context});
	renderer.gammaInput = false;
	renderer.gammaOutput = false;
	renderer.debug.checkShaderErrors = true;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.precision = 'highp';
	renderer.sortObjects = true;*/

	RP = new Renderer(canvas);
	RP.setSize(window.innerWidth, window.innerHeight);
	RP.culling = true;

	Config.set('textureAnisotropy', RP.capabilities.maxAnisotropy);

	scene = new SceneGraph();

	wrapper = new Object3D();
	scene.add(wrapper);
	buildings = new Object3D();
	wrapper.add(buildings);

	camera = new PerspectiveCamera({
		fov: 70,
		near: 1,
		far: 10000,
		aspect: window.innerWidth / window.innerHeight
	});
	wrapper.add(camera);

	view.frustum = new Frustum(camera.fov, camera.aspect, 1, Config.drawDistance);
	controls = new Controls(camera);

	material = RP.createMaterial({
		name: 'basic',
		vertexShader: shaders.ground.vertex,
		fragmentShader: shaders.ground.fragment,
		uniforms: {
			sampleTexture: {type: 'texture', value: RP.createTexture({url: '/textures/grid.jpg', anisotropy: Config.textureAnisotropy})}
		}
	});

	buildingMaterial = RP.createMaterial({
		name: 'buildingMaterial',
		vertexShader: shaders.building.vertex,
		fragmentShader: shaders.building.fragment,
		uniforms: {
			tSample: {type: 'texture', value: RP.createTexture({url: './textures/window.png', anisotropy: Config.textureAnisotropy})}
		}
	});

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
	mesh.updateMatrix();

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
		}
	]);

	smaa = new SMAA(RP, window.innerWidth * Config.SSAA, window.innerHeight * Config.SSAA);
	sao = new SAO(RP, window.innerWidth, window.innerHeight);

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

	quadMaterial = RP.createMaterial({
		name: 'quad',
		vertexShader: shaders.quad.vertex,
		fragmentShader: shaders.quad.fragment,
		uniforms: {
			uColor: {type: 'texture', value: gBuffer.textures.color},
			uNormal: {type: 'texture', value: gBuffer.textures.normal},
			uPosition: {type: 'texture', value: gBuffer.textures.position},
			uDepth: {type: 'texture', value: gBuffer.framebuffer.depth}
		}
	});

	workerManager = new MapWorkerManager(navigator.hardwareConcurrency, './js/worker.js');

	window.addEventListener('resize', function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		view.frustum.aspect = camera.aspect;
		camera.updateProjectionMatrix();

		RP.setSize(window.innerWidth, window.innerHeight);
		gBuffer.setSize(window.innerWidth * Config.SSAA, window.innerHeight * Config.SSAA);
		smaa.setSize(window.innerWidth * Config.SSAA, window.innerHeight * Config.SSAA);
	}, false);
}

function animate() {
	requestAnimationFrame(animate);

	const now = performance.now();
	delta = (now - time) / 1e3;
	time = now;

	controls.update(delta);

	wrapper.position.x = -camera.position.x;
	wrapper.position.z = -camera.position.z;
	wrapper.updateMatrix();
	wrapper.updateMatrixWorld();

	buildings.updateMatrix();
	buildings.updateMatrixWorld();

	camera.updateMatrixWorld();
	camera.updateMatrixWorldInverse();

	let gl = RP.gl;

	RP.depthTest = true;

	// Draw to g-buffer

	RP.bindFramebuffer(gBuffer.framebuffer);

	RP.depthWrite = true;

	gl.clearColor(0.7, 0.9, 0.9, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	material.uniforms.projectionMatrix = {type: 'Matrix4fv', value: camera.projectionMatrix};
	material.use();

	RP.depthWrite = true;

	for(let i = 0; i < wrapper.children.length; i++) {
		let object = wrapper.children[i];

		if(object instanceof Mesh) {
			object.updateMatrix();
			object.updateMatrixWorld();

			let modelViewMatrix = mat4.multiply(camera.matrixWorldInverse, object.matrixWorld);
			let normalMatrix = mat4.normalMatrix(modelViewMatrix);
			material.uniforms.modelViewMatrix = {type: 'Matrix4fv', value: modelViewMatrix};
			material.uniforms.normalMatrix = {type: 'Matrix3fv', value: normalMatrix};
			material.updateUniform('modelViewMatrix');
			material.updateUniform('normalMatrix');

			object.draw(material);
		}
	}

	buildingMaterial.uniforms.projectionMatrix = {type: 'Matrix4fv', value: camera.projectionMatrix};
	buildingMaterial.use();
	RP.depthWrite = true;

	for(let i = 0; i < buildings.children.length; i++) {
		let object = buildings.children[i];

		object.updateMatrix();
		object.updateMatrixWorld();

		let modelViewMatrix = mat4.multiply(camera.matrixWorldInverse, object.matrixWorld);
		let normalMatrix = mat4.normalMatrix(modelViewMatrix);
		buildingMaterial.uniforms.modelViewMatrix = {type: 'Matrix4fv', value: modelViewMatrix};
		buildingMaterial.uniforms.normalMatrix = {type: 'Matrix3fv', value: normalMatrix};
		buildingMaterial.updateUniform('modelViewMatrix');
		buildingMaterial.updateUniform('normalMatrix');

		object.draw(buildingMaterial);
	}

	// Combine g-buffer textures

	RP.bindFramebuffer(gBuffer.framebufferFinal);

	RP.depthWrite = false;
	RP.depthTest = false;

	quadMaterial.use();
	quad.draw(quadMaterial);

	// SAO

	/*RP.bindFramebuffer(null);

	gl.clearColor(1, 1, 1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	sao.material.uniforms.gPosition.value = gBuffer.textures.position;
	sao.material.uniforms.gNormal.value = gBuffer.textures.normal;
	sao.material.uniforms.cameraProjectionMatrix.value = camera.projectionMatrix;
	sao.material.use();
	quad.draw(sao.material);*/

	// SMAA

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

	view.frustum.getViewSpaceVertices();
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
				const display = new Float32Array(vertices.length / 3);
				const colors = new Uint8Array(data.colors);
				const instances = data.instances;

				let mesh = RP.createMesh({
					vertices: vertices
				});

				mesh.addAttribute({
					name: 'color',
					size: 3,
					type: 'UNSIGNED_BYTE',
					normalized: true
				});
				mesh.addAttribute({
					name: 'normal',
					size: 3,
					type: 'FLOAT',
					normalized: false
				});
				mesh.addAttribute({
					name: 'uv',
					size: 2,
					type: 'FLOAT',
					normalized: false
				});

				mesh.setAttributeData('color', colors);
				mesh.setAttributeData('normal', normals);
				mesh.setAttributeData('uv', uvs);

				const pivot = tile2meters(this.x, this.y + 1);
				mesh.setPosition(pivot.x, 0, pivot.z);

				buildings.add(mesh);

				/*let geometry = new THREE.BufferGeometry();
				tile.displayBuffer = display;

				geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
				geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
				geometry.setAttribute('display', new THREE.BufferAttribute(display, 1));
				geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));

				let material = new BuildingMaterial().material;
				tile.mesh = new THREE.Mesh(geometry, material);

				let pivot = tile2meters(this.x, this.y + 1);
				tile.mesh.position.set(pivot.x, 0, pivot.z);

				tile.mesh.renderOrder = 1;
				scene.add(tile.mesh);

				for(let i = 0; i < ids.length; i++) {
					let id = ids[i];

					if(objects.meshes.get(id)) {
						let mesh = objects.meshes.get(id);

						let offset = offsets[i];
						let nextOffset = offsets[i + 1] || (vertices.length / 3);
						let size = nextOffset - offset;
						mesh.addParent(this, offset, size);
					} else {
						let offset = offsets[i];
						let nextOffset = offsets[i + 1] || (vertices.length / 3);
						let size = nextOffset - offset;
						let object = new MapMesh(id, this, offset, size);

						objects.meshes.set(id, object);
					}

				}

				if(instances.trees.length > 0) {
					let positions = new Float32Array(instances.trees.length / 2 * 3);
					for(let i = 0; i < instances.trees.length / 2; i++) {
						positions[i * 3] = instances.trees[i * 2];
						positions[i * 3 + 1] = 0;
						positions[i * 3 + 2] = instances.trees[i * 2 + 1];
					}

					let sourceGeometry = Meshes.tree.geometry;
					let geometry = new THREE.InstancedBufferGeometry();
					geometry.index = sourceGeometry.index;
					geometry.attributes.position = sourceGeometry.attributes.position;
					geometry.attributes.uv = sourceGeometry.attributes.uv;

					let positionAttribute = new THREE.InstancedBufferAttribute(positions, 3);
					geometry.setAttribute('iPosition', positionAttribute);

					let mesh = new THREE.Mesh(geometry, new InstanceMaterial().material);

					mesh.frustumCulled = false;
					mesh.position.set(pivot.x, 0, pivot.z);
					scene.add(mesh);
				}*/
			});

			tiles.set(name, tile);

			let ground = tile.getGroundMesh(RP);
			wrapper.add(ground);

			tile.load(worker);
		}
	}
}

export {scene};