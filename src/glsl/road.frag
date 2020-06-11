#version 300 es
precision highp float;
precision highp sampler2DArray;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;
layout(location = 5) out vec3 outMotion;
in vec3 vColor;
in vec3 vNormal;
in vec3 vPosition;
in vec3 vLocalPosition;
in vec2 vUv;
in vec3 vCenter;
in vec4 vClipPos;
in vec4 vClipPosPrev;

#define WIREFRAME_MODE 0
#define TILE_SIZE 611.496226

#if WIREFRAME_MODE
    float edgeFactor() {
        float widthFactor = 1.;
        vec3 d = fwidth(vCenter.xyz);
        vec3 a3 = smoothstep(vec3(0), d * widthFactor, vCenter.xyz);

        return min(min(a3.x, a3.y), a3.z);
    }
#endif

void clip(vec3 position) {
    if (
        position.x < 0. || position.x >= TILE_SIZE ||
        position.z < 0. || position.z >= TILE_SIZE
    ) discard;
}

void main() {
    #if WIREFRAME_MODE
        if (edgeFactor() > 0.99) discard;
    #endif

    clip(vLocalPosition);

    float metalness = 0.01;
    float roughness = 0.9;
    float specular = 0.01;

    metalness = 0.;
    roughness = 1.;
    specular = 0.01;

    outColor = vec4(vColor, 1.);
    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(metalness, roughness, specular, 1.);
    outEmission = vec4(0, 0, 0, 1);
    outMotion = 0.5 * vec3(vClipPos / vClipPos.w - vClipPosPrev / vClipPosPrev.w);
    outMotion.z = vClipPosPrev.z;
}
