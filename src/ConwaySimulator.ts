abstract class ConwaySimulator {
  constructor(options: Options) {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.CANVAS = canvas;

    console.log(options);

    this.SCALE = options.scale;
    this.GRID_WIDTH = Math.floor(canvas.width / this.SCALE);
    this.GRID_HEIGHT = Math.floor(canvas.height / this.SCALE);
    this.GRID_SIZE = this.GRID_WIDTH * this.GRID_HEIGHT;

    console.log(this.CANVAS.width, this.CANVAS.height);
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

    document.getElementById('gridSize')!.textContent =
      `${this.GRID_WIDTH}x${this.GRID_HEIGHT}`;
    document.getElementById('generation')!.textContent = `${this.generation}`;

    this.generation++;
  }

  protected abstract OnSimulate(): void;

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
  protected readonly CANVAS: HTMLCanvasElement;
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
