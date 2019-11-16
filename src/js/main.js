import {meters2degress, meters2tile, tile2meters, toRad} from './Utils';
import Frustum from './Frustum';
import Controls from './Controls';
import Tile from './Tile';
import MapWorkerManager from './MapWorkerManager';
import MapMesh from './MapMesh';
import BuildingMaterial from "./BuildingMaterial";

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

	view.frustum = new Frustum(camera.fov, camera.aspect, 1, 1000);

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
	let intersections = wsFrustum.project();

	let frustumTiles = [];

	for(let i = 0; i < 2; i++) {
		frustumTiles.push(meters2tile(intersections.near[i].x, intersections.near[i].z));
		frustumTiles.push(meters2tile(intersections.far[i].x, intersections.far[i].z));
	}

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

				tile.displayBuffer = display;

				geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
				geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
				geometry.setAttribute('display', new THREE.BufferAttribute(display, 1));

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
			});

			tiles.set(name, tile);

			tile.ground = meshes.tile.clone();
			let position = tile2meters(frustumTile.x, frustumTile.y + 1);
			position.x += 20037508.34 / (1 << 16);
			position.z += 20037508.34 / (1 << 16);
			tile.ground.position.set(position.x, 0, position.z);
			scene.add(tile.ground);

			tile.load(worker);
		}
	}

	renderer.render(scene, camera);

	rendererStats.update(renderer);

	requestAnimationFrame(animate);
}

export {scene};