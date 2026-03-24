import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { angleAt, spineDeviationDeg } from "../utils/poseAngles";
import { evaluateSafety } from "../utils/trimesterThresholds";
import { logPoseEvent } from "../api/client";

const FPS = 15;
const KP = {
  LS: 5,
  RS: 6,
  LH: 11,
  RH: 12,
  LK: 13,
  RK: 14,
  LA: 15,
  RA: 16,
};

function drawSkeleton(ctx, keypoints, safe) {
  const color = safe ? "#22c55e" : "#ef4444";
  const pairs = [
    [KP.LS, KP.RS],
    [KP.LS, KP.LH],
    [KP.RS, KP.RH],
    [KP.LH, KP.RH],
    [KP.LH, KP.LK],
    [KP.RH, KP.RK],
    [KP.LK, KP.LA],
    [KP.RK, KP.RA],
    [KP.LS, 7],
    [KP.RS, 8],
  ];
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  for (const [a, b] of pairs) {
    const pa = keypoints[a];
    const pb = keypoints[b];
    if (!pa || !pb || pa.score < 0.2 || pb.score < 0.2) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  for (const p of keypoints) {
    if (!p || p.score < 0.2) continue;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function WebcamPoseDetector({
  trimester = 2,
  userId = null,
  onSafetyChange,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const runningRef = useRef(false);

  const [status, setStatus] = useState("idle");
  const [angles, setAngles] = useState({ knee: 0, hip: 0, spine: 0, shoulder: 0 });
  const [safe, setSafe] = useState(true);
  const [tip, setTip] = useState("");
  const [poseGuess, setPoseGuess] = useState("detecting");

  const loop = useCallback(async () => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    if (!video || !canvas || !detector) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const now = performance.now();
    if (now - lastRef.current < 1000 / FPS) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    lastRef.current = now;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const poses = await detector.estimatePoses(video, { flipHorizontal: true });
    const pose = poses[0];
    if (!pose || !pose.keypoints?.length) {
      setPoseGuess("no pose");
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const kps = pose.keypoints;
    const lk = (i) => kps[i];

    const leftKnee = angleAt(lk(KP.LH), lk(KP.LK), lk(KP.LA));
    const leftHip = angleAt(lk(KP.LS), lk(KP.LH), lk(KP.LK));
    const spine = spineDeviationDeg(lk(KP.LS), lk(KP.LH));
    const shoulder = angleAt({ x: lk(KP.LH).x, y: lk(KP.LH).y }, lk(KP.LS), lk(7));

    const nextAngles = {
      knee: Number(leftKnee.toFixed(1)),
      hip: Number(leftHip.toFixed(1)),
      spine: Number(spine.toFixed(1)),
      shoulder: Number.isFinite(shoulder) ? Number(shoulder.toFixed(1)) : 0,
    };
    setAngles(nextAngles);

    const evald = evaluateSafety({ trimester, angles: { ...nextAngles, hip: leftHip } });
    const isSafe = !evald.unsafe;
    setSafe(isSafe);
    setTip(evald.reasons[0] || "");
    onSafetyChange?.(!isSafe, evald.reasons[0] || "");

    if (!isSafe && evald.reasons.length) {
      logPoseEvent({
        user_id: userId,
        pose_name: "live-session",
        trimester,
        safety_status: "unsafe",
        joint_angles: nextAngles,
        correction_tip: evald.reasons[0],
        is_unsafe: true,
      }).catch(() => {});
    }

    drawSkeleton(ctx, kps, isSafe);
    setPoseGuess("standing / mixed");
    rafRef.current = requestAnimationFrame(loop);
  }, [onSafetyChange, trimester, userId]);

  const start = async () => {
    setStatus("loading model");
    await tf.setBackend("webgl");
    await tf.ready();
    const detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
    detectorRef.current = detector;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false,
    });
    videoRef.current.srcObject = stream;
    await videoRef.current.play();

    runningRef.current = true;
    setStatus("running");
    rafRef.current = requestAnimationFrame(loop);
  };

  const stop = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const v = videoRef.current;
    if (v?.srcObject) {
      v.srcObject.getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setStatus("stopped");
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="rounded-xl border border-sage/20 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-sage">Webcam (MoveNet)</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={start}
            className="rounded-lg bg-sage px-3 py-1 text-sm text-white"
          >
            Start
          </button>
          <button
            type="button"
            onClick={stop}
            className="rounded-lg border border-sage px-3 py-1 text-sm text-sage"
          >
            Stop
          </button>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="h-auto w-full max-h-[420px]" />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-lg bg-cream p-3 text-sm">
          <div className="font-semibold text-slate-700">Status</div>
          <div>{status}</div>
          <div className="mt-1 text-slate-600">Guess: {poseGuess}</div>
        </div>
        <div className="rounded-lg bg-cream p-3 text-sm">
          <div className="font-semibold text-slate-700">Angles (left chain)</div>
          <div>Knee {angles.knee}° · Hip {angles.hip}°</div>
          <div>Spine dev {angles.spine}° · Shoulder {angles.shoulder}°</div>
          <div className={`mt-2 font-semibold ${safe ? "text-green-700" : "text-red-700"}`}>
            {safe ? "Looks within thresholds" : "Adjustment suggested"}
          </div>
          {!safe && tip && <div className="mt-1 text-red-700">{tip}</div>}
        </div>
      </div>
    </div>
  );
}
