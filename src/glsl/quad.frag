#version 300 es
precision highp float;
out vec4 FragColor;

in vec2 vUv;

uniform sampler2D uNormal;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform sampler2D uPosition;
uniform sampler2D ao;

float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
    return (near * far) / ((far - near) * invClipZ - far);
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
    return (viewZ + near) / (near - far);
}
float readDepth(float depth, float near, float far) {
    float viewZ = perspectiveDepthToViewZ(depth, near, far);
    return viewZToOrthographicDepth(viewZ, near, far);
}

void main() {
    vec2 fragmentPosition = vUv;
    vec4 color = texture(uColor, fragmentPosition);
    vec3 normal = vec3(texture(uNormal, fragmentPosition)) * 2. - 1.;
    vec3 position = vec3(texture(uPosition, fragmentPosition));
    float depth = readDepth(texture(uDepth, fragmentPosition).x, 1., 10000.);
    float ambientOcclusion = texture(ao, fragmentPosition).x;

    FragColor = color * ambientOcclusion;
    if(color.a == 0.) FragColor.xyz = vec3(0.7, 0.9, 0.9);
    FragColor.a = 1.;
}