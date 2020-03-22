import Node from "./Node";
import Way from "./Way";
import {tile2degrees, degrees2meters} from "./Utils";
import OSMDescriptor from "./OSMDescriptor";
import ModelUtils from "./ModelUtils";
import * as martinez from 'martinez-polygon-clipping';

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
	let url = 'https://overpass.kumi.systems/api/interpreter?data=';
	//let url = 'https://overpass.nchc.org.tw/api/interpreter?data=';
	const offset = 0.05;
	const position = [
		tile2degrees(x - offset, y + 1 + offset),
		tile2degrees(x + 1 + offset, y - offset)
	];
	const bbox = position[0].lat + ',' + position[0].lon + ',' + position[1].lat + ',' + position[1].lon;

	const pivot = tile2degrees(x, y + 1);

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
				processData(x, y, data, pivot);
			} else {
				console.error('Request error: ' + httpRequest.status);
			}
		}
	};
	httpRequest.open('GET', url);
	httpRequest.send();
}

function processData(x, y, data, pivot) {
	const metersPivot = degrees2meters(pivot.lat, pivot.lon);
	const nodes = new Map();
	const ways = new Map();

	const meshData = {
		ids: [],
		offsets: [],
		vertices: [],
		normals: [],
		colors: [],
		uvs: [],
		textures: [],
		instances: {
			trees: [],
			hydrants: []
		},
		bboxMin: [0, 0, 0],
		bboxMax: [0, 0, 0]
	};

	const roadsData = {
		vertices: [],
		normals: [],
		uvs: [],
		textures: []
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

		for(const instanceName in node.instances) {
			if(node.instances[instanceName].length > 0) {
				meshData.instances[instanceName].push(new Float32Array(node.instances[instanceName]));
			}
		}
	}

	const osmWays = new Map();

	for (const id in raw.ways) {
		const item = raw.ways[id];

		osmWays.set(item.id, item);

		if(item.tags) {
			const way = new Way({
				id: 'w' + item.id,
				tags: item.tags,
				pivot: pivot
			});

			ways.set(item.id, way);

			const vertices = [];

			for (let i = 0; i < item.nodes.length; i++) {
				let vertex = nodes.get(item.nodes[i]);
				vertices.push([vertex.x, vertex.z]);
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
				id: 'm' + item.id,
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
							vertices.push([vertex.x, vertex.z]);
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
								vertices.push([vertex.x, vertex.z]);
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

	for (const way of ways.values()) {
		if (way.properties.buildingPart) {
			for (const way2 of ways.values()) {
				if (!way2.properties.buildingPart && way2.properties.type === 'building') {
					if(way.AABB.intersectsAABB(way2.AABB)) {
						if(!way.geoJson) way.generateGeoJson();
						if(!way2.geoJson) way2.generateGeoJson();

						if(way.geoJson.coordinates.length > 0 && way2.geoJson.coordinates.length > 0) {
							try {
								const t = martinez.intersection(way.geoJson.coordinates, way2.geoJson.coordinates);
								if(t && t.length > 0) way2.visible = false;
							} catch (e) {
								console.error('Building-building:part intersection test failed for ' + way.id + ' and ' + way2.id);
							}
						}
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
				if(way.geometryType === 'building') {
					meshData.ids.push(way.id);
					meshData.offsets.push(vertexOffset / 3);

					vertexOffset += way.mesh.vertices.length;

					meshData.vertices.push(new Float32Array(way.mesh.vertices));
					meshData.normals.push(new Float32Array(way.mesh.normals));
					meshData.colors.push(new Uint8Array(way.mesh.colors));
					meshData.uvs.push(new Float32Array(way.mesh.uvs));
					meshData.textures.push(new Float32Array(way.mesh.textures));
				} else if(way.geometryType === 'road') {
					roadsData.vertices.push(new Float32Array(way.mesh.vertices));
					roadsData.normals.push(new Float32Array(way.mesh.normals));
					roadsData.uvs.push(new Float32Array(way.mesh.uvs));
					roadsData.textures.push(new Float32Array(way.mesh.textures));
				}
			}


			for(const instanceName in way.instances) {
				if(way.instances[instanceName].length > 0) {
					meshData.instances[instanceName].push(new Float32Array(way.instances[instanceName]));
				}
			}
		}
	}

	meshData.vertices = ModelUtils.mergeTypedArrays(meshData.vertices);
	meshData.normals = ModelUtils.mergeTypedArrays(meshData.normals);
	meshData.colors = ModelUtils.mergeTypedArrays(meshData.colors);
	meshData.uvs = ModelUtils.mergeTypedArrays(meshData.uvs);
	meshData.textures = ModelUtils.mergeTypedArrays(meshData.textures);

	roadsData.vertices = ModelUtils.mergeTypedArrays(roadsData.vertices);
	roadsData.normals = ModelUtils.mergeTypedArrays(roadsData.normals);
	roadsData.uvs = ModelUtils.mergeTypedArrays(roadsData.uvs);

	for(const instanceName in meshData.instances) {
		meshData.instances[instanceName] = ModelUtils.mergeTypedArrays(meshData.instances[instanceName]);
	}

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

	self.postMessage({x, y, mesh: {buildings: meshData, roads: roadsData}});
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
