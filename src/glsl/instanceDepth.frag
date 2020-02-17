#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
out vec4 outColor;

in vec3 vPosition;

void main() {
    outColor = vec4(vec3(-vPosition.z), 1.);
}
