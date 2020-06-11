#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;
layout(location = 5) out vec3 outMotion;
in vec3 vColor;
in vec3 vNormal;
in vec3 vPosition;
in vec4 vClipPos;
in vec4 vClipPosPrev;

uniform samplerCube tCube;

void main() {
    outColor = texture(tCube, vNormal);
    outColor.a = 0.; // unlit
    outNormal = vNormal * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(0, 0, 0, 0);
    outEmission = vec4(0, 0, 0, 1.);
    outMotion = 0.5 * vec3(vClipPos / vClipPos.w - vClipPosPrev / vClipPosPrev.w);
    outMotion.z = vClipPosPrev.z;
}
