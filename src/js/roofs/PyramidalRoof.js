import polylabel from 'polylabel';
import vec3 from "../math/vec3";
import {calculateNormal} from "../Utils";

export default class PyramidalRoof {
    constructor(params) {
        this.way = params.way;
        this.height = params.height;
        this.buildingHeight = params.buildingHeight;
        this.color = params.color;

        this.mesh = {
            vertices: [],
            normals: [],
            colors: []
        };
        
        this.build();
    }

    build() {
        let ring;

        for(let i = 0; i < this.way.rings.length; i++) {
            if(this.way.rings[i].type === 'outer') {
                ring = this.way.rings[i];
                break;
            }
        }

        if(ring) {
            const vertices = ring.vertices.slice(0, -1);
            const center = polylabel([vertices], 1);

            const dims = {
                a: this.buildingHeight,
                b: this.height
            };

            for(let i = 0; i < vertices.length; i++) {
                const vertex = vertices[i];
                const nextVertex = vertices[i + 1] || vertices[0];

                const triangle = [
                    [vertex[0], dims.a, vertex[1]],
                    [nextVertex[0], dims.a, nextVertex[1]],
                    [center[0], dims.a + dims.b, center[1]]
                ];

                this.mesh.vertices.push(
                    ...triangle[0],
                    ...triangle[1],
                    ...triangle[2]
                );

                const normal = calculateNormal(
                    new vec3(...triangle[0]),
                    new vec3(...triangle[1]),
                    new vec3(...triangle[2])
                );

                for(let j = 0; j < 3; j++) {
                    this.mesh.normals.push(normal.x, normal.y, normal.z);
                    this.mesh.colors.push(...this.color);
                }
            }
        }
    }
}