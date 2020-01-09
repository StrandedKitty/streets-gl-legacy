#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;
out vec3 vPosition;
out vec2 vUv;
out vec3 vNormal;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix;

void main() {
    vUv = uv;
    vec3 normal = normalMatrix * vec3(0, 1, 0);
    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(position, 1.0));
}