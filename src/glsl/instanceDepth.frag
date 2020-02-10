#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
out vec4 outColor;

in vec3 vNormal;
in vec3 vPosition;
in vec2 vUv;
flat in int vMesh;

uniform sampler2D tDiffuse[2];

vec3 derivativeNormal(const vec3 position) {
    vec3 x = dFdx(position);
    vec3 y = dFdy(position);
    return normalize(cross(x, y));
}

vec4 readDiffuse(const vec2 uv) {
    if(vMesh == 0) return texture(tDiffuse[0], uv);
    if(vMesh == 1) return texture(tDiffuse[1], uv);
    else return vec4(1, 0, 1, 1);
}

vec4 readDiffuseLod(const vec2 uv, const float lod) {
    if(vMesh == 0) return textureLod(tDiffuse[0], uv, lod);
    if(vMesh == 1) return textureLod(tDiffuse[1], uv, lod);
    else return vec4(1, 0, 1, 1);
}

void main() {
    if(readDiffuseLod(vUv, 0.).a < 0.5) discard;

    outColor = vec4(vec3(-vPosition.z), 1.);
}
