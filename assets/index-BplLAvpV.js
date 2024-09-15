var I=Object.defineProperty;var m=(u,r,e)=>r in u?I(u,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):u[r]=e;var o=(u,r,e)=>m(u,typeof r!="symbol"?r+"":r,e);(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))t(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&t(s)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function t(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();class g{constructor(r){o(this,"generation");o(this,"grid");o(this,"CANVAS");o(this,"SCALE");o(this,"GRID_WIDTH");o(this,"GRID_HEIGHT");o(this,"GRID_SIZE");const e=document.getElementById("canvas");e.width=window.innerWidth,e.height=window.innerHeight,this.CANVAS=e,console.log(r),this.SCALE=r.scale,this.GRID_WIDTH=Math.floor(e.width/this.SCALE),this.GRID_HEIGHT=Math.floor(e.height/this.SCALE),this.GRID_SIZE=this.GRID_WIDTH*this.GRID_HEIGHT,console.log(this.CANVAS.width,this.CANVAS.height),console.log(this.SCALE,this.GRID_WIDTH,this.GRID_HEIGHT),this.generation=0,this.grid=new Uint32Array(this.GRID_SIZE),!r.aliveProbability&&!r.pentomino?this.InitRandomGrid(.75):(r.aliveProbability&&this.InitRandomGrid(r.aliveProbability),r.pentomino&&this.PlacePentomino(r.pentomino))}async Init(){return await this.OnInit()}Simulate(){this.OnSimulate(),document.getElementById("gridSize").textContent=`${this.GRID_WIDTH}x${this.GRID_HEIGHT}`,document.getElementById("generation").textContent=`${this.generation}`,this.generation++}InitRandomGrid(r){this.grid=new Uint32Array(this.GRID_SIZE);for(let e=0;e<this.GRID_SIZE;e++)this.grid[e]=Math.random()<r?1:0}PlacePentomino(r){let e=Math.floor(this.GRID_WIDTH/2),t=Math.floor(this.GRID_HEIGHT/2);this.grid[t*this.GRID_WIDTH+e]=1;for(let i of r){let n=e+i[0],s=t+i[1];n>=0&&n<this.GRID_WIDTH&&s>=0&&s<this.GRID_HEIGHT&&(this.grid[s*this.GRID_WIDTH+n]=1)}}}var h=(u=>(u[u.Dead=0]="Dead",u[u.Alive=1]="Alive",u))(h||{});const y=`struct Uniforms {
    scale: u32,
    gridWidth: u32,
    gridHeight: u32,
    gridSize: u32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage> curGenGrid: array<u32>;
@group(0) @binding(2) var<storage, read_write> nextGenGrid: array<u32>;

const WORKGRP_SIZE = 256u;
const DEAD = 0u;
const ALIVE = 1u;
const directions = array<vec2i, 8>(
    vec2i(-1, -1), vec2i(0, -1), vec2i(1, -1), // 0 1 2
    vec2i(-1,  0),               vec2i(1,  0), // 3 X 4
    vec2i(-1,  1), vec2i(0,  1), vec2i(1,  1)  // 5 6 7
);

fn NeighborCount(idx: i32) -> u32{
    var count: u32 = 0;
    let gridWidth = i32(uniforms.gridWidth);
    let gridHeight = i32(uniforms.gridHeight);

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
) {
    let idx = gid.x;

    if idx >= uniforms.gridSize {
        return;
    }

    let n = NeighborCount(i32(idx));

    var curValue = curGenGrid[idx];

    /*
    Any live cell with fewer than two live neighbors dies, as if by underpopulation.
    Any live cell with two or three live neighbors lives on to the next generation.
    Any live cell with more than three live neighbors dies, as if by overpopulation.
    Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
    */
    var newValue = DEAD;

    if (curValue == 1 && n == 2) || n == 3 {
        newValue = ALIVE;
    }

    nextGenGrid[idx] = newValue;
}
`,S=`struct Uniforms {
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
`;class D extends g{constructor(e){super(e);o(this,"device");o(this,"computePipeline");o(this,"renderPipeline");o(this,"gridSizeBuffer");o(this,"gridDoubleBuffer");o(this,"computeBindGroups");o(this,"renderBindGroup");o(this,"bindGroupIdx");o(this,"CTX");o(this,"WORKGRP_SIZE");o(this,"WORKGRP_CNT");this.CTX=this.CANVAS.getContext("webgpu"),this.WORKGRP_SIZE=256,this.WORKGRP_CNT=Math.ceil(this.GRID_SIZE/this.WORKGRP_SIZE),this.bindGroupIdx=0,console.log("grid size:",this.GRID_SIZE,"workgroup size:",this.WORKGRP_SIZE,"workgroup count:",this.WORKGRP_CNT)}async OnInit(){var i;const e=await((i=navigator.gpu)==null?void 0:i.requestAdapter()),t=await(e==null?void 0:e.requestDevice());return t?(this.device=t,this.InitBuffers(t),this.InitComputeResources(t),this.InitRenderResources(t),!0):(console.log("need a browser that supports WebGPU"),!1)}OnSimulate(){const e=this.device.createCommandEncoder({label:"encoder"}),t=e.beginComputePass({label:"compute pass"});t.setPipeline(this.computePipeline),t.setBindGroup(0,this.computeBindGroups[this.bindGroupIdx]),t.dispatchWorkgroups(this.WORKGRP_CNT),t.end();const i={colorAttachments:[{view:this.CTX.getCurrentTexture().createView(),clearValue:{r:1,g:1,b:1,a:1},loadOp:"clear",storeOp:"store"}]},n=e.beginRenderPass(i);n.setPipeline(this.renderPipeline),n.setBindGroup(0,this.renderBindGroup[this.bindGroupIdx]),n.draw(6,1,0,0),n.end();const s=e.finish();this.device.queue.submit([s]),this.bindGroupIdx^=1}InitBuffers(e){const t=new Uint32Array([this.SCALE,this.GRID_WIDTH,this.GRID_HEIGHT,this.GRID_SIZE]);this.gridSizeBuffer=e.createBuffer({label:"uniform buffer",size:t.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),e.queue.writeBuffer(this.gridSizeBuffer,0,t);const i=Uint32Array.BYTES_PER_ELEMENT*this.GRID_SIZE;this.gridDoubleBuffer=[e.createBuffer({label:"current gen grid",size:i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),e.createBuffer({label:"next gen grid",size:i,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})],e.queue.writeBuffer(this.gridDoubleBuffer[0],0,this.grid),e.queue.writeBuffer(this.gridDoubleBuffer[1],0,this.grid)}InitComputeResources(e){const t=e.createShaderModule({label:"compute module",code:y}),i=e.createBindGroupLayout({label:"compute bind group layout",entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),n=e.createPipelineLayout({label:"compute pipeline layout",bindGroupLayouts:[i]});this.computePipeline=e.createComputePipeline({label:"compute pipeline",layout:n,compute:{module:t,entryPoint:"ConwaySimulate"}}),this.computeBindGroups=[e.createBindGroup({label:"compute bind group 0",layout:i,entries:[{binding:0,resource:{buffer:this.gridSizeBuffer}},{binding:1,resource:{buffer:this.gridDoubleBuffer[0]}},{binding:2,resource:{buffer:this.gridDoubleBuffer[1]}}]}),e.createBindGroup({label:"compute bind group 1",layout:i,entries:[{binding:0,resource:{buffer:this.gridSizeBuffer}},{binding:1,resource:{buffer:this.gridDoubleBuffer[1]}},{binding:2,resource:{buffer:this.gridDoubleBuffer[0]}}]})]}InitRenderResources(e){const t=e.createShaderModule({label:"render module",code:S}),i=e.createBindGroupLayout({label:"render bind group layout",entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]}),n=e.createPipelineLayout({label:"render pipeline layout",bindGroupLayouts:[i]}),s=navigator.gpu.getPreferredCanvasFormat();this.CTX.configure({device:e,format:s,alphaMode:"opaque"}),this.renderPipeline=e.createRenderPipeline({label:"render pipeline",layout:n,vertex:{module:t,entryPoint:"VSMain"},fragment:{module:t,entryPoint:"PSMain",targets:[{format:s}]}}),this.renderBindGroup=[e.createBindGroup({label:"render bind group 0",layout:i,entries:[{binding:0,resource:{buffer:this.gridSizeBuffer}},{binding:1,resource:{buffer:this.gridDoubleBuffer[0]}}]}),e.createBindGroup({label:"render bind group 1",layout:i,entries:[{binding:0,resource:{buffer:this.gridSizeBuffer}},{binding:1,resource:{buffer:this.gridDoubleBuffer[1]}}]})]}}class R extends g{constructor(e){super(e);o(this,"CTX");this.CTX=this.CANVAS.getContext("2d")}async OnInit(){return!0}OnSimulate(){let e=new Uint32Array(this.GRID_SIZE);for(let t=0;t<this.GRID_HEIGHT;t++)for(let i=0;i<this.GRID_WIDTH;i++){const n=this.NeighborCount(i,t);(this.grid[t*this.GRID_WIDTH+i]==1&&n==2||n==3)&&(e[t*this.GRID_WIDTH+i]=h.Alive)}this.grid=e,this.Draw()}Draw(){const e=this.CTX.createImageData(this.CANVAS.width,this.CANVAS.height),t=e.data;for(let i=0;i<this.GRID_HEIGHT;i++)for(let n=0;n<this.GRID_WIDTH;n++){const s=i*this.GRID_WIDTH+n;if(this.grid[s]!==h.Dead)for(let a=0;a<this.SCALE;a++)for(let d=0;d<this.SCALE;d++){const G=n*this.SCALE+d,l=((i*this.SCALE+a)*this.CANVAS.width+G)*4;t[l+0]=0,t[l+1]=0,t[l+2]=0,t[l+3]=255}}this.CTX.putImageData(e,0,0)}NeighborCount(e,t){const i=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];let n=0;for(let s of i){const a=e+s[0],d=t+s[1];a>=0&&a<this.GRID_WIDTH&&d>=0&&d<this.GRID_HEIGHT&&(n+=this.grid[d*this.GRID_WIDTH+a])}return n}}const P=[[0,-1],[1,-1],[-1,0],[0,1]],c=new URLSearchParams(window.location.search);let f={scale:Number(c.get("scale"))||1};c.has("random")?f.aliveProbability=Number(c.get("random")):f.pentomino=P;const p=c.has("gpu")?new D(f):new R(f);function b(){p.Simulate(),requestAnimationFrame(b)}async function v(){await p.Init()&&b()}v();
