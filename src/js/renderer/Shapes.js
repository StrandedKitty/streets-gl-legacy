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
};

export default Shapes;