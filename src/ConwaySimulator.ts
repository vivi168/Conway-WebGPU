abstract class ConwaySimulator {
  constructor(options: Options) {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.CANVAS_WIDTH = canvas.width;
    this.CANVAS_HEIGHT = canvas.height;

    console.log(options);

    this.CTX = canvas.getContext('2d')!;
    this.CTX.font = '24px mono';
    this.SCALE = options.scale;
    this.GRID_WIDTH = Math.floor(canvas.width / this.SCALE);
    this.GRID_HEIGHT = Math.floor(canvas.height / this.SCALE);
    this.GRID_SIZE = this.GRID_WIDTH * this.GRID_HEIGHT;

    console.log(canvas.width, canvas.height);
    console.log(this.SCALE, this.GRID_WIDTH, this.GRID_HEIGHT);

    this.generation = 0;
    this.grid = new Uint32Array(this.GRID_SIZE);

    if (!options.aliveProbability && !options.pentomino)
      this.InitRandomGrid(0.75);
    else {
      if (options.aliveProbability)
        this.InitRandomGrid(options.aliveProbability);
      if (options.pentomino) this.PlacePentomino(options.pentomino);
    }
  }

  async Init() {
    const ok = await this.OnInit();

    return ok;
  }

  protected abstract OnInit(): Promise<Boolean>;

  async Simulate() {
    await this.OnSimulate();

    this.generation++;
  }

  protected abstract OnSimulate(): void;

  Draw() {
    this.OnDraw();

    this.CTX.fillText(
      `Grid size: ${this.GRID_WIDTH}x${this.GRID_HEIGHT}`,
      16,
      24
    );
    this.CTX.fillText(`Generation: ${this.generation}`, 16, 48);
  }

  // protected abstract OnDraw(): void;
  OnDraw() {
    const imageData = this.CTX.createImageData(
      this.CANVAS_WIDTH,
      this.CANVAS_HEIGHT
    );
    const pixelData = imageData.data;

    for (let y = 0; y < this.GRID_HEIGHT; y++) {
      for (let x = 0; x < this.GRID_WIDTH; x++) {
        const index = y * this.GRID_WIDTH + x;

        if (this.grid[index] === CellState.Dead) continue;

        for (let dy = 0; dy < this.SCALE; dy++) {
          for (let dx = 0; dx < this.SCALE; dx++) {
            const px = x * this.SCALE + dx;
            const py = y * this.SCALE + dy;
            const pi = (py * this.CANVAS_WIDTH + px) * 4;

            pixelData[pi + 0] = 0;
            pixelData[pi + 1] = 0;
            pixelData[pi + 2] = 0;
            pixelData[pi + 3] = 255;
          }
        }
      }
    }

    this.CTX.putImageData(imageData, 0, 0);
  }

  private InitRandomGrid(aliveProbability: number) {
    this.grid = new Uint32Array(this.GRID_SIZE);

    for (let i = 0; i < this.GRID_SIZE; i++) {
      this.grid[i] =
        Math.random() < aliveProbability ? CellState.Alive : CellState.Dead;
    }
  }

  private PlacePentomino(pentomino: number[][]) {
    let x = Math.floor(this.GRID_WIDTH / 2);
    let y = Math.floor(this.GRID_HEIGHT / 2);

    this.grid[y * this.GRID_WIDTH + x] = CellState.Alive;

    for (let c of pentomino) {
      let a = x + c[0];
      let b = y + c[1];

      if (a >= 0 && a < this.GRID_WIDTH && b >= 0 && b < this.GRID_HEIGHT) {
        this.grid[b * this.GRID_WIDTH + a] = CellState.Alive;
      }
    }
  }

  private generation: number;
  protected grid: Uint32Array;

  // TODO: struct to hold this?
  protected readonly CANVAS_WIDTH: number;
  protected readonly CANVAS_HEIGHT: number;
  protected readonly CTX;
  protected readonly SCALE: number;
  protected readonly GRID_WIDTH: number;
  protected readonly GRID_HEIGHT: number;
  protected readonly GRID_SIZE: number;
}

export enum CellState {
  Dead = 0,
  Alive = 1,
}

export interface Options {
  aliveProbability?: number;
  pentomino?: number[][];
  scale: number;
}

export default ConwaySimulator;
