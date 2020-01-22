export default class MapMesh {
	constructor(params) {
		this.id = params.id;
		this.tiles = [params.tile];
		this.holder = params.tile;
	}

	setNewParent(params) {
		if(this.holder.objects[this.id].visible) this.holder.hideObject(this.id);

		this.holder = params.tile;

		if(!this.holder.objects[this.id].visible) this.holder.showObject(this.id);

		this.tiles.push(this.holder);
	}

	removeParent(tile) {
		for(let i = 0; i < this.tiles.length; i++) {
			if(tile.id === this.tiles[i].id) {
				this.tiles.splice(i, 1);

				if(tile.id === this.holder.id && this.tiles.length > 0) {
					this.holder = this.tiles[this.tiles.length - 1];
					if(!this.holder.objects[this.id].visible) this.holder.showObject(this.id);
				}

				if(this.tiles.length === 0) this.holder = null;

				return;
			}
		}
	}
}