import classes from './classes.json';
import * as tf from '@tensorflow/tfjs';

export function drawPredictions(predictions, ctx, videoResolution = { width: 960, height: 720 }) {
  const widthRatio = videoResolution.width / 960;
  const heightRatio = videoResolution.height / 720;
  // console.log(widthRatio);
  // console.log(heightRatio);
  const font = '18px sans-serif';
  ctx.font = font;
  ctx.textBaseline = 'top';
  console.log(predictions);
  predictions.forEach((prediction) => {
    let [x, y, width, height] = prediction['bbox'];
    x /= widthRatio;
    y /= heightRatio;
    width /= widthRatio;
    height /= heightRatio;
    // Draw bounding box.
    const color = classes[prediction.class].color;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    // Draw label background.
    const text = `${prediction.class} (${Math.round(100 * prediction.score)} %)`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = parseInt(font, 10); // base 10
    ctx.fillRect(x, y - textHeight - 4, textWidth + 4, textHeight + 4);
    // Draw label
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x + 5, y - textHeight - 4);
  });
}
export const MODEL_INPUT_WIDTH = 224;
export const MODEL_INPUT_HEIGHT = 224;

export class TL {
  model = undefined;
  videoRef = undefined;
  modelBase = undefined;
  combinedModel = undefined;
  classNames = ['class 1', 'class 2'];
  predictLabel = document.getElementById('status');
  gatherDataState = -1;
  trainingDataInputs = [];
  trainingDataOutputs = [];
  examplesCount = [];
  predict = false;

  /**
   * Loads the model and warms it up so ready for use.
   **/
  constructor(model, videoRef) {
    this.videoRef = videoRef;
    const layer = model.getLayer('global_average_pooling2d_1');
    this.modelBase = tf.model({ inputs: model.inputs, outputs: layer.output });
    this.modelBase.summary();

    // Warm up the model by passing zeros through it once.
    tf.tidy(() => {
      const answer = this.modelBase.predict(tf.zeros([1, MODEL_INPUT_HEIGHT, MODEL_INPUT_WIDTH, 3]));
      console.log(answer.shape);
    });

    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ inputShape: [1280], units: 64, activation: 'relu' }));
    this.model.add(tf.layers.dense({ units: this.classNames.length, activation: 'softmax' }));

    this.model.summary();

    // Compile the model with the defined optimizer and specify a loss function to use.
    this.model.compile({
      // Adam changes the learning rate over time which is useful.
      optimizer: 'adam',
      // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
      // Else categoricalCrossentropy is used if more than 2 classes.
      loss: this.classNames.length === 2 ? 'binaryCrossentropy' : 'categoricalCrossentropy',
      // As this is a classification problem you can record accuracy in the logs too!
      metrics: ['accuracy'],
    });
  }

  calculateFeaturesOnCurrentFrame() {
    return tf.tidy(() => {
      // Grab pixels from current VIDEO frame.
      const videoFrameAsTensor = tf.browser.fromPixels(this.videoRef);
      // Resize video frame tensor to be MODEL_ pixels which is needed by MobileNet for input.
      const resizedTensorFrame = tf.image.resizeBilinear(
        videoFrameAsTensor,
        [MODEL_INPUT_HEIGHT, MODEL_INPUT_WIDTH],
        true
      );

      const normalizedTensorFrame = resizedTensorFrame.div(255);

      return this.modelBase.predict(normalizedTensorFrame.expandDims()).squeeze();
    });
  }

  /**
   * Handle Data Gather for button mouseup/mousedown.
   **/
  gather(classNumber) {
    this.gatherDataState = this.gatherDataState === -1 ? classNumber : -1;
    this.dataGatherLoop();
  }

  dataGatherLoop() {
    if (this.gatherDataState !== -1) {
      // Ensure tensors are cleaned up.
      const imageFeatures = this.calculateFeaturesOnCurrentFrame();

      this.trainingDataInputs.push(imageFeatures);
      this.trainingDataOutputs.push(this.gatherDataState);

      // Initialize array index element if currently undefined.
      if (this.examplesCount[this.gatherDataState] === undefined) {
        this.examplesCount[this.gatherDataState] = 0;
      }
      // Increment counts of examples for user interface to show.
      this.examplesCount[this.gatherDataState]++;

      let tempLabel = '';
      for (let n = 0; n < this.classNames.length; n++) {
        const count = this.examplesCount[n] ?? 0;
        tempLabel += this.classNames[n] + ' data count: ' + count + '\n';
      }
      this.predictLabel.innerText = tempLabel;

      window.requestAnimationFrame(() => {
        this.dataGatherLoop();
      });
    }
  }

  /**
   * Once data collected actually perform the transfer learning.
   **/
  async train() {
    this.predict = false;
    tf.util.shuffleCombo(this.trainingDataInputs, this.trainingDataOutputs);

    const outputsAsTensor = tf.tensor1d(this.trainingDataOutputs, 'int32');
    const oneHotOutputs = tf.oneHot(outputsAsTensor, this.classNames.length);
    const inputsAsTensor = tf.stack(this.trainingDataInputs);

    const results = await this.model.fit(inputsAsTensor, oneHotOutputs, {
      shuffle: true,
      batchSize: 5,
      epochs: 5,
      callbacks: { onEpochEnd: this.logProgress },
    });

    outputsAsTensor.dispose();
    oneHotOutputs.dispose();
    inputsAsTensor.dispose();

    this.predict = true;

    // Make combined model for download.

    const combinedModel = tf.sequential();
    combinedModel.add(this.modelBase);
    combinedModel.add(this.model);

    combinedModel.compile({
      optimizer: 'adam',
      loss: this.classNames.length === 2 ? 'binaryCrossentropy' : 'categoricalCrossentropy',
    });

    combinedModel.summary();
    this.combinedModel = combinedModel;
    this.predictLoop();
  }

  /**
   * Log training progress.
   **/
  logProgress(epoch, logs) {
    console.log('Data for epoch ' + epoch, logs);
  }

  /**
   *  Make live predictions from webcam once trained.
   **/
  predictLoop() {
    if (this.predict) {
      tf.tidy(() => {
        const imageFeatures = this.calculateFeaturesOnCurrentFrame();
        const prediction = this.model.predict(imageFeatures.expandDims()).squeeze();
        const highestIndex = prediction.argMax().arraySync();
        const predictionArray = prediction.arraySync();
        this.predictLabel.innerText =
          'Prediction: ' +
          this.classNames[highestIndex] +
          ' with ' +
          Math.floor(predictionArray[highestIndex] * 100) +
          '% confidence';
      });

      window.requestAnimationFrame(() => {
        this.predictLoop();
      });
    }
  }

  async save() {
    let modelName = prompt('Please enter model name:', 'model');
    await this.modelBase.save(`indexeddb://${modelName}`);
    // await this.combinedModel.save(`downloads://${modelName}`);
  }
  /**
   * Purge data and start over. Note this does not dispose of the loaded
   * MobileNet model and MLP head tensors as you will need to reuse
   * them to train a new model.
   **/
  reset() {
    this.predict = false;
    this.examplesCount.splice(0);
    for (let i = 0; i < this.trainingDataInputs.length; i++) {
      this.trainingDataInputs[i].dispose();
    }
    this.trainingDataInputs.splice(0);
    this.trainingDataOutputs.splice(0);
    this.predictLabel.innerText = 'Gather class data \n';

    window.cancelAnimationFrame(() => {
      this.predictLoop();
    });

    console.log('Tensors in memory: ' + tf.memory().numTensors);
  }

  manual() {
    const process = [
      '1. First enable webcam and allow access when asked.',
      '2. Now find an object, point cam at it, click and hold gather class 1 data button to gather at least 30 samples.',
      '3. Repeat for class 2 with a different object of interest. Get similar number of samples.',
      '4. Click train and wait while the model is trained live in your browser. No data is sent to server.',
      '5. Once trained you will see live predictions appear above the video for what it thinks it sees.',
    ];
    alert(process.join('\n'));
  }
}
