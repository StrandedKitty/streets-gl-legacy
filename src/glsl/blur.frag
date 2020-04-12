#version 300 es
precision highp float;
out vec4 FragColor;

in vec2 vUv;

uniform sampler2D tHDR;
uniform vec2 resolution;
uniform vec2 direction;

vec4 readTexture(vec2 offset) {
    return texture(tHDR, vUv + offset);
}

float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.3333333333333333) * direction;
    color += texture(image, uv) * 0.29411764705882354;
    color += texture(image, uv + (off1 / resolution)) * 0.35294117647058826;
    color += texture(image, uv - (off1 / resolution)) * 0.35294117647058826;
    return color;
}

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.3846153846) * direction;
    vec2 off2 = vec2(3.2307692308) * direction;
    color += texture(image, uv) * 0.2270270270;
    color += texture(image, uv + (off1 / resolution)) * 0.3162162162;
    color += texture(image, uv - (off1 / resolution)) * 0.3162162162;
    color += texture(image, uv + (off2 / resolution)) * 0.0702702703;
    color += texture(image, uv - (off2 / resolution)) * 0.0702702703;
    return color;
}

vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.411764705882353) * direction;
    vec2 off2 = vec2(3.2941176470588234) * direction;
    vec2 off3 = vec2(5.176470588235294) * direction;
    color += texture(image, uv) * 0.1964825501511404;
    color += texture(image, uv + (off1 / resolution)) * 0.2969069646728344;
    color += texture(image, uv - (off1 / resolution)) * 0.2969069646728344;
    color += texture(image, uv + (off2 / resolution)) * 0.09447039785044732;
    color += texture(image, uv - (off2 / resolution)) * 0.09447039785044732;
    color += texture(image, uv + (off3 / resolution)) * 0.010381362401148057;
    color += texture(image, uv - (off3 / resolution)) * 0.010381362401148057;
    return color;
}

void main() {
    vec2 tex_offset = 1. / vec2(textureSize(tHDR, 0));
    vec3 result = texture(tHDR, vUv).rgb * weight[0];

    for(int i = 1; i < 5; ++i)
    {
        float j = float(i);
        result += texture(tHDR, vUv + tex_offset * j * direction).rgb * weight[i];
        result += texture(tHDR, vUv - tex_offset * j * direction).rgb * weight[i];
    }

    FragColor = vec4(result, 1);
    //FragColor = blur9(tHDR, vUv, resolution, direction);
}
