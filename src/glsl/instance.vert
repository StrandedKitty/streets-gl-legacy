#version 300 es
precision highp float;
in vec3 position;
in vec3 normal;
in vec2 uv;
in float mesh;
in vec3 iPosition;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vUv;
flat out int vMesh;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix;

void main() {
    vUv = uv;
    vMesh = int(mesh);

    vec3 normal = normalize(normalMatrix * normal);
    vNormal = normal;

    vec3 transformedPosition = position;
    transformedPosition += iPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(transformedPosition, 1.0));
}
