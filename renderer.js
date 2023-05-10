/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
const sendBuffer = window.dgram.sendBuffer;

const videoElement = document.getElementsByClassName('input_video')[0];
//const canvasElement = document.getElementsByClassName('output_canvas')[0];
const fpsElement = document.getElementsByClassName('fps')[0];
//const canvasCtx = canvasElement.getContext('2d');
let time = Date.now();
let prevTime = Date.now();
let frames = 0;
let timecounter = 0;
const mpResults = {
  Body: {},
  Hands: {},
}
let modelsReady = false;

function onResults(results) {
  mpResults.Body = results.poseWorldLandmarks;
}

const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults);

function onResultsHands(results) {
  mpResults.Hands = {
    Landmarks: results.multiHandWorldLandmarks,
    MultiHandedness: results.multiHandedness
  };
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 0,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResultsHands);

let awaiters = []

const camera = new Camera(videoElement, {
  onFrame: async () => {
    if(modelsReady) {
      awaiters = [pose.send({image: videoElement}), hands.send({image: videoElement})];
      await Promise.all(awaiters);
      sendBuffer(mpResults);
    } else {
      await hands.send({image: videoElement});
      await pose.send({image: videoElement});
      modelsReady = true;
    }
    prevTime = time;
    time = Date.now();
    timecounter += time - prevTime;
    frames += 1;
    if(timecounter >= 1000) {
        fpsElement.value = frames;
        frames = 0;
        timecounter = 0;
    }
  },
  width: 720,
  height: 480
});
// canvasElement.width = 640;
// canvasElement.height = 480;
camera.start();