/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
const sendBuffer = window.dgram.sendBuffer;

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
let time = Date.now();
let prevTime = Date.now();
let frames = 0;
let timecounter = 0;
let notSentResults = true;

function onResults(results) {
  if (notSentResults) {
    console.log(results);
    notSentResults = false;
  }
  results.faceLandmarks && sendBuffer({
    Face: {
      TopLeft: results.faceLandmarks[21],
      TopRight: results.faceLandmarks[251],
      BottomRight: results.faceLandmarks[397],
      BottomLeft: results.faceLandmarks[172]
    },
    Body: results.za,
    HandL: results.leftHandLandmarks ?? null,
    HandR: results.rightHandLandmarks ?? null,
  });
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

canvasCtx.lineWidth = 5;
  // if (results.poseLandmarks) {
  //   if (results.rightHandLandmarks) {
  //     canvasCtx.strokeStyle = 'white';
  //     connect(canvasCtx, [[
  //               results.poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW],
  //               results.rightHandLandmarks[0]
  //             ]]);
  //   }
  //   if (results.leftHandLandmarks) {
  //     canvasCtx.strokeStyle = 'white';
  //     connect(canvasCtx, [[
  //               results.poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW],
  //               results.leftHandLandmarks[0]
  //             ]]);
  //   }
  // }

  // Pose...
  if(results.poseLandmarks) {
  drawConnectors(
      canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
      {color: 'white'});
  drawLandmarks(
      canvasCtx,
      Object.values(POSE_LANDMARKS_LEFT)
          .map(index => results.poseLandmarks[index]),
      {visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)'});
  drawLandmarks(
      canvasCtx,
      Object.values(POSE_LANDMARKS_RIGHT)
          .map(index => results.poseLandmarks[index]),
      {visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)'});
  }

  // Hands...
  drawConnectors(
      canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
      {color: 'white'});
  drawLandmarks(canvasCtx, results.rightHandLandmarks, {
    color: 'white',
    fillColor: 'rgb(0,217,231)',
    lineWidth: 2,
    radius: (data) => {
      return lerp(data.from.z, -0.15, .1, 10, 1);
    }
  });
  drawConnectors(
      canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
      {color: 'white'});
  drawLandmarks(canvasCtx, results.leftHandLandmarks, {
    color: 'white',
    fillColor: 'rgb(255,138,0)',
    lineWidth: 2,
    radius: (data) => {
      return lerp(data.from.z, -0.15, .1, 10, 1);
    }
  });

  // Face...
  drawConnectors(
      canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION,
      {color: '#C0C0C070', lineWidth: 1});
  drawConnectors(
      canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYE,
      {color: 'rgb(0,217,231)'});
  drawConnectors(
      canvasCtx, results.faceLandmarks, FACEMESH_RIGHT_EYEBROW,
      {color: 'rgb(0,217,231)'});
  drawConnectors(
      canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYE,
      {color: 'rgb(255,138,0)'});
  drawConnectors(
      canvasCtx, results.faceLandmarks, FACEMESH_LEFT_EYEBROW,
      {color: 'rgb(255,138,0)'});
  drawConnectors(
      canvasCtx, results.faceLandmarks, FACEMESH_FACE_OVAL,
      {color: '#E0E0E0', lineWidth: 5});
  drawConnectors(
      canvasCtx, results.faceLandmarks, FACEMESH_LIPS,
      {color: '#E0E0E0', lineWidth: 5});
  
  canvasCtx.restore();
}

const holistic = new Holistic({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/${file}`;
}});
holistic.setOptions({
  modelComplexity: 0,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  refineFaceLandmarks: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
holistic.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await holistic.send({image: videoElement});
    prevTime = time;
    time = Date.now();
    timecounter += time - prevTime;
    frames += 1;
    if(timecounter >= 1000) {
        console.log(`frames rendered: ${frames}`);
        frames = 0;
        timecounter = 0;
    }
  },
  width: 640,
  height: 480
});
canvasElement.width = 640;
canvasElement.height = 480;
camera.start();