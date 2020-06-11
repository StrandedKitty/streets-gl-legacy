#version 300 es
precision highp float;
in vec3 position;
out vec3 vPosition;
out vec3 vWorldPosition;
out vec3 vNormal;
out vec4 vClipPos;
out vec4 vClipPosPrev;

#define scale 5000.

uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixPrev;
uniform mat4 projectionMatrix;

void main() {
    vNormal = normalize(position);
    vec3 transformedPosition = position * scale;

    vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
    vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

    vClipPos = projectionMatrix * cameraSpacePosition;
    vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;
    vClipPosPrev.z = cameraSpacePositionPrev.z;
    vPosition = vec3(cameraSpacePosition);

    gl_Position = vClipPos;
}
