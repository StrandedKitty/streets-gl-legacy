let scene,
	camera,
	renderer,
	clock,
	rendererStats = new THREEx.RendererStats();

init();

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 3, 10000);
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
	renderer.sortObjects = true;

	clock = new THREE.Clock();

	rendererStats = new THREEx.RendererStats();
	rendererStats.domElement.style.position	= 'absolute';
	rendererStats.domElement.style.left	= '0px';
	rendererStats.domElement.style.bottom = '0px';
	document.body.appendChild(rendererStats.domElement);

	camera.position.set(0, 1, 0);
	camera.lookAt(1, 0, 0);

	window.addEventListener('resize', function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}, false);
}

function animate() {
	const delta = clock.getDelta();

	renderer.render(scene, camera);

	rendererStats.update(renderer);

	requestAnimationFrame(animate);
}