const mat4 ditherPattern = mat4(
    0.0, 0.5, 0.125, 0.625,
    0.75, 0.22, 0.875, 0.375,
    0.1875, 0.6875, 0.0625, 0.5625,
    0.9375, 0.4375, 0.8125, 0.3125
);

float dither() {
    return ditherPattern[int(gl_FragCoord.x) % 4][int(gl_FragCoord.y) % 4];;
}
