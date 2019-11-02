self.addEventListener('message', function(e) {
	let code = e.data.code;
	switch(code) {
		case 'init':
			break;
		case 'start':
			let position = e.data.position;
			let tile = {
				x: position[0],
				y: position[1],
			};

			load(tile);

			break;
	}
}, false);

function load(tile) {
	overpass(tile.x, tile.y);
}

function overpass(x, y) {
	let url = 'https://overpass.nchc.org.tw/api/interpreter?data=';
	let position = [
		tile2degrees(x, y + 1),
		tile2degrees(x + 1, y)
	];
	let bbox = position[0].lat + ',' + position[0].lon + ',' + position[1].lat + ',' + position[1].lon;

	url += `
		[out:json][timeout:25];
		(
			node(${bbox});
			way(${bbox});
		);
		out body;
		>;
		out skel qt;
	`;

	let httpRequest = new XMLHttpRequest();

	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === 200) {
				let data = JSON.parse(httpRequest.responseText).elements;
				self.postMessage(data);
			} else {
				self.postMessage({code: 'error', error: 'request'});
			}
		}
	};
	httpRequest.open('GET', url);
	httpRequest.send();
}

function tile2degrees(x, y, zoom = 16) {
	let n = Math.PI - 2 * Math.PI * y / (1 << zoom);
	let lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
	let lon = x / (1 << zoom) * 360-180;
	return {lat, lon}
}

