import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject, useRef } from "react";
import { Hand, Keypoint } from "@tensorflow-models/hand-pose-detection";
import { getSmoothedHandpose } from "../lib/getSmoothedHandpose";
import { dotHand } from "../lib/p5/dotHand";
import { isFront } from "../lib/detector/isFront";
import { Monitor } from "../components/Monitor";
import { Handpose } from "../@types/global";
import { DisplayHands } from "../lib/DisplayHandsClass";
import { HandposeHistory } from "../lib/HandposeHitsoryClass";
import { lineHand } from "../lib/p5/lineHand";
import { convert3DKeypointsToHandpose } from "../lib/converter/convert3DKeypointsToHandpose";
import { resizeHandpose } from "../lib/converter/resizeHandpose";

type Props = {
  handpose: MutableRefObject<Hand[]>;
};
const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const HandSketch = ({ handpose }: Props) => {
  const handposeHistory = new HandposeHistory();
  const displayHands = new DisplayHands();
  const recordedDataRef = useRef<{ left: number[]; right: number[] }[]>([]);
  const position = useRef<Keypoint>({ x: 0, y: 200 });
  const scale = useRef<number>(1);
  const offset = useRef<number>(0.2);

  const debugLog = useRef<{ label: string; value: any }[]>([]);

  const preload = (p5: p5Types) => {
    // 画像などのロードを行う
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.stroke(220);
    p5.fill(255);
    p5.strokeWeight(10);
  };

  const draw = (p5: p5Types) => {
    const rawHands: {
      left: Handpose;
      right: Handpose;
    } = convert3DKeypointsToHandpose(handpose.current);

    handposeHistory.update(rawHands);
    const hands: {
      left: Handpose;
      right: Handpose;
    } = getSmoothedHandpose(rawHands, handposeHistory); //平滑化された手指の動きを取得する

    // logとしてmonitorに表示する
    debugLog.current = [];
    for (const hand of handpose.current) {
      debugLog.current.push({
        label: hand.handedness + " accuracy",
        value: hand.score,
      });
      debugLog.current.push({
        label: hand.handedness + " is front",
        //@ts-ignore
        value: isFront(hand.keypoints, hand.handedness.toLowerCase()),
      });
    }

    p5.clear();

    displayHands.update(hands);

    if (displayHands.left.pose.length > 0) {
      p5.push();
      p5.stroke(255, displayHands.left.opacity);
      p5.fill(255, displayHands.left.opacity);
      p5.translate(
        p5.width * (0.5 - offset.current),
        p5.height / 2 + +position.current.y
      );
      lineHand({
        p5,
        hand: resizeHandpose(
          displayHands.left.pose,
          Math.max(p5.width, p5.height) * 1.5 * scale.current
        ),
        strokeWeight: Math.max(p5.width, p5.height) / 300,
      });
      dotHand({
        p5,
        hand: resizeHandpose(
          displayHands.left.pose,
          Math.max(p5.width, p5.height) * 1.5 * scale.current
        ),
        dotSize: Math.max(p5.width, p5.height) / 100,
      });
      p5.pop();
    }

    if (displayHands.right.pose.length > 0) {
      p5.push();
      p5.stroke(255, displayHands.right.opacity);
      p5.fill(255, displayHands.right.opacity);
      p5.translate(
        p5.width * (0.5 + offset.current),
        p5.height / 2 + position.current.y
      );
      lineHand({
        p5,
        hand: resizeHandpose(
          displayHands.right.pose,
          Math.max(p5.width, p5.height) * 1.5 * scale.current
        ),
        strokeWeight: Math.max(p5.width, p5.height) / 300,
      });
      dotHand({
        p5,
        hand: resizeHandpose(
          displayHands.right.pose,
          Math.max(p5.width, p5.height) * 1.5 * scale.current
        ),
        dotSize: Math.max(p5.width, p5.height) / 100,
      });
      p5.pop();
    }
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <>
      <Monitor
        handpose={handpose}
        debugLog={debugLog}
        offset={offset}
        position={position}
        scale={scale}
      />
      <Sketch
        preload={preload}
        setup={setup}
        draw={draw}
        windowResized={windowResized}
      />
    </>
  );
};
