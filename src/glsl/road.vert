#version 300 es
precision highp float;
in vec3 position;
in vec3 normal;
in vec2 uv;
out vec3 vColor;
out vec3 vNormal;
out vec3 vPosition;
out vec3 vLocalPosition;
out vec2 vUv;
out vec3 vCenter;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
    vCenter = vec3(0);
    int centerIndex = gl_VertexID - 3 * int(float(gl_VertexID) / 3.);
    vCenter[centerIndex] = 1.;

    vColor = vec3(0.2);
    vUv = uv;
    vec3 transformedNormal = normal;
    transformedNormal = vec3(modelViewMatrix * vec4(transformedNormal, 0));
    vNormal = transformedNormal;

    vec3 transformedPosition = position;
    vLocalPosition = transformedPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(transformedPosition, 1.0));
}