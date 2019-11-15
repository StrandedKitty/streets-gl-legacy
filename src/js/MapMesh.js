export default class MapMesh {
	constructor(id, tile, offset, size) {
		this.id = id;
		this.tiles = [tile];
		this.holder = tile;
		this.offset = offset;
		this.size = size;
	}

	addParent(tile) {
		this.holder.hideObject(this.offset, this.size);
		this.holder = tile;

		for(let i = 0; i < this.tiles.length; i++) {
			if(this.tiles[i].id === tile.id) {
				this.tiles.splice(i, 1);
				break;
			}
		}

		this.tiles.push(tile);
	}

	removeParent(tile) {
		for(let i = 0; i < this.tiles.length; i++) {
			if(tile.id === this.tiles[i].id) {
				this.tiles.splice(i, 1);

				if(tile.id === this.holder.id) {
					this.holder = this.tiles[this.tiles.length - 1];
					this.holder.showObject(this.offset, this.size);
				}

				break;
			}
		}
	}
}