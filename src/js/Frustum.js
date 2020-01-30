import {toRad, meters2tile, tile2meters, calculateLine} from './Utils';
import vec3 from "./math/vec3";
import Plane from './Plane';

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

	updateViewSpaceVertices() {
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

	split(breaks) {
		const result = [];

		for(let i = 0; i < breaks.length; i++) {
			const cascade = new Frustum();

			if(i === 0) {
				cascade.vertices.near = this.vertices.near;
			} else {
				for(let j = 0; j < 4; j++) {
					cascade.vertices.near.push(vec3.lerp(this.vertices.near[j], this.vertices.far[j], breaks[i - 1]));
				}
			}

			if(i === breaks - 1) {
				cascade.vertices.far = this.vertices.far;
			} else {
				for(let j = 0; j < 4; j++) {
					cascade.vertices.far.push(vec3.lerp(this.vertices.near[j], this.vertices.far[j], breaks[i]))
				}
			}

			result.push(cascade);
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

	static getPlanes(matrix) {
		const planes = new Array(6);

		const me0 = matrix[0], me1 = matrix[1], me2 = matrix[2], me3 = matrix[3];
		const me4 = matrix[4], me5 = matrix[5], me6 = matrix[6], me7 = matrix[7];
		const me8 = matrix[8], me9 = matrix[9], me10 = matrix[10], me11 = matrix[11];
		const me12 = matrix[12], me13 = matrix[13], me14 = matrix[14], me15 = matrix[15];

		planes[0] = new Plane(me3 - me0, me7 - me4, me11 - me8, me15 - me12).normalize();
		planes[1] = new Plane(me3 + me0, me7 + me4, me11 + me8, me15 + me12).normalize();
		planes[2] = new Plane(me3 + me1, me7 + me5, me11 + me9, me15 + me13).normalize();
		planes[3] = new Plane(me3 - me1, me7 - me5, me11 - me9, me15 - me13).normalize();
		planes[4] = new Plane(me3 - me2, me7 - me6, me11 - me10, me15 - me14).normalize();
		planes[5] = new Plane(me3 + me2, me7 + me6, me11 + me10, me15 + me14).normalize();

		return planes;
	}
}
