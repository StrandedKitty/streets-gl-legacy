#version 300 es
precision highp float;
in vec3 position;
in vec3 normal;
out vec3 vNormal;
out vec3 vPosition;
out vec3 vLocalPosition;
out vec2 vUv;
out vec4 vClipPos;
out vec4 vClipPosPrev;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixPrev;

void main() {
    vec3 normal = vec3(modelViewMatrix * vec4(0, 1, 0, 0));
    vNormal = normal;

    vec3 transformedPosition = position;

    vUv = position.xz;
    vLocalPosition = transformedPosition;

    vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
    vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(transformedPosition, 1.0);

    vClipPos = projectionMatrix * cameraSpacePosition;
    vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;
    vClipPosPrev.z = cameraSpacePositionPrev.z;
    vPosition = vec3(cameraSpacePosition);

    gl_Position = vClipPos;
}
