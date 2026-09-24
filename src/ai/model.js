/**
 * Edge Machine Learning Model using TensorFlow.js
 * Runs locally in the browser runtime with zero internet dependency
 */
import * as tf from '@tensorflow/tfjs';

let localModel = null;
let isInitialized = false;

/**
 * Initializes and compiles the local edge neural network
 * @returns {Promise<tf.LayersModel>}
 */
export async function getOrInitModel() {
  if (localModel && isInitialized) {
    return localModel;
  }

  try {
    // Construct Edge Multi-Layer Perceptron (MLP) for precision irrigation regression
    const model = tf.sequential();

    // Layer 1: Input feature extraction (10 features)
    model.add(tf.layers.dense({
      inputShape: [10],
      units: 16,
      activation: 'relu',
      kernelInitializer: 'glorotNormal',
      name: 'dense_feature_fusion'
    }));

    // Layer 2: Latent Agronomic Dynamics
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu',
      kernelInitializer: 'glorotNormal',
      name: 'dense_agronomic_latent'
    }));

    // Layer 3: Multitask Output Regression (Water Req, Duration, Waterbank Survival Days)
    model.add(tf.layers.dense({
      units: 3,
      activation: 'sigmoid',
      kernelInitializer: 'glorotNormal',
      name: 'dense_predictions'
    }));

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });

    localModel = model;
    isInitialized = true;
    console.log('[AI Edge Model] TensorFlow.js model compiled successfully in browser memory.');
    return localModel;
  } catch (error) {
    console.error('[AI Edge Model] Failed to initialize TensorFlow.js:', error);
    throw error;
  }
}

/**
 * Execute raw tensor prediction
 * @param {Array<number>} normalizedFeatures 
 * @returns {Promise<Array<number>>} [normWaterReq, normDuration, normWaterbankDays]
 */
export async function runInference(normalizedFeatures) {
  const model = await getOrInitModel();

  return tf.tidy(() => {
    const inputTensor = tf.tensor2d([normalizedFeatures], [1, 10]);
    const outputTensor = model.predict(inputTensor);
    const outputArray = Array.from(outputTensor.dataSync());
    return outputArray;
  });
}
