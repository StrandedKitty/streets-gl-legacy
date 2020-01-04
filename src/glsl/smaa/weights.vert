#version 300 es
precision highp float;

#define SMAA_MAX_SEARCH_STEPS 8

uniform vec2 resolution;

in vec3 position;
in vec2 uv;

out vec2 vUv;
out vec4 vOffset[ 3 ];
out vec2 vPixcoord;

void SMAABlendingWeightCalculationVS( vec2 texcoord ) {
    vPixcoord = texcoord / resolution;

    vOffset[ 0 ] = texcoord.xyxy + resolution.xyxy * vec4( -0.25, 0.125, 1.25, 0.125 );
    vOffset[ 1 ] = texcoord.xyxy + resolution.xyxy * vec4( -0.125, 0.25, -0.125, -1.25 );

    vOffset[ 2 ] = vec4( vOffset[ 0 ].xz, vOffset[ 1 ].yw ) + vec4( -2.0, 2.0, -2.0, 2.0 ) * resolution.xxyy * float( SMAA_MAX_SEARCH_STEPS );
}

void main() {
    vUv = uv;
    SMAABlendingWeightCalculationVS( vUv );
    gl_Position = vec4( position, 1.0 );
}