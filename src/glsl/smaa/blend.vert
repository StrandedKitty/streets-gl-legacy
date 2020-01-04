#version 300 es
precision highp float;

uniform vec2 resolution;

in vec3 position;
in vec2 uv;

out vec2 vUv;
out vec4 vOffset[ 2 ];

void SMAANeighborhoodBlendingVS( vec2 texcoord ) {
    vOffset[ 0 ] = texcoord.xyxy + resolution.xyxy * vec4( -1.0, 0.0, 0.0, 1.0 );
    vOffset[ 1 ] = texcoord.xyxy + resolution.xyxy * vec4( 1.0, 0.0, 0.0, -1.0 );
}

void main() {
    vUv = uv;
    SMAANeighborhoodBlendingVS( vUv );
    gl_Position = vec4( position, 1.0 );
}