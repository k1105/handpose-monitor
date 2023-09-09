import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject, useState } from "react";
import { Hand } from "@tensorflow-models/hand-pose-detection";
import { convertHandToHandpose } from "../lib/converter/convertHandToHandpose";
import { Handpose } from "../@types/global";

type Props = {
  handpose: MutableRefObject<Hand[]>;
  recordedData: MutableRefObject<
    {
      left: number[];
      right: number[];
    }[]
  >;
};

const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const Recorder = ({ handpose, recordedData }: Props) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recordedHandposes: {
    left: number[];
    right: number[];
  }[] = []; //stateの変更に伴ってリセットされる

  const setup = (p5: p5Types) => {};

  const draw = (p5: p5Types) => {
    const rawHands: {
      left: Handpose;
      right: Handpose;
    } = convertHandToHandpose(handpose.current); //平滑化されていない手指の動きを使用する
    const leftKeypoints = [];
    for (const keypoint of rawHands.left) {
      leftKeypoints.push(keypoint.x, keypoint.y);
    }
    const rightKeypoints = [];
    for (const keypoint of rawHands.right) {
      rightKeypoints.push(keypoint.x, keypoint.y);
    }
    recordedHandposes.push({ left: leftKeypoints, right: rightKeypoints });
  };

  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 99 }}>
        <button
          onClick={() => {
            if (isRecording) {
              //記録の終了
              recordedData.current = recordedHandposes;
              const content = JSON.stringify(recordedData);
              const blob = new Blob([content], { type: "text/plain" });
              const objUrl = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = objUrl;
              link.download = String(Date.now()) + ".txt";
              link.click();
            }
            setIsRecording(!isRecording);
          }}
          style={{
            position: "absolute",
            top: "80px",
            left: "30px",
            width: "100px",
            height: "30px",
            background: !isRecording ? "rgba(0,0,0,0)" : "#fff",
            border: "1px solid #ffffff",
            color: isRecording ? "#011960" : "#fff",
            borderRadius: "5px",
          }}
        >
          {!isRecording ? "Begin Record" : "End Record"}
        </button>

        {isRecording ? <Sketch setup={setup} draw={draw} /> : <></>}
      </div>
    </>
  );
};
