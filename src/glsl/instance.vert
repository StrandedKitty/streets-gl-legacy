#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
in vec3 position;
in vec3 normal;
in vec2 uv;
in uint mesh;
in vec3 iPosition;
in uint iTile;
in uint iTilePivot;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vUv;
flat out int vMesh;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix;

#define TILE_SIZE 611.496226

vec2 decodeTile(uint tileId) {
    float y = float(tileId / uint(65536));
    float x = float(tileId % uint(65536));

    float rz = (TILE_SIZE * x) - 20037508.34;
    float rx = 20037508.34 - (TILE_SIZE * y);

    return vec2(rx, rz);
}

vec2 decodeId(uint id) {
    float y = float(id / uint(65536));
    float x = float(id % uint(65536));

    return vec2(x, y);
}

void main() {
    vUv = uv;
    vMesh = int(mesh);

    vec3 normal = normalize(normalMatrix * normal);
    vNormal = normal;

    vec3 transformedPosition = position;
    transformedPosition += iPosition;
    transformedPosition.xz += decodeTile(iTile) - decodeTile(iTilePivot);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(transformedPosition, 1.0));
}
