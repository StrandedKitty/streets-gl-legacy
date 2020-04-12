#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;
in vec2 vUv;
in vec3 vNormal;
in vec3 vPosition;

uniform sampler2D tDiffuse;

void main() {
    outColor = texture(tDiffuse, vUv * 8. * 64.);
    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(0, 1., 0, 1.);
    outEmission = vec4(0, 0, 0, 1.);
}
