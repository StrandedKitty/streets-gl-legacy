let Shapes = {};

Shapes.plane = function(x, z) {
	const hx = x / 2;
	const hz = z / 2;
	this.vertices = new Float32Array([
		hx, 0, -hz,
		-hx, 0, -hz,
		hx, 0, hz,
		hx, 0, hz,
		-hx, 0, -hz,
		-hx, 0, hz
	]);
	this.uv = new Float32Array([
		1, 0,
		0, 0,
		1, 1,
		1, 1,
		0, 0,
		0, 1
	]);
};

export default Shapes;