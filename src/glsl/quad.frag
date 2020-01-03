#version 300 es
precision highp float;
out vec4 FragColor;

uniform sampler2D uNormal;
uniform sampler2D uColor;
uniform sampler2D uDepth;

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
    vec2 fragmentPosition = vec2(gl_FragCoord.xy) / vec2(textureSize(uColor, 0));
    vec4 color = texture(uColor, fragmentPosition);
    vec3 normal = vec3(texture(uNormal, fragmentPosition)) * 2. - 1.;
    float depth = readDepth(texture(uDepth, fragmentPosition).x, 1., 10000.);
    FragColor = color;
}