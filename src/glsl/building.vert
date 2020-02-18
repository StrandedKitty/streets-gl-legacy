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
out vec3 vLocalPosition;
out vec2 vUv;
out float vTextureId;
out vec3 vCenter;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float time;

float CubicOut(float k) {
    return --k * k * k + 1.;
}

void main() {
    vCenter = vec3(0);
    int centerIndex = gl_VertexID - 3 * int(float(gl_VertexID) / 3.);
    vCenter[centerIndex] = 1.;

    vColor = color;
    if(display > 0.5) vColor = vec3(1, 0, 0);
    vTextureId = textureId;
    vUv = uv;
    vec3 transformedNormal = normal;
    transformedNormal = vec3(modelViewMatrix * vec4(transformedNormal, 0));
    vNormal = transformedNormal;

    vec3 transformedPosition = position;
    if(display > 0.5) transformedPosition = vec3(0);
    if(fade > 0.5) transformedPosition.y *= CubicOut(clamp(time, 0., 1.));
    vLocalPosition = transformedPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(transformedPosition, 1.0));
}
