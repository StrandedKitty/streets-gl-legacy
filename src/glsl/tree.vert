#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler2DArray;

in vec3 position;
in vec3 normal;
in vec2 uv;
in vec3 iPosition;
in vec2 iOffset;
in uint iId;
in uint iType;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vUv;
flat out int vInstanceID;
flat out int vType;

uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

#include <noise>

mat2 rotate2d(float angle){
    return mat2(
        cos(angle), -sin(angle),
        sin(angle), cos(angle)
    );
}

void main() {
    vUv = uv;
    vInstanceID = int(iId);
    vType = int(iType);

    vec3 mNormal = normalize((modelMatrix * vec4(normal, 0.)).xyz);
    mNormal.xz = mNormal.xz * rotate2d(float(vInstanceID));
    vec3 mvNormal = normalize((viewMatrix * vec4(mNormal, 0.)).xyz);
    vNormal = mvNormal;

    float scaleFactor = noise(float(vInstanceID));
    float scale = scaleFactor * 0.5 + 1.;

    vec3 transformedPosition = position * scale;
    transformedPosition.xz = transformedPosition.xz * rotate2d(float(vInstanceID));
    transformedPosition += iPosition;
    transformedPosition.xz += iOffset;

    vec4 mvPosition = viewMatrix * modelMatrix * vec4(transformedPosition, 1.0);
    vPosition = vec3(mvPosition);

    gl_Position = projectionMatrix * mvPosition;
}
