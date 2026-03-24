/** @param {number} trimester 1|2|3 */
export function getThresholds(trimester) {
  const deepBackbendMax = trimester === 3 ? 45 : trimester === 2 ? 55 : 65;
  const supineHipMin = trimester >= 2 ? 25 : 15;
  return {
    deepBackbendMax,
    supineHipMin,
    kneeMin: 25,
    kneeMax: 175,
  };
}

export function evaluateSafety({ trimester, angles }) {
  const t = getThresholds(trimester);
  const reasons = [];

  if (angles.spine > t.deepBackbendMax) {
    reasons.push("Reduce backbend depth; support with hands or props.");
  }
  if (trimester >= 2 && angles.hip < t.supineHipMin) {
    reasons.push("Avoid long supine holds; try side-lying or elevated torso.");
  }
  if (angles.knee < t.kneeMin || angles.knee > t.kneeMax) {
    reasons.push("Soften the knee joint; micro-bend and align knee over ankle.");
  }

  const unsafe = reasons.length > 0;
  return { unsafe, reasons, thresholds: t };
}
