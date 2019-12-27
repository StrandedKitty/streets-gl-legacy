export function clamp(num, min, max) {
	return num <= min ? min : num >= max ? max : num;
}

export function lerp(start, end, amt){
	return (1-amt) * start + amt * end
}

export function calculateLine(a, b) {
	let x = Math.floor(a[0]);
	let y = Math.floor(a[1]);
	const endX = Math.floor(b[0]);
	const endY = Math.floor(b[1]);

	let points = [[x, y]];

	if(x === endX && y === endY) return points;

	const stepX = Math.sign(b[0] - a[0]);
	const stepY = Math.sign(b[1] - a[1]);

	const toX = Math.abs(a[0] - x - Math.max(0, stepX));
	const toY = Math.abs(a[1] - y - Math.max(0, stepY));

	const vX = Math.abs(a[0] - b[0]);
	const vY = Math.abs(a[1] - b[1]);

	let tMaxX = toX / vX;
	let tMaxY = toY / vY;

	const tDeltaX = 1 / vX;
	const tDeltaY = 1 / vY;

	while(!(x === endX && y === endY)) {
		if(tMaxX < tMaxY) {
			tMaxX = tMaxX + tDeltaX;
			x = x + stepX;
		} else {
			tMaxY = tMaxY + tDeltaY;
			y = y + stepY;
		}

		points.push([x, y]);
	}

	return points;
}

export function toRad(degrees) {
	return degrees * Math.PI / 180;
}

export function toDeg(radians) {
	return radians * 180 / Math.PI;
}

export function degrees2meters(lat, lon) {
	let z = lon * 20037508.34 / 180;
	let x =  Math.log(Math.tan((90 + lat) * Math.PI / 360)) * 20037508.34 / Math.PI;
	return {x, z}
}

export function meters2degress(x, z) {
	let lon = z *  180 / 20037508.34;
	let lat = Math.atan(Math.exp(x * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
	return {lat, lon}
}

export function degrees2tile(lat, lon, zoom = 16)  {
	let x = (lon + 180) / 360 * (1 << zoom);
	let y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * (1 << zoom);
	return {x, y}
}

export function tile2degrees(x, y, zoom = 16) {
	let n = Math.PI - 2 * Math.PI * y / (1 << zoom);
	let lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
	let lon = x / (1 << zoom) * 360-180;
	return {lat, lon}
}

export function meters2tile(x, z, zoom = 16)  {
	let rx = (z + 20037508.34) / (2 * 20037508.34) * (1 << zoom);
	let ry = (1 - (x + 20037508.34) / (2 * 20037508.34)) * (1 << zoom);
	return {x: rx, y: ry}
}

export function tile2meters(x, y, zoom = 16)  {
	let rz = (2 * 20037508.34 * x) / (1 << zoom) - 20037508.34;
	let rx = 20037508.34 - (2 * 20037508.34 * y) / (1 << zoom);
	return {x: rx, z: rz}
}

export function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16)
	] : null;
}

export function mercatorScaleFactor(lat) {
	return 1 / Math.cos(lat);
}

export function tileEncode(x, y) {
	return y * 65536 + x;
}

export function tileDecode(id) {
	const y = Math.floor(id / 65536);
	const x = id % 65536;
	return {x, y};
}