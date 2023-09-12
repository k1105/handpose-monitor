import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject, useRef, useState } from "react";
import { Hand, Keypoint } from "@tensorflow-models/hand-pose-detection";
import { getSmoothedHandpose } from "../lib/getSmoothedHandpose";
import { isFront } from "../lib/detector/isFront";
import { Monitor } from "../components/Monitor";
import { Handpose } from "../@types/global";
import { DisplayHands } from "../lib/DisplayHandsClass";
import { HandposeHistory } from "../lib/HandposeHitsoryClass";
import { convert3DKeypointsToHandpose } from "../lib/converter/convert3DKeypointsToHandpose";
import { showHand } from "../components/showHand";
import { autoRecorder } from "../components/autoRecorder";

type Props = {
  handpose: MutableRefObject<Hand[]>;
  isLost: MutableRefObject<boolean>;
};
const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const HandSketch = ({ handpose, isLost }: Props) => {
  const handposeHistory = new HandposeHistory();
  const displayHands = new DisplayHands();
  const [disableDownload, setDisableDownload] = useState<boolean>(false);
  const recordedDataRef = useRef<{ left: number[]; right: number[] }[]>([]);
  const archiveRef = useRef<{ left: number[]; right: number[] }[]>([]);
  const position = useRef<Keypoint>({ x: 0, y: 200 });
  const scale = useRef<number>(1);
  const offset = useRef<number>(0.2);
  const timeRef = useRef<number>(0);

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
    autoRecorder(
      isLost.current,
      recordedDataRef,
      archiveRef,
      hands,
      disableDownload
    );

    if (isLost.current && archiveRef.current.length > 0) {
      const rawPose = archiveRef.current[timeRef.current];
      if (rawPose.left.length > 0) {
        const pose: Keypoint[] = [];
        for (let i = 0; i < 21; i++) {
          pose.push({ x: rawPose.left[2 * i], y: rawPose.left[2 * i + 1] });
        }
        showHand(
          pose,
          255,
          position.current,
          offset.current,
          scale.current,
          p5
        );
      }
      if (rawPose.right.length > 0) {
        const pose: Keypoint[] = [];
        for (let i = 0; i < 21; i++) {
          pose.push({ x: rawPose.right[2 * i], y: rawPose.right[2 * i + 1] });
        }
        showHand(
          pose,
          255,
          position.current,
          -offset.current,
          scale.current,
          p5
        );
      }

      timeRef.current = (timeRef.current + 1) % archiveRef.current.length;
    }

    if (displayHands.left.pose.length > 0) {
      showHand(
        displayHands.left.pose,
        displayHands.left.opacity,
        position.current,
        offset.current,
        scale.current,
        p5
      );
    }

    if (displayHands.right.pose.length > 0) {
      showHand(
        displayHands.right.pose,
        displayHands.right.opacity,
        position.current,
        -offset.current,
        scale.current,
        p5
      );
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
        disableDownload={disableDownload}
        setDisableDownload={setDisableDownload}
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
