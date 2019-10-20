import {toRad} from './Utils';
import Frustum from './Frustum';
import Controls from './Controls';

let scene,
	camera,
	renderer,
	clock,
	controls,
	rendererStats = new THREEx.RendererStats();

let view = {};

init();
animate();

function init() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color('#a4d2f5');
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
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
	scene.add(ground);

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

	renderer.render(scene, camera);

	rendererStats.update(renderer);

	requestAnimationFrame(animate);
}