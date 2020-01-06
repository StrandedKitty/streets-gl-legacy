#version 300 es
precision highp float;
in vec3 position;
in vec3 color;
in vec3 normal;
in vec2 uv;
in float display;
out vec3 vColor;
out vec3 vNormal;
out vec3 vPosition;
out vec2 vUv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix;

void main() {
    vColor = color;
    vUv = uv;
    vec3 transformedNormal = normal;
    transformedNormal = vec3(normalMatrix * transformedNormal);
    vNormal = transformedNormal;

    vec3 transformedPosition = position;
    if(display == 1.) transformedPosition = vec3(0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = gl_Position.xyz;
}