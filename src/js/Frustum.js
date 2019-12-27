import {toRad, meters2tile, tile2meters, calculateLine} from './Utils';
import vec3 from "./math/vec3";

export default class Frustum {
	constructor(fov, aspect, near, far) {
		this.fov = fov;
		this.aspect = aspect;
		this.near = near;
		this.far = far;

		this.vertices = {
			near: [],
			far: []
		};
	}

	getViewSpaceVertices() {
		this.nearPlaneY = this.near * Math.tan(toRad(this.fov / 2));
		this.nearPlaneX = this.aspect * this.nearPlaneY;

		this.farPlaneY = this.far * Math.tan(toRad(this.fov / 2));
		this.farPlaneX = this.aspect * this.farPlaneY;

		this.vertices.near.length = 0;
		this.vertices.far.length = 0;

		// 3 --- 0  vertices.near/far order
		// |     |
		// 2 --- 1

		this.vertices.near.push(
			new vec3(this.nearPlaneX, this.nearPlaneY, -this.near),
			new vec3(this.nearPlaneX, -this.nearPlaneY, -this.near),
			new vec3(-this.nearPlaneX, -this.nearPlaneY, -this.near),
			new vec3(-this.nearPlaneX, this.nearPlaneY, -this.near)
		);

		this.vertices.far.push(
			new vec3(this.farPlaneX, this.farPlaneY, -this.far),
			new vec3(this.farPlaneX, -this.farPlaneY, -this.far),
			new vec3(-this.farPlaneX, -this.farPlaneY, -this.far),
			new vec3(-this.farPlaneX, this.farPlaneY, -this.far)
		);

		return this.vertices;
	}

	toSpace(cameraMatrix) {
		let result = new Frustum(this.fov, this.aspect, this.near, this.far);
		let point;

		for(let i = 0; i < 4; i++) {
			point = this.vertices.near[i];
			point = vec3.applyMatrix(point, cameraMatrix);
			result.vertices.near.push(point);

			point = this.vertices.far[i];
			point = vec3.applyMatrix(point, cameraMatrix);
			result.vertices.far.push(point);
		}

		return result;
	}

	project() {
		let points = {
			near: [],
			far: []
		};

		let fv, ratio, intersection;

		if(this.vertices.far[1].y > 0 && this.vertices.far[2].y > 0) {
			return [];
		} else {
			fv = vec3.sub(this.vertices.far[1], this.vertices.near[1]);
			ratio = this.vertices.near[1].y / fv.y;
			fv = vec3.multiplyScalar(fv, ratio);
			intersection = vec3.sub(this.vertices.near[1], fv);
			points.near.push(intersection);

			fv = vec3.sub(this.vertices.far[2], this.vertices.near[2]);
			ratio = this.vertices.near[2].y / fv.y;
			fv = vec3.multiplyScalar(fv, ratio);
			intersection = vec3.sub(this.vertices.near[2], fv);
			points.near.push(intersection);

			if(this.vertices.far[3].y > 0 && this.vertices.far[0].y > 0) {
				fv = vec3.sub(this.vertices.far[1], this.vertices.far[0]);
				ratio = this.vertices.far[0].y / fv.y;
				fv = vec3.multiplyScalar(fv, ratio);
				intersection = vec3.sub(this.vertices.far[0], fv);
				points.far.push(intersection);

				fv = vec3.sub(this.vertices.far[2], this.vertices.far[3]);
				ratio = this.vertices.far[3].y / fv.y;
				fv = vec3.multiplyScalar(fv, ratio);
				intersection = vec3.sub(this.vertices.far[3], fv);
				points.far.push(intersection);
			} else {
				fv = vec3.sub(this.vertices.far[0], this.vertices.near[0]);
				ratio = this.vertices.near[0].y / fv.y;
				fv = vec3.multiplyScalar(fv, ratio);
				intersection = vec3.sub(this.vertices.near[0], fv);
				points.far.push(intersection);

				fv = vec3.sub(this.vertices.far[3], this.vertices.near[3]);
				ratio = this.vertices.near[3].y / fv.y;
				fv = vec3.multiplyScalar(fv, ratio);
				intersection = vec3.sub(this.vertices.near[3], fv);
				points.far.push(intersection);
			}
		}

		return points;
	}

	getTiles(cameraPosition, zoom = 16) {
		const intersections = this.project();
		let points = [];

		points.push(meters2tile(intersections.near[0].x, intersections.near[0].z, zoom));
		points.push(meters2tile(intersections.far[0].x, intersections.far[0].z, zoom));
		points.push(meters2tile(intersections.far[1].x, intersections.far[1].z, zoom));
		points.push(meters2tile(intersections.near[1].x, intersections.near[1].z, zoom));

		let borders = [];

		for(let i = 0; i < 4; i++) {
			let next = i + 1 > 3 ? 0 : i + 1;
			let data = calculateLine([points[i].x, points[i].y], [points[next].x, points[next].y]);

			for(let j = 0; j < data.length; j++) {
				borders.push(data[j]);
			}
		}

		let r;
		borders = borders.filter((r={},a=>!(r[a]=++r[a]|0)));

		let tileYs = [];

		for(let i = 0; i < borders.length; i++) {
			tileYs.push(borders[i][1]);
		}

		tileYs = tileYs.filter((v,i) => tileYs.indexOf(v) === i);
		tileYs = tileYs.sort((a,b) => a-b);

		let tiles = [];

		for(let i = 0; i < tileYs.length; i++) {
			const currentTileY = tileYs[i];

			let row = [];
			for(let j = 0; j < borders.length; j++) {
				if(borders[j][1] === currentTileY) row.push(borders[j][0]);
			}
			row = row.sort((a,b) => a-b);

			let cell = row[0];
			let index = 0;
			while(cell <= row[row.length-1]) {
				tiles.push([cell, currentTileY]);
				if(row[index+1] > cell + 1) {
					row.splice(index + 1, 0, cell + 1);
				}
				index++;
				cell = row[index];
			}
		}

		let tilesList = [];

		for(let i = 0; i < tiles.length; i++) {
			const worldPosition = tile2meters(tiles[i][0] + 0.5, tiles[i][1] + 0.5, zoom);
			tilesList.push({
				distance: Math.sqrt((worldPosition.x - cameraPosition.x) ** 2 + (worldPosition.z - cameraPosition.z) ** 2),
				x: tiles[i][0],
				y: tiles[i][1]
			});
		}

		tilesList.sort((a, b) => (a.distance > b.distance) ? 1 : -1);

		return tilesList;
	}
}