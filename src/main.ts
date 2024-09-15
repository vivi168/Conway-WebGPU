import ConwaySimulatorGPU from './ConwaySimulatorGPU.ts';
import ConwaySimulatorCPU from './ConwaySimulatorCPU.ts';
import './style.css';
import {Options} from './ConwaySimulator.ts';

// prettier-ignore
const F_PENTOMINO = [
            [0, -1], [1, -1],
  [-1, 0], /* X */
            [0,  1]
];

const urlParams = new URLSearchParams(window.location.search);
let options: Options = {
  scale: Number(urlParams.get('scale')) || 1,
};
if (urlParams.has('random'))
  options.aliveProbability = Number(urlParams.get('random'));
else options.pentomino = F_PENTOMINO;

const s = urlParams.has('gpu')
  ? new ConwaySimulatorGPU(options)
  : new ConwaySimulatorCPU(options);

function Mainloop() {
  s.Simulate();

  requestAnimationFrame(Mainloop);
}

async function Init() {
  const ok = await s.Init();
  if (!ok) return;

  Mainloop();
}

Init();
