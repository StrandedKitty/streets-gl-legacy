#version 300 es
precision highp float;
in vec3 position;
out vec3 vPosition;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(position, 1.0));
}
