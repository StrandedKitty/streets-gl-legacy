#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
in vec3 vColor;
in vec3 vNormal;
in vec3 vPosition;
in vec2 vUv;
in float vTextureId;
in vec3 vCenter;

#define WIREFRAME_MODE 0

uniform sampler2D tDiffuse[2];

#if WIREFRAME_MODE
    float edgeFactor() {
        float widthFactor = 1.;
        vec3 d = fwidth(vCenter.xyz);
        vec3 a3 = smoothstep(vec3(0), d * widthFactor, vCenter.xyz);

        return min(min(a3.x, a3.y), a3.z);
    }
#endif

vec4 getValueFromSamplerArray(float i, vec2 uv) {
    if (i < 0.5) {
        return vec4(1);
    } else if (i < 1.5) {
        return texture(tDiffuse[0], uv);
    } else if (i < 2.5) {
        return texture(tDiffuse[1], uv);
    }

    return vec4(1);
}

void main() {
    #if WIREFRAME_MODE
        if (edgeFactor() > 0.99) discard;
    #endif

    vec4 diffuse = getValueFromSamplerArray(vTextureId, vUv);

    outColor = vec4(vColor, 1.) * diffuse;
    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    float r = diffuse.x;
    outMetallicRoughness = vec4(0.01, r == 0.9 ? 1. : r * 0.8, r == 1. ? 0. : (1. - r) * 0.1, 1.);
}
