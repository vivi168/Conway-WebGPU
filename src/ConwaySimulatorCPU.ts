import ConwaySimulator, {CellState, Options} from './ConwaySimulator.ts';

class ConwaySimulatorCPU extends ConwaySimulator {
  constructor(options: Options) {
    super(options);

    this.CTX = this.CANVAS.getContext('2d')!;
  }

  async OnInit() {
    return true;
  }

  OnSimulate() {
    /*
    Any live cell with fewer than two live neighbors dies, as if by underpopulation.
    Any live cell with two or three live neighbors lives on to the next generation.
    Any live cell with more than three live neighbors dies, as if by overpopulation.
    Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
    */
    let nextGrid = new Uint32Array(this.GRID_SIZE);

    for (let j = 0; j < this.GRID_HEIGHT; j++) {
      for (let i = 0; i < this.GRID_WIDTH; i++) {
        const n = this.NeighborCount(i, j);

        const curValue = this.grid[j * this.GRID_WIDTH + i];
        if ((curValue == 1 && n == 2) || n == 3)
          nextGrid[j * this.GRID_WIDTH + i] = CellState.Alive;
      }
    }

    this.grid = nextGrid;

    this.Draw();
  }

  private Draw() {
    const imageData = this.CTX.createImageData(
      this.CANVAS.width,
      this.CANVAS.height
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
            const i = (py * this.CANVAS.width + px) * 4;

            pixelData[i + 0] = 0;
            pixelData[i + 1] = 0;
            pixelData[i + 2] = 0;
            pixelData[i + 3] = 255;
          }
        }
      }
    }

    this.CTX.putImageData(imageData, 0, 0);
  }

  private NeighborCount(x: number, y: number) {
    // prettier-ignore
    const DIRECTIONS = [
      [-1, -1], [0, -1], [1, -1], // 0 1 2
      [-1,  0],          [1,  0], // 3 X 4
      [-1,  1], [0,  1], [1,  1]  // 5 6 7
    ];

    let count = 0;
    for (let direction of DIRECTIONS) {
      const a = x + direction[0];
      const b = y + direction[1];

      if (a >= 0 && a < this.GRID_WIDTH && b >= 0 && b < this.GRID_HEIGHT) {
        count += this.grid[b * this.GRID_WIDTH + a];
      }
    }

    return count;
  }

  private readonly CTX: CanvasRenderingContext2D;
}

export default ConwaySimulatorCPU;
