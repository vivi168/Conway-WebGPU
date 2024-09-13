abstract class ConwaySimulator {
  constructor() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.CTX = canvas.getContext('2d')!;
    this.CTX.font = '24px mono';
    this.SCALE = 1;
    this.GRID_WIDTH = Math.floor(canvas.width / this.SCALE);
    this.GRID_HEIGHT = Math.floor(canvas.height / this.SCALE);
    this.GRID_SIZE = this.GRID_WIDTH * this.GRID_HEIGHT;

    console.log(canvas.width, canvas.height);
    console.log(this.SCALE, this.GRID_WIDTH, this.GRID_HEIGHT);

    this.generation = 0;
    this.grid = new Uint32Array(this.GRID_SIZE);
    this.InitGrid();
  }

  async Init() {
    const ok = await this.OnInit();

    return ok;
  }

  protected abstract OnInit(): Promise<Boolean>;

  Simulate() {
    this.OnSimulate();

    this.generation++;
  }

  protected abstract OnSimulate(): void;

  Draw() {
    const DrawCell = (x: number, y: number) =>
      this.CTX.fillRect(x * this.SCALE, y * this.SCALE, this.SCALE, this.SCALE);

    this.CTX.clearRect(
      0,
      0,
      this.GRID_WIDTH * this.SCALE,
      this.GRID_HEIGHT * this.SCALE
    );

    for (let j = 0; j < this.GRID_HEIGHT; j++) {
      for (let i = 0; i < this.GRID_WIDTH; i++) {
        if (this.grid[j * this.GRID_WIDTH + i] == CellState.Alive) {
          DrawCell(i, j);
        }
      }
    }

    this.CTX.fillText(
      `Grid size: ${this.GRID_WIDTH}x${this.GRID_HEIGHT}`,
      16,
      24
    );
    this.CTX.fillText(`Generation: ${this.generation}`, 16, 48);
  }

  private InitGrid() {
    let x = Math.floor(this.GRID_WIDTH / 2);
    let y = Math.floor(this.GRID_HEIGHT / 2);

    // prettier-ignore
    const F_PENTOMINO = [
               [0, -1], [1, -1],
      [-1, 0], /* X */
               [0,  1]
    ];

    this.grid[y * this.GRID_WIDTH + x] = CellState.Alive;

    for (let c of F_PENTOMINO) {
      let a = x + c[0];
      let b = y + c[1];

      if (a >= 0 && a < this.GRID_WIDTH && b >= 0 && b < this.GRID_HEIGHT) {
        this.grid[b * this.GRID_WIDTH + a] = CellState.Alive;
      }
    }
  }

  protected generation: number;
  protected grid: Uint32Array;

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

export default ConwaySimulator;
