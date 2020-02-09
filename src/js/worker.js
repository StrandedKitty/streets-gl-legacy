import Node from "./Node";
import Way from "./Way";
import {tile2degrees, degrees2meters} from "./Utils";
import OSMDescriptor from "./OSMDescriptor";
import ModelUtils from "./ModelUtils";

const classifyPoint = require("robust-point-in-polygon");

self.addEventListener('message', function (e) {
	let code = e.data.code;
	switch (code) {
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
		 	rel["type"="multipolygon"]["building"](${bbox});
		 	rel["type"="multipolygon"]["building:part"](${bbox});
		)->.data;
		
		.data > ->.dataMembers;
		
		(
			.data;
			.dataMembers;
		)->.all;
		
		.all out body qt;
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

	const meshData = {
		ids: [],
		offsets: [],
		vertices: [],
		normals: [],
		colors: [],
		uvs: [],
		textures: [],
		instances: {
			trees: []
		},
		bboxMin: [0, 0, 0],
		bboxMax: [0, 0, 0]
	};

	const meshArrays = {
		vertices: [],
		normals: [],
		colors: [],
		uvs: [],
		textures: [],
		instances: {
			trees: []
		}
	};

	const raw = {
		nodes: {},
		ways: {},
		relations: {}
	};

	for (let i = 0; i < data.length; i++) {
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

	for (let id in raw.nodes) {
		const item = raw.nodes[id];

		const node = new Node(item.id, item.lat, item.lon, item.tags, metersPivot);
		nodes.set(item.id, node);

		meshArrays.instances.trees.push(new Float32Array(node.instances.trees));
	}

	const osmWays = new Map();

	for (const id in raw.ways) {
		const item = raw.ways[id];

		osmWays.set(item.id, item);

		if(item.tags) {
			const way = new Way({
				id: item.id,
				tags: item.tags,
				pivot: pivot
			});

			ways.set(item.id, way);

			const vertices = [];

			for (let i = 0; i < item.nodes.length; i++) {
				let vertex = nodes.get(item.nodes[i]);
				vertices.push({x: vertex.x, z: vertex.z});
			}

			way.addRing({
				type: 'outer',
				id: item.id,
				nodes: item.nodes,
				vertices: vertices
			});
		}
	}

	for (const id in raw.relations) {
		const item = raw.relations[id];

		const descriptor = new OSMDescriptor(item.tags);
		const properties = descriptor.properties;

		if (properties.relationType === 'building') {
			for (let i = 0; i < item.members.length; i++) {
				const member = item.members[i];

				if (member.type === 'way' && member.role === 'outline') {
					ways.get(member.ref).visible = false;
				}
			}
		} else if (properties.relationType === 'multipolygon') {
			const way = new Way({
				id: item.id,
				tags: item.tags,
				pivot: pivot
			});

			ways.set(item.id, way);

			const rings = [];

			for (let i = 0; i < item.members.length; i++) {
				item.members[i].assigned = false;
			}

			for (let i = 0; i < item.members.length; i++) {
				const relationMember = item.members[i];
				const role = item.members[i].role;
				const member = osmWays.get(item.members[i].ref);

				if(member && !relationMember.assigned) {
					let start = member.nodes[0];
					let end = member.nodes[member.nodes.length - 1];

					if(start === end) { // the current ring is closed
						const vertices = [];

						for (let i = 0; i < member.nodes.length; i++) {
							let vertex = nodes.get(member.nodes[i]);
							vertices.push({x: vertex.x, z: vertex.z});
						}

						rings.push({
							type: role,
							id: member.id,
							nodes: member.nodes,
							vertices: vertices
						});

						relationMember.assigned = true;
					} else { // the current ring is not closed
						relationMember.assigned = true;

						let ringNodes = member.nodes.slice();

						let partFound = true;

						while(partFound) {
							partFound = false;
							for (let j = 0; j < item.members.length; j++) {
								const part = osmWays.get(item.members[j].ref);

								start = ringNodes[0];
								end = ringNodes[ringNodes.length - 1];

								if(part && !item.members[j].assigned && item.members[j].role === role) {
									const joined = joinWays(ringNodes, part.nodes);
									if(joined) {
										ringNodes = joined;
										item.members[j].assigned = true;
										relationMember.assigned = true;
										partFound = true;
										break;
									}
								}
							}
						}

						if(ringNodes[0] === ringNodes[ringNodes.length - 1]) {
							const vertices = [];

							for (let i = 0; i < ringNodes.length; i++) {
								let vertex = nodes.get(ringNodes[i]);
								vertices.push({x: vertex.x, z: vertex.z});
							}

							rings.push({
								type: role,
								id: member.id,
								nodes: ringNodes,
								vertices: vertices
							});
						} else {
							console.log('Ring assignment for relation '+ item.id +' with way '+ item.members[i].ref +' has failed');
						}
					}
				}
			}

			for(let i = 0; i < rings.length; i++) {
				way.addRing(rings[i]);
			}
		}
	}

	/*for (const way of ways.values()) {
		if (way.properties.buildingPart) {
			let verticesA = [];
			for (let i = 0; i < way.vertices.length; i++) verticesA.push([way.vertices[i].x, way.vertices[i].z]);

			for (const way2 of ways.values()) {
				if (!way2.properties.buildingPart && way2.properties.type === 'building') {
					let intersection = way.AABB.intersectsAABB(way2.AABB);

					if(intersection) {
						let verticesB = [];

						for (let i = 0; i < way2.vertices.length; i++) verticesB.push([way2.vertices[i].x, way2.vertices[i].z]);

						if (intersect(verticesA, verticesB)) way2.visible = false;
					}
				}
			}
		}
	}*/

	for (const way of ways.values()) {
		if (way.properties.buildingPart) {
			for (const way2 of ways.values()) {
				if (!way2.properties.buildingPart && way2.properties.type === 'building') {
					if(way.AABB.intersectsAABB(way2.AABB)) {
						if (intersectMultipolygons(way.rings, way2.rings)) way2.visible = false;
					}
				}
			}
		}
	}

	//get geometry for ways

	let vertexOffset = 0;

	for (const [id, way] of ways.entries()) {
		if(way.visible) {
			way.render();

			if (way.mesh.vertices.length > 0) {
				meshData.ids.push(id);
				meshData.offsets.push(vertexOffset / 3);

				vertexOffset += way.mesh.vertices.length;

				meshArrays.vertices.push(new Float32Array(way.mesh.vertices));
				meshArrays.normals.push(new Float32Array(way.mesh.normals));
				meshArrays.colors.push(new Uint8Array(way.mesh.colors));
				meshArrays.uvs.push(new Float32Array(way.mesh.uvs));
				meshArrays.textures.push(new Float32Array(way.mesh.textures));
			}

			meshArrays.instances.trees.push(way.instances.trees);
		}
	}

	meshData.vertices = ModelUtils.mergeTypedArrays(meshArrays.vertices);
	meshData.normals = ModelUtils.mergeTypedArrays(meshArrays.normals);
	meshData.colors = ModelUtils.mergeTypedArrays(meshArrays.colors);
	meshData.uvs = ModelUtils.mergeTypedArrays(meshArrays.uvs);
	meshData.textures = ModelUtils.mergeTypedArrays(meshArrays.textures);
	meshData.instances.trees = ModelUtils.mergeTypedArrays(meshArrays.instances.trees);

	const tileSize = 40075016.7 / (1 << 16);

	meshData.bboxMin = [0, 0, 0];
	meshData.bboxMax = [tileSize, 500, tileSize];

	if(meshData.vertices.length > 0) {
		const v = meshData.vertices;

		for(let i = 0; i < v.length / 3; i++) {
			meshData.bboxMin[0] = Math.min(meshData.bboxMin[0], v[i * 3]);
			meshData.bboxMin[1] = Math.min(meshData.bboxMin[1], v[i * 3 + 1]);
			meshData.bboxMin[2] = Math.min(meshData.bboxMin[2], v[i * 3 + 2]);

			meshData.bboxMax[0] = Math.max(meshData.bboxMax[0], v[i * 3]);
			meshData.bboxMax[1] = Math.max(meshData.bboxMax[1], v[i * 3 + 1]);
			meshData.bboxMax[2] = Math.max(meshData.bboxMax[2], v[i * 3 + 2]);
		}
	}

	self.postMessage(meshData);
}

/*function intersect(p0, p1) {
	let i;

	for (i = 0; i < p0.length; ++i) {
		const res = classifyPoint(p1, p0[i]);
		if (res === -1) {
			return true;
		}
	}

	for (i = 0; i < p1.length; ++i) {
		const res = classifyPoint(p0, p1[i]);
		if (res === -1) {
			return true;
		}
	}

	return false;
}*/

function intersectMultipolygons(p0, p1) {
	const points0 = [];
	const points1 = [];

	for (let i = 0; i < p0.length; i++) {
		for (let j = 0; j < p0[i].vertices.length; j++) points0.push([p0[i].vertices[j].x, p0[i].vertices[j].z]);
	}

	for (let i = 0; i < p1.length; i++) {
		for (let j = 0; j < p1[i].vertices.length; j++) points1.push([p1[i].vertices[j].x, p1[i].vertices[j].z]);
	}

	for (let i = 0; i < p0.length; i++) {
		if (p0[i].type === 'outer') {
			const polygon = [];

			for (let j = 0; j < p0[i].vertices.length; j++) polygon.push([p0[i].vertices[j].x, p0[i].vertices[j].z]);

			for (let j = 0; j < points1.length; j++) {
				if (classifyPoint(polygon, points1[j]) === -1) {
					return true;
				}
			}
		}
	}

	for (let i = 0; i < p1.length; i++) {
		if (p1[i].type === 'outer') {
			const polygon = [];

			for (let j = 0; j < p1[i].vertices.length; j++) polygon.push([p1[i].vertices[j].x, p1[i].vertices[j].z]);

			for (let j = 0; j < points0.length; j++) {
				if (classifyPoint(polygon, points0[j]) === -1) {
					return true;
				}
			}
		}
	}

	return false;
}

function joinWays(nodesA, nodesB) {
	let result = [];

	const endA = nodesA.length - 1;
	const endB = nodesB.length - 1;

	if(nodesA[0] === nodesB[0]) {
		result = [...nodesA.slice(1).reverse(), ...nodesB];
		return result;
	}

	if(nodesA[endA] === nodesB[endB]) {
		result = [...nodesA, ...nodesB.reverse().slice(1)];
		return result;
	}

	if(nodesA[0] === nodesB[endB]) {
		result = [...nodesB, ...nodesA.slice(1)];
		return result;
	}

	if(nodesA[endA] === nodesB[0]) {
		result = [...nodesA, ...nodesB.slice(1)];
		return result;
	}

	return null;
}
