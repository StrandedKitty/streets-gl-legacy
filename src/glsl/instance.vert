#version 300 es
precision highp float;
in vec3 position;
in vec3 normal;
in vec3 iPosition;
out vec3 vPosition;
out vec3 vNormal;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix;

void main() {
    vec3 normal = normalMatrix * normal;
    vNormal = normal;

    vec3 transformedPosition = position + iPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(transformedPosition, 1.0));
}
