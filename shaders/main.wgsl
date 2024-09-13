const WORKGRP_SIZE = 256u;
const ALIVE = 1u;
const DEAD = 0u;

@group(0) @binding(0) var<uniform> gridSize: vec3u; // x = width, y = height, z = width * height
@group(0) @binding(1) var<storage> curGenGrid: array<u32>;
@group(0) @binding(2) var<storage, read_write> nextGenGrid: array<u32>;

const directions = array<vec2<i32>, 8>(
    vec2<i32>(-1, -1), vec2<i32>(0, -1), vec2<i32>(1, -1), // 0 1 2
    vec2<i32>(-1,  0),                   vec2<i32>(1,  0), // 3 X 4
    vec2<i32>(-1,  1), vec2<i32>(0,  1), vec2<i32>(1,  1)  // 5 6 7
);

fn NeighborCount(idx: i32) -> u32{
    var count: u32 = 0;
    let gridWidth = i32(gridSize.x);
    let gridHeight = i32(gridSize.y);

    let x = idx % gridWidth;
    let y = idx / gridWidth;

    for (var i: i32 = 0; i < 8; i = i + 1) {
        let direction = directions[i];
        let a = x + direction.x;
        let b = y + direction.y;

        // Check bounds
        if a >= 0 && a < gridWidth && b >= 0 && b < gridHeight {
            count = count + curGenGrid[b * gridWidth + a];
        }
    }

    return count;
}

@compute @workgroup_size(WORKGRP_SIZE)
fn ConwaySimulate(
    @builtin(global_invocation_id) gid: vec3u,
    @builtin(num_workgroups) num_workgroups: vec3u,
) {
    let idx = gid.x;

    if idx >= gridSize.z {
        return;
    }

    let n = NeighborCount(i32(idx));

    var curValue = curGenGrid[idx];
    var newValue = DEAD;

    /*
    Any live cell with fewer than two live neighbors dies, as if by underpopulation.
    Any live cell with two or three live neighbors lives on to the next generation.
    Any live cell with more than three live neighbors dies, as if by overpopulation.
    Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
    */
    if (curValue == 1 && n == 2) || n == 3 {
        newValue = ALIVE;
    }

    nextGenGrid[idx] = newValue;
}
