const modelURL = "https://teachablemachine.withgoogle.com/models/GOHUKogW7/";
// the json file (model topology) has a reference to the bin file (model weights)
const checkpointURL = modelURL + "model.json";
// the metatadata json file contains the text labels of your model and additional information
const metadataURL = modelURL + "metadata.json";

const size = 300;
const flip = true; // whether to flip the webcam
let webcam;
let model;
let totalClasses;
let myCanvas;
let ctx;
let label = "waiting...";

// A function that loads the model from the checkpoint
async function load() {
  model = await tmPose.load(checkpointURL, metadataURL);
  totalClasses = model.getTotalClasses();
  console.log("Number of classes, ", totalClasses);
}

async function loadWebcam() {
  webcam = new tmPose.Webcam(size, size, flip); // can change width and height
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(loopWebcam);
}

async function setup() {
  myCanvas = createCanvas(size * 2, size);
  ctx = myCanvas.elt.getContext("2d");
  // Call the load function, wait until it finishes loading
  await load();
  await loadWebcam();
  //rect(300, 0, 300, 300);
}

async function loopWebcam(timestamp) {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loopWebcam);
}

async function predict() {
  // Prediction #1: run input through posenet
  // predict can take in an image, video or canvas html element
  const flipHorizontal = false;
  const { pose, posenetOutput } = await model.estimatePose(
    webcam.canvas,
    flipHorizontal
  );
  // Prediction 2: run input through teachable machine assification model
  const prediction = await model.predict(
    posenetOutput,
    flipHorizontal,
    totalClasses
  );

  // console.log('prediction: ', prediction);
  // Sort prediction array by probability
  // So the first classname will have the highest probability
  const sortedPrediction = prediction.sort(
    (a, b) => -a.probability + b.probability
  );
  label = sortedPrediction[0].className;
  // Show the result
  const res = select("#res"); // select <span id="res">
  res.html(sortedPrediction[0].className);

  // Show the probability
  const prob = select("#prob"); // select <span id="prob">
  prob.html(sortedPrediction[0].probability.toFixed(2));

  // draw the keypoints and skeleton
  if (pose) {
    drawPose(pose);
  }
}

function drawPose(pose) {
  if (webcam.canvas) {
    ctx.drawImage(webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);

      const c = color(0);
      fill(c);
      noStroke();
      rect(300, 0, 300, 300);
      textAlign(CENTER, CENTER);
      fill(255);
      //text(label, 450, 250);
      let emoji = "👋";
      if (label == "Right") {
        emoji = "👉";
      } else if (label == "Left") {
        emoji = "👈";
      } else if (label == "Neutral") {
        emoji = "🫰";
      }

      // Draw the emoji
      textSize(150);
      text(emoji, 450, 150);
    }
  }
}
