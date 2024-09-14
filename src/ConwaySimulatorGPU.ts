import ConwaySimulator, {Options} from './ConwaySimulator.ts';
import computeShaderWGSL from '../shaders/main.wgsl?raw';

class ConwaySimulatorGPU extends ConwaySimulator {
  constructor(options: Options) {
    super(options);

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
    return this.InitResources();
  }

  async OnSimulate() {
    const encoder = this.device!.createCommandEncoder({
      label: 'encoder',
    });

    const pass = encoder.beginComputePass({
      label: 'compute pass',
    });

    pass.setPipeline(this.pipeline!);
    pass.setBindGroup(0, this.bindGroups![this.bindGroupIdx]);
    pass.dispatchWorkgroups(this.WORKGRP_CNT);
    pass.end();

    const gridIdx = this.bindGroupIdx ^ 1;
    encoder.copyBufferToBuffer(
      this.gridDoubleBuffer![gridIdx],
      0,
      this.resultBuffer!,
      0,
      this.resultBuffer!.size
    );
    const commandBuffer = encoder.finish();
    this.device!.queue.submit([commandBuffer]);

    await this.resultBuffer!.mapAsync(GPUMapMode.READ);
    this.grid = new Uint32Array(this.resultBuffer!.getMappedRange().slice(0));
    this.resultBuffer!.unmap();

    this.bindGroupIdx ^= 1;
  }

  // TODO
  // async OnDraw() {}

  private async InitResources() {
    const adapter = await navigator.gpu?.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) {
      console.log('need a browser that supports WebGPU');
      return false;
    }

    this.device = device;

    const module = this.device.createShaderModule({
      label: 'compute module',
      code: computeShaderWGSL,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
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

    const pipelineLayout = this.device.createPipelineLayout({
      label: 'compute pipeline layout',
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createComputePipeline({
      label: 'compute pipeline',
      layout: pipelineLayout,
      compute: {
        module,
        entryPoint: 'ConwaySimulate',
      },
    });

    const gridSizeArray = new Uint32Array([
      this.GRID_WIDTH,
      this.GRID_HEIGHT,
      this.GRID_SIZE,
    ]);

    const gridSizeBuffer = this.device.createBuffer({
      label: 'grid size uniform buffer',
      size: gridSizeArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(gridSizeBuffer, 0, gridSizeArray);

    const gridByteSize = Uint32Array.BYTES_PER_ELEMENT * this.GRID_SIZE;

    this.gridDoubleBuffer = [
      this.device.createBuffer({
        label: 'current gen grid',
        size: gridByteSize,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_SRC |
          GPUBufferUsage.COPY_DST,
      }),
      this.device.createBuffer({
        label: 'next gen grid',
        size: gridByteSize,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_SRC |
          GPUBufferUsage.COPY_DST,
      }),
    ];

    this.device.queue.writeBuffer(this.gridDoubleBuffer[0], 0, this.grid);
    this.device.queue.writeBuffer(this.gridDoubleBuffer[1], 0, this.grid);

    this.resultBuffer = this.device.createBuffer({
      label: 'result buffer',
      size: gridByteSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    this.bindGroups = [
      this.device.createBindGroup({
        label: 'compute bind group 0',
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {buffer: gridSizeBuffer},
          },
          {
            binding: 1,
            resource: {buffer: this.gridDoubleBuffer[0]},
          },
          {
            binding: 2,
            resource: {buffer: this.gridDoubleBuffer[1]},
          },
        ],
      }),
      this.device.createBindGroup({
        label: 'compute bind group 1',
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {buffer: gridSizeBuffer},
          },
          {
            binding: 1,
            resource: {buffer: this.gridDoubleBuffer[1]},
          },
          {
            binding: 2,
            resource: {buffer: this.gridDoubleBuffer[0]},
          },
        ],
      }),
    ];

    return true;
  }

  private device?: GPUDevice;
  private pipeline?: GPUComputePipeline;

  private gridDoubleBuffer?: GPUBuffer[];
  private resultBuffer?: GPUBuffer;

  private bindGroups?: GPUBindGroup[];
  private bindGroupIdx: number;

  private readonly WORKGRP_SIZE: number;
  private readonly WORKGRP_CNT: number;
}

export default ConwaySimulatorGPU;
