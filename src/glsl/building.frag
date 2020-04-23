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
flat in int vTextureId;
in vec3 vCenter;

#define WIREFRAME_MODE 0
#define TILE_SIZE 611.496226

uniform sampler2D tNoise;
uniform sampler2DArray tColor;
uniform sampler2DArray tMetalness;
uniform sampler2DArray tRoughness;
uniform sampler2DArray tSpecular;
uniform sampler2DArray tWinColor;
uniform sampler2DArray tWinMetalness;
uniform sampler2DArray tWinRoughness;
uniform sampler2DArray tWinSpecular;
uniform sampler2DArray tWinEmission;
uniform float uSunIntensity;

#include <noise>

#if WIREFRAME_MODE
    float edgeFactor() {
        float widthFactor = 1.;
        vec3 d = fwidth(vCenter.xyz);
        vec3 a3 = smoothstep(vec3(0), d * widthFactor, vCenter.xyz);

        return min(min(a3.x, a3.y), a3.z);
    }
#endif

ivec3 unpackMaterial(int id) {
    int facade = id & 7;
    int window = (id >> 3) & 1;
    int random = id >> 4;

    return ivec3(facade, window, random);
}

void main() {
    #if WIREFRAME_MODE
        if (edgeFactor() > 0.99) discard;
    #endif

    ivec3 materialProps = unpackMaterial(vTextureId);
    int facadeTextureId = materialProps.x - 1;
    int faceId = materialProps.z;
    bool window = materialProps.y == 1;
    bool textured = materialProps.x > 0;

    vec4 diffuse = texture(tColor, vec3(vUv, facadeTextureId));
    float metalness = texture(tMetalness, vec3(vUv, facadeTextureId)).r;
    float roughness = texture(tRoughness, vec3(vUv, facadeTextureId)).r;
    float specular = texture(tSpecular, vec3(vUv, facadeTextureId)).r;
    vec3 emission = vec3(0);

    if(window) {
        diffuse = texture(tWinColor, vec3(vUv, facadeTextureId));
        metalness = texture(tWinMetalness, vec3(vUv, facadeTextureId)).r;
        roughness = texture(tWinRoughness, vec3(vUv, facadeTextureId)).r;
        specular = texture(tWinSpecular, vec3(vUv, facadeTextureId)).r;

        vec2 windowPosition = vUv + vec2(faceId);
        windowPosition.x /= float(faceId / 8) + 2.;

        bool light = noise(floor(windowPosition)) > 0.6;

        if(light && uSunIntensity < 0.3) {
            emission = texture(tWinEmission, vec3(vUv, facadeTextureId)).rgb;
        }
    }

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
    outEmission = vec4(emission, 1);
}
