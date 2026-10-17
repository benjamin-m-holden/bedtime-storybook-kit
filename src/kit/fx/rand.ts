// Deterministic pseudo-random number in [0,1) for index i and channel k. No Math.random:
// every frame of a render must draw the same picture for the same inputs.
export const rand = (i: number, k = 0) => {
  const v = Math.sin(i * 127.1 + k * 311.7 + 7.13) * 43758.5453;
  return v - Math.floor(v);
};

// Four-point twinkle star path of radius 1 (scale it with a transform).
export const STAR4 = "M0,-1 Q0.14,-0.14 1,0 Q0.14,0.14 0,1 Q-0.14,0.14 -1,0 Q-0.14,-0.14 0,-1 Z";
