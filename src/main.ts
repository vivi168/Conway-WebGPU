import ConwaySimulatorGPU from './ConwaySimulatorGPU.ts';
import ConwaySimulatorCPU from './ConwaySimulatorCPU.ts';
import './style.css';

const urlParams = new URLSearchParams(window.location.search);
const s = urlParams.has('gpu')
  ? new ConwaySimulatorGPU()
  : new ConwaySimulatorCPU();

async function Mainloop() {
  await s.Simulate();
  s.Draw();

  requestAnimationFrame(Mainloop);
}

async function Init() {
  const ok = await s.Init();
  if (!ok) return;

  Mainloop();
}

Init();
