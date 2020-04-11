const Pbf = require('pbf');
const proto = require('./vector_tile.js').Tile;

export default class VectorTile {
	constructor(params) {
		this.x = params.x;
		this.y = params.y;
		this.z = params.z || 16;
		this.tileSize = 40075016.7 / (1 << this.z);
		this.geometry = [];
	}

	async get() {
		return new Promise((resolve, reject) => {
			const url = "https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/" + this.z + "/" + this.x + "/" + this.y + ".vector.pbf?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY5YzJzczA2ejIzM29hNGQ3emFsMXgifQ.az9JUrQP7klCgD3W-ueILQ";

			const httpRequest = new XMLHttpRequest();

			httpRequest.onreadystatechange = function () {
				if (httpRequest.readyState === XMLHttpRequest.DONE) {
					if (httpRequest.status === 200) {
						this.processData(httpRequest.response);
					} else {
						console.error('Vector tile request error: ' + httpRequest.status);
					}

					resolve(this.geometry);
				}
			}.bind(this);

			httpRequest.open('GET', url);
			httpRequest.responseType = 'arraybuffer';
			httpRequest.send();
		});
	}

	processData(buffer) {
		const pbf = new Pbf(buffer);
		const obj = proto.read(pbf);

		for(let i = 0; i < obj.layers.length; i++) {
			const layer = obj.layers[i];

			if(layer.name === 'water') {
				for(let j = 0; j < layer.features.length; j++) {
					this.processGeometry(layer.features[j].geometry);
				}
			}
		}
	}

	processGeometry(arr) {
		const polygon = this.commandsToPolygons(arr);

		this.geometry = polygon;

		/*for(let i = 0; i < arr.length - 1; i += 2) {
			const x = arr[i] / 4095 * this.tileSize;
			const y = arr[i + 1] / 4095 * this.tileSize;
			const point = new Array(2);

			if(i === 0) {
				pos.x = x;
				pos.y = y;

				point[0] = pos.x;
				point[1] = pos.y;
			} else {
				const newPos = {
					x: pos.x + x,
					y: pos.y + y
				};

				point[0] = newPos.x;
				point[1] = newPos.y;
			}

			this.geometry.push(point);
		}*/
	}

	commandsToPolygons(arr) {
		let i = 0;
		const rings = [];
		let currentRing = [];
		let start = [0, 0];
		let last = [0, 0];

		while(i < arr.length) {
			const command = arr[i] & 0b111;
			const param = arr[i] >> 3;

			if(command === 1) { // MoveTo
				currentRing = [];
				rings.push(currentRing);

				for(let j = 0; j < param; j++) {
					i += 2;
					const rel = this.parseCoordinates(arr[i - 1], arr[i]);
					rel[0] += last[0];
					rel[1] += last[1];
					start = [rel[0], rel[1]];
					currentRing.push(rel);
					last = rel;
				}
			} else if(command === 2) { // LineTo
				for(let j = 0; j < param; j++) {
					i += 2;
					const rel = this.parseCoordinates(arr[i - 1], arr[i]);
					rel[0] += last[0];
					rel[1] += last[1];
					last = rel;
					currentRing.push(rel);
				}
			} else if(command === 7) { // ClosePath
				currentRing.push(start);
			}

			++i;
		}

		for(let i = 0; i < rings.length; i++) {
			for(let j = 0; j < rings[i].length; j++) {
				rings[i][j][0] = this.tileSize - rings[i][j][0];
			}
		}

		return rings;
	}

	parseCoordinates(x, y) {
		let px = this.zigzagDecode(y) / 4095;
		let pz = this.zigzagDecode(x) / 4095;
		return [px * this.tileSize, pz * this.tileSize];
	}

	zigzagDecode(n) {
		return (n >>> 1) ^ -(n & 1);
	}
}
