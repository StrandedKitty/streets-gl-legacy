#version 300 es
precision highp float;
in vec3 position;
in vec3 color;
in vec3 normal;
in vec2 uv;
in float textureId;
in float display;
in float fade;
out vec3 vColor;
out vec3 vNormal;
out vec3 vPosition;
out vec2 vUv;
out float vTextureId;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat3 normalMatrix;
uniform float time;

float CubicOut(float k) {
    return --k * k * k + 1.;
}

void main() {
    vColor = color;
    if(display > 0.5) vColor = vec3(1, 0, 0);
    vTextureId = textureId;
    vUv = uv;
    vec3 transformedNormal = normal;
    transformedNormal = vec3(normalMatrix * transformedNormal);
    vNormal = transformedNormal;

    vec3 transformedPosition = position;
    if(display > 0.5) transformedPosition = vec3(0);
    if(fade > 0.5) transformedPosition.y *= CubicOut(clamp(time, 0., 1.));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(transformedPosition, 1.0));
}