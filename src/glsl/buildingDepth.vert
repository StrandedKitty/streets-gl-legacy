#version 300 es
precision highp float;
in vec3 position;
in float display;
in float fade;
out vec3 vPosition;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float time;

float CubicOut(float k) {
    return --k * k * k + 1.;
}

void main() {
    vec3 transformedPosition = position;
    if(display > 0.5) transformedPosition = vec3(0);
    if(fade > 0.5) transformedPosition.y *= CubicOut(clamp(time, 0., 1.));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
    vPosition = vec3(modelViewMatrix * vec4(transformedPosition, 1.0));
}
