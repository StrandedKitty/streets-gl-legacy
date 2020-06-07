#version 300 es
precision highp float;
precision highp int;
precision highp sampler3D;

in vec2 vUv;
out vec4 FragColor;

uniform int ignoreHistory;
uniform sampler2D tNew;
uniform sampler2D tAccum;

void main() {
	vec4 prevColor = texture(tAccum, vUv);
	vec4 newColor = texture(tNew, vUv);

	if(ignoreHistory == 1) {
		FragColor = newColor;
		return;
	}

	FragColor = mix(prevColor, newColor, 0.05);
}
