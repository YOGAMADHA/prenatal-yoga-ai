/** @param {{x:number,y:number,z?:number}} a @param {{x:number,y:number,z?:number}} b */
export function angleBetween(a, b) {
  const dot = a.x * b.x + a.y * b.y;
  const magA = Math.hypot(a.x, a.y);
  const magB = Math.hypot(b.x, b.y);
  if (!magA || !magB) return 0;
  const c = Math.min(1, Math.max(-1, dot / (magA * magB)));
  return (Math.acos(c) * 180) / Math.PI;
}

/** Angle at b formed by points a-b-c (degrees) */
export function angleAt(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  return angleBetween(v1, v2);
}

/** Deviation from vertical for vector shoulder->hip */
export function spineDeviationDeg(shoulder, hip) {
  const v = { x: hip.x - shoulder.x, y: hip.y - shoulder.y };
  const vertical = { x: 0, y: 1 };
  return angleBetween(v, vertical);
}
