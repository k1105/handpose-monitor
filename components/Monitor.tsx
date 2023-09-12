import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject, useRef } from "react";
import { Hand, Keypoint } from "@tensorflow-models/hand-pose-detection";
import { resizeHandpose } from "../lib/converter/resizeHandpose";
import { Handpose } from "../@types/global";
import { convertHandToHandpose } from "../lib/converter/convertHandToHandpose";
// import Webcam from "react-webcam";
import { lineHand } from "../lib/p5/lineHand";

type Props = {
  handpose: MutableRefObject<Hand[]>;
  debugLog: MutableRefObject<
    {
      label: string;
      value: any;
    }[]
  >;
  scale: MutableRefObject<number>;
  offset: MutableRefObject<number>;
  position: MutableRefObject<Keypoint>;
  download: MutableRefObject<boolean>;
};

const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const Monitor = ({
  handpose,
  debugLog,
  offset,
  scale,
  position,
  download,
}: Props) => {
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const scaleSliderRef = useRef<HTMLInputElement>(null);
  const scaleTextRef = useRef<HTMLParagraphElement>(null);
  const offsetSliderRef = useRef<HTMLInputElement>(null);
  const offsetTextRef = useRef<HTMLParagraphElement>(null);
  const positionXSliderRef = useRef<HTMLInputElement>(null);
  const positionXTextRef = useRef<HTMLParagraphElement>(null);
  const positionYSliderRef = useRef<HTMLInputElement>(null);
  const positionYTextRef = useRef<HTMLParagraphElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);

  const preload = (p5: p5Types) => {
    // 画像などのロードを行う
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.stroke(220);
    p5.fill(255);
    p5.strokeWeight(10);
    positionYSliderRef.current!.value = String(position.current.x + 500);
    positionYSliderRef.current!.value = String(position.current.y + 500);
    offsetSliderRef.current!.value = String(offset.current * 10);
    scaleSliderRef.current!.value = String(scale.current * 10);
  };

  const draw = (p5: p5Types) => {
    p5.clear();
    positionXTextRef.current!.innerText = "x : " + position.current.x;
    position.current.x = Number(positionXSliderRef.current!.value) - 500;
    positionYTextRef.current!.innerText = "y : " + position.current.y;
    position.current.y = Number(positionYSliderRef.current!.value) - 500;
    offsetTextRef.current!.innerText = "offset : " + offset.current;
    offset.current = Number(offsetSliderRef.current!.value) / 10;
    scaleTextRef.current!.innerText = "scale : " + scale.current;
    scale.current = Number(scaleSliderRef.current!.value) / 10;

    if (logRef.current !== null) {
      //ログ情報の描画
      logRef.current.innerHTML = "";
      for (const log of debugLog.current) {
        logRef.current.innerHTML +=
          "<p>" + log.label + " : " + String(log.value) + "</p>";
      }
    }

    const rawHands: {
      left: Handpose;
      right: Handpose;
    } = convertHandToHandpose(handpose.current); //平滑化されていない手指の動きを使用する
    const hands: {
      left: Handpose;
      right: Handpose;
    } = rawHands;

    p5.push();
    p5.noFill();
    p5.strokeWeight(1);
    p5.rect(p5.width - 330, 30, 300, 225);
    p5.pop();

    if (hands.left.length > 0) {
      hands.left = resizeHandpose(hands.left, 3 / 4);
      p5.push();
      p5.translate(p5.width - 330 + hands.left[0].x, 30 + hands.left[0].y);
      lineHand({
        p5,
        hand: hands.left,
        strokeWeight: 5,
      });
      p5.pop();
    }
    if (hands.right.length > 0) {
      hands.right = resizeHandpose(hands.right, 3 / 4);
      p5.push();
      p5.translate(p5.width - 330 + hands.right[0].x, 30 + hands.right[0].y);
      lineHand({
        p5,
        hand: hands.right,
        strokeWeight: 5,
      });
      p5.pop();
    }
  };

  addEventListener("keydown", (event) => {
    if (event.code == "KeyC") {
      if (sliderContainerRef.current) {
        if (sliderContainerRef.current.style.opacity == "0") {
          sliderContainerRef.current.style.opacity = "1";
        } else {
          sliderContainerRef.current.style.opacity = "0";
        }
      }
    }
  });

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 99 }}>
        <>
          <Sketch
            preload={preload}
            setup={setup}
            draw={draw}
            windowResized={windowResized}
          />
        </>
        <div
          style={{
            position: "absolute",
            right: 30,
            top: 30,
          }}
        >
          {/* <Webcam //手指の動きを取得するのに必要なカメラ映像
              width="300"
              height="225"
              mirrored
              id="webcam"
              audio={false}
              screenshotFormat="image/jpeg"
            /> */}
          <div style={{ height: 225, width: 300 }}>
            <p style={{ lineHeight: 0, color: "white", marginLeft: "10px" }}>
              Camera Range
            </p>
          </div>
          <div ref={logRef} style={{ fontSize: "0.8rem", textAlign: "left" }} />

          <div style={{ opacity: 0 }} ref={sliderContainerRef}>
            <p ref={positionXTextRef} />
            <input type="range" min="0" max="1000" ref={positionXSliderRef} />
            <p ref={positionYTextRef} />
            <input type="range" min="0" max="1000" ref={positionYSliderRef} />
            <p ref={offsetTextRef} />
            <input type="range" min="0" max="5" ref={offsetSliderRef} />
            <p ref={scaleTextRef} />
            <input type="range" min="5" max="20" ref={scaleSliderRef} />
            <div>
              <button
                onClick={() => {
                  download.current = !download.current;
                  downloadButtonRef.current!.innerText = download.current
                    ? "Disable Download"
                    : "Enable Download";
                }}
                ref={downloadButtonRef}
              >
                Disable Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
