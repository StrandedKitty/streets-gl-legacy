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

uniform sampler2D tSample;

void main() {
    outColor = vec4(vColor, 1.) * texture(tSample, vUv);
    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    float r = 6.5 * (texture(tSample, vUv).x - 216./255.);
    outMetallicRoughness = vec4(0, r * 0.9, (1. - r) * 0.1, 0);
}