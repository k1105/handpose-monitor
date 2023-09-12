import p5Types from "p5";
import { Handpose } from "../@types/global";
import { lineHand } from "../lib/p5/lineHand";
import { dotHand } from "../lib/p5/dotHand";
import { resizeHandpose } from "../lib/converter/resizeHandpose";
import { Keypoint } from "@tensorflow-models/hand-pose-detection";

export const showHand = (
  pose: Handpose,
  opacity: number,
  position: Keypoint,
  offset: number,
  scale: number,
  p5: p5Types
) => {
  p5.push();
  p5.stroke(255, opacity);
  p5.fill(255, opacity);
  p5.translate(p5.width * (0.5 - offset), p5.height / 2 + position.y);
  lineHand({
    p5,
    hand: resizeHandpose(pose, Math.max(p5.width, p5.height) * 1.5 * scale),
    strokeWeight: Math.max(p5.width, p5.height) / 300,
  });
  dotHand({
    p5,
    hand: resizeHandpose(pose, Math.max(p5.width, p5.height) * 1.5 * scale),
    dotSize: Math.max(p5.width, p5.height) / 100,
  });
  p5.pop();
};
