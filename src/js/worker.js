import Node from "./Node";
import Way from "./Way";
import {tile2degrees, degrees2meters} from "./Utils";
import OSMDescriptor from "./OSMDescriptor";

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
			rel["type"="building"](${bbox});
		);
		out;
		>;
		out;
	`;

	let httpRequest = new XMLHttpRequest();

	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === 200) {
				let data = JSON.parse(httpRequest.responseText).elements;
				processData(data, position[0]);
			} else {
				self.postMessage({code: 'error', error: 'request'});
			}
		}
	};
	httpRequest.open('GET', url);
	httpRequest.send();
}

function processData(data, pivot) {
	let metersPivot = degrees2meters(pivot.lat, pivot.lon);
	let nodes = new Map();
	let ways = new Map();

	let meshData = {
		ids: [],
		offsets: [],
		vertices: [],
		normals: [],
		colors: [],
		instances: {
			trees: []
		}
	};

	let raw = {
		nodes: {},
		ways: {},
		relations: {}
	};

	for(let i = 0; i < data.length; i++) {
		let item = data[i];

		switch (item.type) {
			case 'node':
				raw.nodes[item.id] = item;
				break;
			case 'way':
				raw.ways[item.id] = item;
				break;
			case 'relation':
				raw.relations[item.id] = item;
				break;
		}
	}

	for(let id in raw.nodes) {
		let item = raw.nodes[id];

		let node = new Node(item.id, item.lat, item.lon, item.tags, metersPivot);
		nodes.set(item.id, node);

		meshData.instances.trees = [...meshData.instances.trees, ...node.instances.trees];
	}

	for(let id in raw.ways) {
		let item = raw.ways[id];

		let vertices = [];

		for(let i = 0; i < item.nodes.length; i++) {
			let vertex = nodes.get(item.nodes[i]);
			vertices.push({x: vertex.x, z: vertex.z});
		}

		let way = new Way(item.id, item.nodes, vertices, item.tags);
		ways.set(item.id, way);
	}

	for(let id in raw.relations) {
		let item = raw.relations[id];

		let descriptor = new OSMDescriptor(item.tags);
		let properties = descriptor.properties;

		if(properties.relationType === 'building') {
			for(let i = 0; i < item.members.length; i++) {
				let member = item.members[i];
				if(member.type === 'way' && member.role === 'outline') {
					ways.get(member.ref).visible = false;
				}
			}
		}
	}

	//get geometry for ways

	for (const [id, way] of ways.entries()) {
		way.render();

		if(way.mesh.vertices.length > 0) {
			meshData.ids.push(id);
			meshData.offsets.push(meshData.vertices.length / 3);

			meshData.vertices = [...meshData.vertices, ...way.mesh.vertices];
			meshData.normals = [...meshData.normals, ...way.mesh.normals];
			meshData.colors = [...meshData.colors, ...way.mesh.colors];
		}

		meshData.instances.trees = [...meshData.instances.trees, ...way.instances.trees];
	}

	self.postMessage(meshData);
}