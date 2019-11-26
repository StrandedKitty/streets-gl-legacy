import {meters2degress, meters2tile, tile2meters, toRad} from './Utils';
import Config from './Config';
import Frustum from './Frustum';
import Controls from './Controls';
import Tile from './Tile';
import MapWorkerManager from './MapWorkerManager';
import MapMesh from './MapMesh';
import BuildingMaterial from "./BuildingMaterial";
import Meshes from './Meshes';
import InstanceMaterial from "./InstanceMaterial";

let scene,
	camera,
	renderer,
	clock,
	controls,
	rendererStats = new THREEx.RendererStats(),
	workerManager;

let view = {};
let tiles = new Map();
let objects = {
	meshes: new Map()
};
let meshes = {};

init();
animate();

function init() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color('#a4d2f5');
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 15000);
	scene.add(camera);

	view.frustum = new Frustum(camera.fov, camera.aspect, 1, Config.drawDistance);

	controls = new Controls(camera);

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
	renderer.sortObjects = true;

	Config.set('textureAnisotropy', renderer.capabilities.getMaxAnisotropy());

	clock = new THREE.Clock();

	rendererStats = new THREEx.RendererStats();
	rendererStats.domElement.style.position	= 'absolute';
	rendererStats.domElement.style.left	= '0px';
	rendererStats.domElement.style.bottom = '0px';
	document.body.appendChild(rendererStats.domElement);

	let groundGeometry = new THREE.PlaneBufferGeometry(1000, 1000);
	groundGeometry.rotateX(toRad(-90));
	let ground = new THREE.Mesh(groundGeometry, new THREE.MeshBasicMaterial({color: '#5b8648'}));
	//scene.add(ground);

	let tileGeometry = new THREE.PlaneBufferGeometry(40075016.7 / (1 << 16), 40075016.7 / (1 << 16));
	tileGeometry.rotateX(toRad(-90));
	meshes.tile = new THREE.Mesh(tileGeometry, new THREE.MeshBasicMaterial({color: '#4084ff'}));

	workerManager = new MapWorkerManager(navigator.hardwareConcurrency, './js/worker.js');

	window.addEventListener('resize', function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		view.frustum.aspect = camera.aspect;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}, false);
}

function animate() {
	const delta = clock.getDelta();

	controls.update(delta);

	camera.updateProjectionMatrix();
	camera.updateMatrixWorld();

	view.frustum.getViewSpaceVertices();
	let wsFrustum = view.frustum.toSpace(camera.matrix);

	let frustumTiles = wsFrustum.getTiles(camera.position, 16);

	for(let i = 0; i < frustumTiles.length; i++) {
		let frustumTile = frustumTiles[i];

		frustumTile.x = Math.floor(frustumTile.x);
		frustumTile.y = Math.floor(frustumTile.y);

		let name = frustumTile.x + ' ' + frustumTile.y;
		let worker = workerManager.getFreeWorker();

		if(!tiles.get(name) && worker) {
			let tile = new Tile(frustumTile.x, frustumTile.y, function (data) {
				let geometry = new THREE.BufferGeometry();
				let vertices = new Float32Array(data.vertices);
				let normals = new Float32Array(data.normals);
				let ids = data.ids;
				let offsets = data.offsets;
				let display = new Float32Array(vertices.length / 3);
				let colors = new Uint8Array(data.colors);
				let instances = data.instances;

				tile.displayBuffer = display;

				geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
				geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
				geometry.setAttribute('display', new THREE.BufferAttribute(display, 1));
				geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));

				let material = new BuildingMaterial().material;
				tile.mesh = new THREE.Mesh(geometry, material);

				let pivot = tile2meters(this.x, this.y + 1);
				tile.mesh.position.set(pivot.x, 0, pivot.z);

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
				}
			});

			tiles.set(name, tile);

			let ground = tile.getGroundMesh();
			scene.add(ground);

			tile.load(worker);
		}
	}

	renderer.render(scene, camera);

	rendererStats.update(renderer);

	requestAnimationFrame(animate);
}

export {scene};