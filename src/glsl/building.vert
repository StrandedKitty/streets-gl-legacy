#version 300 es
precision highp float;
in vec3 position;
in vec3 color;
in vec3 normal;
in vec2 uv;
in uint textureId;
in float display;
in float fade;
out vec3 vColor;
out vec3 vNormal;
out vec3 vPosition;
out vec3 vLocalPosition;
out vec2 vUv;
flat out int vTextureId;
out vec3 vCenter;
out vec4 vClipPos;
out vec4 vClipPosPrev;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixPrev;
uniform float time;
uniform float timeDelta;

float CubicOut(float k) {
    return --k * k * k + 1.;
}

void main() {
    vCenter = vec3(0);
    int centerIndex = gl_VertexID - 3 * int(float(gl_VertexID) / 3.);
    vCenter[centerIndex] = 1.;

    vColor = color;
    if(display > 0.5) vColor = vec3(1, 0, 0);
    vTextureId = int(textureId);
    vUv = uv;
    vec3 transformedNormal = normal;
    transformedNormal = vec3(modelViewMatrix * vec4(transformedNormal, 0));
    vNormal = transformedNormal;

    vec3 transformedPosition = position;
    if(display > 0.5) transformedPosition = vec3(0);
    if(fade > 0.5) transformedPosition.y *= CubicOut(clamp(time, 0., 1.));
    vLocalPosition = transformedPosition;

    vec4 cameraSpacePosition = modelViewMatrix * vec4(transformedPosition, 1.0);
    vec3 prevPosition = position;
    if(fade > 0.5) prevPosition.y *= CubicOut(clamp(time - timeDelta, 0., 1.));
    vec4 cameraSpacePositionPrev = modelViewMatrixPrev * vec4(prevPosition, 1.0);

    vClipPos = projectionMatrix * cameraSpacePosition;
    vClipPosPrev = projectionMatrix * cameraSpacePositionPrev;
    vClipPosPrev.z = cameraSpacePositionPrev.z;
    vPosition = vec3(cameraSpacePosition);

    gl_Position = vClipPos;
}
