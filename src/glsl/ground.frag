#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

uniform sampler2D sampleTexture;

void main() {
    outColor = texture(sampleTexture, vUv);
    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
}