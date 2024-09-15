struct Uniforms {
    scale: u32,
    gridWidth: u32,
    gridHeight: u32,
    gridSize: u32,
}

struct VertexOutput {
    @builtin(position) position : vec4f,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var<storage, read> grid : array<u32>;

const ALIVE = 1u;
const vertexPositions = array<vec2f, 6>(
    // first triangle
    vec2<f32>( 1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0, -1.0),
    // second triangle
    vec2<f32>( 1.0,  1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
);

@vertex
fn VSMain(@builtin(vertex_index) vi: u32) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f(vertexPositions[vi], 0.0, 1.0);

    return output;
}

@fragment
fn PSMain(@builtin(position) position: vec4f) -> @location(0) vec4f {
    let gx = u32(position.x) / uniforms.scale;
    let gy = u32(position.y) / uniforms.scale;

    let i  = gy * uniforms.gridWidth + gx;

    if grid[i] == ALIVE {
        return vec4f(0, 0, 0, 1);
    }

    return vec4f(1, 1, 1, 1);
}
