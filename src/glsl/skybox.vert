#version 300 es
precision highp float;
in vec3 position;
out vec3 vPosition;
out vec3 vWorldPosition;
out vec3 vNormal;

#define scale 5000.

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vec3 transformedPosition = position * scale;
    mat4 modelViewMatrix = viewMatrix * modelMatrix;
    vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = cameraSpacePosition.xyz;
    vNormal = normalize(position);
    gl_Position = projectionMatrix * cameraSpacePosition;
}
