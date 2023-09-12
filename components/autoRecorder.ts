import { MutableRefObject } from "react";
import { Handpose } from "../@types/global";

export const autoRecorder = (
  isLost: boolean,
  recordedDataRef: MutableRefObject<{ left: number[]; right: number[] }[]>,
  archiveRef: MutableRefObject<{ left: number[]; right: number[] }[]>,
  hands: { left: Handpose; right: Handpose },
  disableDownload: boolean
) => {
  if (isLost) {
    if (recordedDataRef.current.length > 10) {
      //記録の終了
      if (!disableDownload) {
        const content = JSON.stringify(recordedDataRef.current);
        const blob = new Blob([content], { type: "text/plain" });
        const objUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objUrl;
        link.download = String(Date.now()) + ".json";
        link.click();
      }
      archiveRef.current = recordedDataRef.current;
      recordedDataRef.current = [];
    }
  } else {
    const leftKeypoints = [];
    for (const keypoint of hands.left) {
      leftKeypoints.push(keypoint.x, keypoint.y);
    }
    const rightKeypoints = [];
    for (const keypoint of hands.right) {
      rightKeypoints.push(keypoint.x, keypoint.y);
    }
    recordedDataRef.current.push({
      left: leftKeypoints,
      right: rightKeypoints,
    });
  }
};
