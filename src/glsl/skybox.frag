#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
layout(location = 4) out vec4 outEmission;
in vec3 vColor;
in vec3 vNormal;
in vec3 vPosition;

uniform samplerCube tCube;

void main() {
    vec3 normal = normalize(vNormal);
    outColor = texture(tCube, normal);
    outColor.a = 0.; // unlit
    outNormal = normalize(normal);
    outPosition = vPosition;
    outMetallicRoughness = vec4(0, 0, 0, 0);
    outEmission = vec4(0, 0, 0, 1.);
}
