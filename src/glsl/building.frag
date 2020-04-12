#version 300 es
precision highp float;
precision highp sampler2DArray;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;
in vec3 vColor;
in vec3 vNormal;
in vec3 vPosition;
in vec3 vLocalPosition;
in vec2 vUv;
in float vTextureId;
in vec3 vCenter;

#define WIREFRAME_MODE 0
#define TILE_SIZE 611.496226

uniform sampler2D tNoise;
uniform sampler2DArray tColor;
uniform sampler2DArray tMetalness;
uniform sampler2DArray tRoughness;
uniform sampler2DArray tSpecular;

#if WIREFRAME_MODE
    float edgeFactor() {
        float widthFactor = 1.;
        vec3 d = fwidth(vCenter.xyz);
        vec3 a3 = smoothstep(vec3(0), d * widthFactor, vCenter.xyz);

        return min(min(a3.x, a3.y), a3.z);
    }
#endif

void main() {
    #if WIREFRAME_MODE
        if (edgeFactor() > 0.99) discard;
    #endif

    bool textured = int(vTextureId + 0.5) > 0;

    vec4 diffuse = texture(tColor, vec3(vUv, int(vTextureId - 0.5)));
    float metalness = texture(tMetalness, vec3(vUv, int(vTextureId - 0.5))).r;
    float roughness = texture(tRoughness, vec3(vUv, int(vTextureId - 0.5))).r;
    float specular = texture(tSpecular, vec3(vUv, int(vTextureId - 0.5))).r;

    if(!textured) {
        diffuse = vec4(1) - texture(tNoise, vLocalPosition.xz / TILE_SIZE * 32.) * 0.3 + texture(tNoise, vLocalPosition.xz / TILE_SIZE * 2.) * 0.3;
        diffuse.a = 1.;
        metalness = 0.;
        roughness = 1.;
        specular = 0.01;
    }

    outColor = vec4(vColor, 1) * diffuse;
    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(metalness, roughness, specular, 1);
    outEmission = vec4(0, 0, 0, 1);
}
