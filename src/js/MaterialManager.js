import BuildingMaterial from "./materials/BuildingMaterial";
import GroundMaterial from "./materials/GroundMaterial";
import RoadMaterial from "./materials/RoadMaterial";
import WaterMaterial from "./materials/WaterMaterial";
import TreeMaterial from "./materials/TreeMaterial";
import InstanceMaterial from "./materials/InstanceMaterial";

export default class MaterialManager {
	constructor(renderer) {
		this.renderer = renderer;

		this.groups = {};

		this.initMaterials();
	}

	initMaterials() {
		this.groups.building = new BuildingMaterial(this.renderer);
		this.groups.ground = new GroundMaterial(this.renderer);
		this.groups.road = new RoadMaterial(this.renderer);
		this.groups.water = new WaterMaterial(this.renderer);
		this.groups.tree = new TreeMaterial(this.renderer);
		this.groups.instance = new InstanceMaterial(this.renderer);
	}

	getGroup(name) {
		return this.groups[name];
	}

	getDefault(name) {
		return this.groups[name].default;
	}

	getDepth(name) {
		return this.groups[name].depth;
	}
}
