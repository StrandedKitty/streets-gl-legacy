#version 300 es
precision highp float;
out vec4 outColor;
in vec3 vPosition;

void main() {
    outColor = vec4(vec3(-vPosition.z), 1.);
}
