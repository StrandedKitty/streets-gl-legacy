import {degrees2meters} from "./Utils";
import OSMDescriptor from "./OSMDescriptor";

export default class Node {
	constructor(id, lat, lon, tags, pivot) {
		this.id = id;
		this.lat = lat;
		this.lon = lon;
		this.tags = tags || {};
		this.instances = {
			trees: [],
			hydrants: []
		};

		this.tileSize = 40075016.7 / (1 << 16);

		let position = degrees2meters(this.lat, this.lon);

		this.x = position.x - pivot.x;
		this.z = position.z - pivot.z;

		this.descriptor = new OSMDescriptor(this.tags);
		this.properties = this.descriptor.properties;

		this.render();
	}

	render() {
		if(this.properties.type === 'tree' && this.inTile) {
			this.instances.trees.push(this.x, this.z);
		}

		if(this.properties.type === 'hydrant' && this.inTile) {
			this.instances.hydrants.push(this.x, this.z);
		}
	}

	get inTile() {
		return this.x >= 0 && this.x < this.tileSize && this.z >= 0 && this.z < this.tileSize;
	}
}
