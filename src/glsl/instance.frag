#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
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
    vec4 diffuse = readDiffuse(vUv);
    vec4 diffuseLod0 = readDiffuseLod(vUv, 0.);
    if(diffuseLod0.a < 0.5) discard;
    if(diffuse.a < 1.) diffuse = diffuseLod0;

    float metalness = 0.01;
    float roughness = 0.9;
    float specular = 0.01;

    outColor = vec4(diffuse.rgb, 1.);
    vec3 normal = vNormal * (float(gl_FrontFacing) * 2.0 - 1.0);
    outNormal = normal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(metalness, roughness, specular, 1.);
}
