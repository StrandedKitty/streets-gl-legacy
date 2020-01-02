import {degrees2meters, tile2meters, tileEncode, toRad} from './Utils';
import Config from './Config';
import Frustum from './Frustum';
import Controls from './Controls';
import Tile from './Tile';
import MapWorkerManager from './MapWorkerManager';
import MapMesh from './MapMesh';
import BuildingMaterial from "./materials/BuildingMaterial";
import Meshes from './Meshes';
import InstanceMaterial from "./materials/InstanceMaterial";
import Renderer from "./renderer/Renderer";
import SceneGraph from "./renderer/SceneGraph";
import PerspectiveCamera from "./renderer/PerspectiveCamera";
import Object3D from "./renderer/Object3D";
import Mesh from "./renderer/Mesh";
import vec3 from "./math/vec3";
import mat4 from "./math/mat4";
import GBuffer from "./renderer/GBuffer";

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

let MRT = {};

const gui = new dat.GUI();
let time = 0, delta = 0;
let gBuffer;

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

	const vertexShaderSourceQuad = `#version 300 es
	precision highp float;
	in vec3 position;
	
	void main() {
		gl_Position = vec4(position, 1.0);
	}`;
	const fragmentShaderSourceQuad = `#version 300 es
	precision highp float;
	out vec4 FragColor;
	
	uniform sampler2D uNormal;
	uniform sampler2D uColor;
	uniform sampler2D uDepth;
	
	float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
		return (near * far) / ((far - near) * invClipZ - far);
	}
	float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
		return (viewZ + near) / (near - far);
	}
	float readDepth(float depth, float near, float far) {
		float viewZ = perspectiveDepthToViewZ(depth, near, far);
		return viewZToOrthographicDepth(viewZ, near, far);
	}
	
	void main() {
		vec2 fragmentPosition = vec2(gl_FragCoord.xy) / vec2(textureSize(uColor, 0));
		vec4 color = texture(uColor, fragmentPosition);
		vec3 normal = vec3(texture(uNormal, fragmentPosition)) * 2. - 1.;
		float depth = readDepth(texture(uDepth, fragmentPosition).x, 1., 10000.);
		FragColor = fragmentPosition.x > .5 ? vec4(normal, 1.) : color;
	}`;

	const vertexShaderSource = `#version 300 es
	precision highp float;
	in vec3 position;
	in vec2 uv;
	out vec2 vUv;
	out vec3 vNormal;
	
	uniform mat4 projectionMatrix;
	uniform mat4 modelViewMatrix;
	uniform mat3 normalMatrix;
	
	void main() {
		vUv = uv;
		vec3 normal = normalMatrix * vec3(0, 1, 0);
		vNormal = normal;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}`;
	const fragmentShaderSource = `#version 300 es
	precision highp float;
	layout(location = 0) out vec4 outColor;
	layout(location = 1) out vec3 outNormal;
	in vec2 vUv;
	in vec3 vNormal;
	
	uniform sampler2D sampleTexture;
	
	void main() {
		outColor = texture(sampleTexture, vUv);
		outNormal = vNormal * 0.5 + 0.5;
	}`;

	const vertexShaderSource2 = `#version 300 es
	precision highp float;
	in vec3 position;
	in vec3 color;
	in vec3 normal;
	out vec3 vColor;
	out vec3 vNormal;
	
	uniform mat4 projectionMatrix;
	uniform mat4 modelViewMatrix;
	uniform mat3 normalMatrix;
	
	void main() {
		vColor = color;
		vec3 transformedNormal = normal;
		transformedNormal = vec3(normalMatrix * transformedNormal);
		vNormal = transformedNormal;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}`;
	const fragmentShaderSource2 = `#version 300 es
	precision highp float;
	layout(location = 0) out vec4 outColor;
	layout(location = 1) out vec3 outNormal;
	in vec3 vColor;
	in vec3 vNormal;
	
	void main() {
		outColor = vec4(vColor, 1.);
		outNormal = vNormal * 0.5 + 0.5;
	}`;

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
		vertexShader: vertexShaderSource,
		fragmentShader: fragmentShaderSource,
		uniforms: {
			sampleTexture: {type: 'texture', value: RP.createTexture({url: '/textures/grid.jpg', anisotropy: Config.textureAnisotropy})}
		}
	});

	buildingMaterial = RP.createMaterial({
		name: 'buildingMaterial',
		vertexShader: vertexShaderSource2,
		fragmentShader: fragmentShaderSource2,
		uniforms: {}
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

	gBuffer = new GBuffer(RP, window.innerWidth, window.innerHeight, [
		{
			name: 'color',
			internalFormat: 'RGBA8',
			format: 'RGBA',
		}, {
			name: 'normal',
			internalFormat: 'RGB8',
			format: 'RGB',
		}
	]);

	console.log(gBuffer)

	MRT.color = RP.createTexture({
		width: window.innerWidth,
		height: window.innerHeight,
		minFilter: 'NEAREST',
		magFilter: 'NEAREST',
		wrap: 'clamp',
		format: 'RGBA',
		internalFormat: 'RGBA8',
		type: 'UNSIGNED_BYTE'
	});
	MRT.normal = RP.createTexture({
		width: window.innerWidth,
		height: window.innerHeight,
		minFilter: 'NEAREST',
		magFilter: 'NEAREST',
		wrap: 'clamp',
		format: 'RGB',
		internalFormat: 'RGB8',
		type: 'UNSIGNED_BYTE'
	});

	MRT.framebufferFinal = RP.createFramebuffer({
		width: window.innerWidth,
		height: window.innerHeight,
		textures: [MRT.color, MRT.normal]
	});

	MRT.framebuffer = RP.createFramebufferMultisample({
		width: window.innerWidth,
		height: window.innerHeight,
		renderbuffers: [
			RP.createRenderbuffer({
				width: window.innerWidth,
				height: window.innerHeight,
				internalFormat: 'RGBA8'
			}),
			RP.createRenderbuffer({
				width: window.innerWidth,
				height: window.innerHeight,
				internalFormat: 'RGB8'
			})
		]
	});

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

	quadMaterial = RP.createMaterial({
		name: 'quad',
		vertexShader: vertexShaderSourceQuad,
		fragmentShader: fragmentShaderSourceQuad,
		uniforms: {
			uColor: {type: 'texture', value: gBuffer.textures.color},
			uNormal: {type: 'texture', value: gBuffer.textures.normal},
			uDepth: {type: 'texture', value: gBuffer.framebuffer.depth}
		}
	});

	workerManager = new MapWorkerManager(navigator.hardwareConcurrency, './js/worker.js');

	window.addEventListener('resize', function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		view.frustum.aspect = camera.aspect;
		camera.updateProjectionMatrix();

		RP.setSize(window.innerWidth, window.innerHeight);
		MRT.framebuffer.setSize(window.innerWidth, window.innerHeight);
		MRT.framebufferFinal.setSize(window.innerWidth, window.innerHeight);
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

	RP.bindFramebuffer(gBuffer.framebufferSource);

	RP.depthWrite = true;
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	material.uniforms.projectionMatrix = {type: 'Matrix4fv', value: camera.projectionMatrix};
	material.use();

	RP.depthWrite = false;

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

	RP.blitFramebuffer(gBuffer.framebufferSource, gBuffer.framebuffer);

	RP.bindFramebuffer(null);

	RP.depthWrite = false;
	RP.depthTest = false;

	quadMaterial.use();
	quad.draw(quadMaterial);

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

				mesh.setAttributeData('color', colors);
				mesh.setAttributeData('normal', normals);

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