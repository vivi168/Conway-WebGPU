import ConwaySimulator, {Options} from './ConwaySimulator.ts';
import computeShaderWGSL from '../shaders/main.wgsl?raw';
import renderShaderWGSL from '../shaders/grid.wgsl?raw';

class ConwaySimulatorGPU extends ConwaySimulator {
  constructor(options: Options) {
    super(options);

    this.CTX = this.CANVAS.getContext('webgpu')!;

    this.WORKGRP_SIZE = 256;
    this.WORKGRP_CNT = Math.ceil(this.GRID_SIZE / this.WORKGRP_SIZE);

    this.bindGroupIdx = 0;

    console.log(
      'grid size:',
      this.GRID_SIZE,
      'workgroup size:',
      this.WORKGRP_SIZE,
      'workgroup count:',
      this.WORKGRP_CNT
    );
  }

  async OnInit() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
      console.log('need a browser that supports WebGPU');
      return false;
    }

    this.device = device;

    this.InitBuffers(device);
    this.InitComputeResources(device);
    this.InitRenderResources(device);

    return true;
  }

  async OnSimulate() {
    const encoder = this.device!.createCommandEncoder({
      label: 'encoder',
    });

    const computePass = encoder.beginComputePass({
      label: 'compute pass',
    });

    computePass.setPipeline(this.computePipeline!);
    computePass.setBindGroup(0, this.computeBindGroups![this.bindGroupIdx]);
    computePass.dispatchWorkgroups(this.WORKGRP_CNT);
    computePass.end();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: this.CTX.getCurrentTexture().createView(),
          clearValue: {r: 1.0, g: 1.0, b: 1.0, a: 1.0},
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };
    const drawPass = encoder.beginRenderPass(renderPassDescriptor);
    drawPass.setPipeline(this.renderPipeline!);
    drawPass.setBindGroup(0, this.renderBindGroup![this.bindGroupIdx]);
    drawPass.draw(6, 1, 0, 0);
    drawPass.end();

    const commandBuffer = encoder.finish();
    this.device!.queue.submit([commandBuffer]);

    this.bindGroupIdx ^= 1;
  }

  private InitBuffers(device: GPUDevice) {
    const gridSizeInfo = new Uint32Array([
      this.SCALE,
      this.GRID_WIDTH,
      this.GRID_HEIGHT,
      this.GRID_SIZE,
    ]);

    this.gridSizeBuffer = device.createBuffer({
      label: 'uniform buffer',
      size: gridSizeInfo.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(this.gridSizeBuffer, 0, gridSizeInfo);

    const gridByteSize = Uint32Array.BYTES_PER_ELEMENT * this.GRID_SIZE;

    this.gridDoubleBuffer = [
      device.createBuffer({
        label: 'current gen grid',
        size: gridByteSize,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_SRC |
          GPUBufferUsage.COPY_DST,
      }),
      device.createBuffer({
        label: 'next gen grid',
        size: gridByteSize,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_SRC |
          GPUBufferUsage.COPY_DST,
      }),
    ];

    device.queue.writeBuffer(this.gridDoubleBuffer[0], 0, this.grid);
    device.queue.writeBuffer(this.gridDoubleBuffer[1], 0, this.grid);
  }

  private InitComputeResources(device: GPUDevice) {
    const module = device.createShaderModule({
      label: 'compute module',
      code: computeShaderWGSL,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: 'compute bind group layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {}, // grid size uniform buffer
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {type: 'read-only-storage'}, // current gen grid
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {type: 'storage'}, // next gen grid (output)
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: 'compute pipeline layout',
      bindGroupLayouts: [bindGroupLayout],
    });

    this.computePipeline = device.createComputePipeline({
      label: 'compute pipeline',
      layout: pipelineLayout,
      compute: {
        module,
        entryPoint: 'ConwaySimulate',
      },
    });

    this.computeBindGroups = [
      device.createBindGroup({
        label: 'compute bind group 0',
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {buffer: this.gridSizeBuffer!},
          },
          {
            binding: 1,
            resource: {buffer: this.gridDoubleBuffer![0]},
          },
          {
            binding: 2,
            resource: {buffer: this.gridDoubleBuffer![1]},
          },
        ],
      }),
      device.createBindGroup({
        label: 'compute bind group 1',
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {buffer: this.gridSizeBuffer!},
          },
          {
            binding: 1,
            resource: {buffer: this.gridDoubleBuffer![1]},
          },
          {
            binding: 2,
            resource: {buffer: this.gridDoubleBuffer![0]},
          },
        ],
      }),
    ];
  }

  private InitRenderResources(device: GPUDevice) {
    const module = device.createShaderModule({
      label: 'render module',
      code: renderShaderWGSL,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: 'render bind group layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {}, // grid size uniform buffer
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {type: 'read-only-storage'}, // current gen grid
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: 'render pipeline layout',
      bindGroupLayouts: [bindGroupLayout],
    });

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.CTX.configure({
      device,
      format: presentationFormat,
      alphaMode: 'opaque',
    });

    this.renderPipeline = device.createRenderPipeline({
      label: 'render pipeline',
      layout: pipelineLayout,
      vertex: {
        module,
        entryPoint: 'VSMain',
      },
      fragment: {
        module,
        entryPoint: 'PSMain',
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
    });

    this.renderBindGroup = [
      device.createBindGroup({
        label: 'render bind group 0',
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {buffer: this.gridSizeBuffer!},
          },
          {
            binding: 1,
            resource: {buffer: this.gridDoubleBuffer![0]},
          },
        ],
      }),
      device.createBindGroup({
        label: 'render bind group 1',
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {buffer: this.gridSizeBuffer!},
          },
          {
            binding: 1,
            resource: {buffer: this.gridDoubleBuffer![1]},
          },
        ],
      }),
    ];
  }

  private device?: GPUDevice;
  private computePipeline?: GPUComputePipeline;
  private renderPipeline?: GPURenderPipeline;

  private gridSizeBuffer?: GPUBuffer;
  private gridDoubleBuffer?: GPUBuffer[];

  private computeBindGroups?: GPUBindGroup[];
  private renderBindGroup?: GPUBindGroup[];
  private bindGroupIdx: number;

  private readonly CTX: GPUCanvasContext;
  private readonly WORKGRP_SIZE: number;
  private readonly WORKGRP_CNT: number;
}

export default ConwaySimulatorGPU;
