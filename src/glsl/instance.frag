#version 300 es
precision highp float;
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec3 outNormal;
layout(location = 2) out vec3 outPosition;
layout(location = 3) out vec4 outMetallicRoughness;
in vec3 vNormal;
in vec3 vPosition;

vec3 derivateNormal(const vec3 position) {
    vec3 x = dFdx(position);
    vec3 y = dFdy(position);
    return normalize(cross(x, y));
}

void main() {
    vec4 diffuse = vec4(0, 1, 0, 1);
    float metalness = 0.01;
    float roughness = 1.;
    float specular = 0.01;

    outColor = diffuse;
    outNormal = derivateNormal(vPosition) * 0.5 + 0.5;
    outPosition = vPosition;
    outMetallicRoughness = vec4(metalness, roughness, specular, 1.);
}
