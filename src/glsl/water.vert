#version 300 es
precision highp float;
in vec3 position;
in vec3 normal;
out vec3 vNormal;
out vec3 vPosition;
out vec3 vLocalPosition;
out vec2 vUv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
    vec3 normal = vec3(modelViewMatrix * vec4(0, 1, 0, 0));
    vNormal = normal;

    vec3 transformedPosition = position;

    vUv = position.xz;
    vLocalPosition = transformedPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(transformedPosition, 1.0));
}
