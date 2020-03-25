import polylabel from 'polylabel';
import vec3 from "../math/vec3";
import {calculateNormal} from "../Utils";
import vec2 from "../math/vec2";

export default class DomeRoof {
    constructor(params) {
        this.way = params.way;
        this.height = params.height;
        this.buildingHeight = params.buildingHeight;
        this.color = params.color;
        this.steps = 6;

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
            const centerVec = new vec2(center[0], center[1]);

            const dims = {
                a: this.buildingHeight,
                b: this.height
            };

            for(let i = 0; i < vertices.length; i++) {
                const vertex = new vec2(vertices[i][0], vertices[i][1]);
                const nextVertex = vertices[i - 1] ?
                    new vec2(vertices[i - 1][0], vertices[i - 1][1]) :
                    new vec2(vertices[vertices.length - 1][0], vertices[vertices.length - 1][1]);

                const angleStep = Math.PI / (2 * this.steps);

                const v1 = vec2.sub(centerVec, vertex);
                const v2 = vec2.sub(centerVec, nextVertex);

                let x1, x2, y1, y2, d1, d2;
                let px1, px2, py1, py2, pd1, pd2;

                for(let j = 1; j <= this.steps; j++) {
                    x1 = 1 - Math.cos(j * angleStep);
                    y1 = Math.sin(j * angleStep) * dims.b + dims.a;
                    d1 = vec2.add(vertex, vec2.multiplyScalar(v1, x1));

                    px1 = 1 - Math.cos((j - 1) * angleStep);
                    py1 = Math.sin((j - 1) * angleStep) * dims.b + dims.a;
                    pd1 = vec2.add(vertex, vec2.multiplyScalar(v1, px1));

                    x2 = 1 - Math.cos(j * angleStep);
                    y2 = Math.sin(j * angleStep) * dims.b + dims.a;
                    d2 = vec2.add(nextVertex, vec2.multiplyScalar(v2, x2));

                    px2 = 1 - Math.cos((j - 1) * angleStep);
                    py2 = Math.sin((j - 1) * angleStep) * dims.b + dims.a;
                    pd2 = vec2.add(nextVertex, vec2.multiplyScalar(v2, px2));

                    const tris = [
                        [
                            [pd1.x, py1, pd1.y],
                            [d2.x, y2, d2.y],
                            [pd2.x, py2, pd2.y]
                        ], [
                            [pd1.x, py1, pd1.y],
                            [d1.x, y1, d1.y],
                            [d2.x, y2, d2.y]
                        ]
                    ];

                    this.mesh.vertices.push(
                        ...tris[0][0],
                        ...tris[0][1],
                        ...tris[0][2],
                        ...tris[1][0],
                        ...tris[1][1],
                        ...tris[1][2]
                    );

                    const normals = [
                        calculateNormal(
                            new vec3(...tris[0][0]),
                            new vec3(...tris[0][1]),
                            new vec3(...tris[0][2])
                        ),
                        calculateNormal(
                            new vec3(...tris[1][0]),
                            new vec3(...tris[1][1]),
                            new vec3(...tris[1][2])
                        ),
                    ];

                    for(let j = 0; j < 3; j++) {
                        this.mesh.normals.push(normals[0].x, normals[0].y, normals[0].z);
                        this.mesh.colors.push(...this.color);
                    }

                    for(let j = 0; j < 3; j++) {
                        this.mesh.normals.push(normals[1].x, normals[1].y, normals[1].z);
                        this.mesh.colors.push(...this.color);
                    }
                }
            }
        }
    }
}
