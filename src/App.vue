<template>
  <div id="app" class="text-center py-3">
    <h1>Vue Tensorflow Object Detection</h1>

    <div v-if="!model" class="mode-group">
      <button class="btn btn-primary m-3 mb-4 px-4" @click="loadCOCOModel">Load COCO-SSD</button>

      <div class="w-100">
        <button class="btn btn-primary m-3 mb-4" @click="loadFromStorage">Load Model From Storage</button>
        <button class="btn btn-primary m-3 mb-4" @click="loadFromURL">Load Model From URL</button>
        <input type="text" class="d-block w-50 mx-auto" v-model="url" />
      </div>

      <div v-if="loading" class="overlay">
        <div class="mt-3 loader" />
      </div>
    </div>

    <div v-else class="text-center">
      <div class="btn-group my-3 mx-auto">
        <button class="btn btn-secondary" @click="setMode('transfer')" :class="{ active: mode === 'transfer' }">
          TransferLearning
        </button>
        <button class="btn btn-secondary" @click="setMode('url')" :class="{ active: mode === 'url' }">Image URL</button>
        <button class="btn btn-secondary" @click="setMode('image')" :class="{ active: mode === 'image' }">
          Local Image
        </button>
        <button class="btn btn-secondary" @click="setMode('video')" :class="{ active: mode === 'video' }">
          Local Video
        </button>
        <button class="btn btn-secondary" @click="setMode('webcam')" :class="{ active: mode === 'webcam' }">
          WebCam
        </button>
        <button class="btn btn-secondary" @click="setMode('urlcam')" :class="{ active: mode === 'urlcam' }">
          UrlCam
        </button>
      </div>

      <div v-if="mode === 'image'">
        <ImageUpload :model="model" />
      </div>

      <div v-if="mode === 'url'">
        <ImageUrl :model="model" />
      </div>

      <div v-if="mode === 'video'">
        <VideoUpload :model="model" />
      </div>

      <div v-if="mode === 'webcam'">
        <WebCam :model="model" />
      </div>

      <div v-if="mode === 'urlcam'">
        <UrlCam :model="model" />
      </div>

      <div v-if="mode === 'transfer'">
        <TransferLearning :model="model" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Prop, Vue } from 'vue-property-decorator';
import ImageUpload from './components/ImageUpload.vue';
import ImageUrl from './components/ImageUrl.vue';
import VideoUpload from './components/VideoUpload.vue';
import WebCam from './components/WebCam.vue';
import UrlCam from './components/UrlCam.vue';
import TransferLearning from './components/TransferLearning.vue';
import * as cocoSSD from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
tf.setBackend('webgl');

@Component({
  components: {
    ImageUpload,
    ImageUrl,
    VideoUpload,
    WebCam,
    UrlCam,
    TransferLearning,
  },
})
export default class App extends Vue {
  model: cocoSSD.ObjectDetection | undefined = null;
  loading = false;
  mode = 'url';
  url = 'https://storage.googleapis.com/jmstore/TensorFlowJS/EdX/SavedModels/mobilenet-v2/model.json';

  setMode(mode: string) {
    this.mode = mode;
  }

  async loadCOCOModel() {
    try {
      this.loading = true;
      this.model = await cocoSSD.load();
    } catch (err) {
      console.log(err);
      alert(err);
    } finally {
      this.loading = false;
    }
  }

  async loadFromURL() {
    try {
      this.loading = true;
      this.model = await tf.loadLayersModel(this.url);
    } catch (err) {
      console.log(err);
      alert(err);
    } finally {
      this.loading = false;
    }
  }

  async loadFromStorage() {
    try {
      this.loading = true;
      let modelName = prompt('Please enter model name:', 'model');
      this.model = await tf.loadLayersModel(`indexeddb://${modelName}`);
    } catch (err) {
      console.log(err);
      alert(err);
    } finally {
      this.loading = false;
    }
  }
}
</script>

<style lang="scss">
@import 'assets/bootstrap/bootstrap.scss';
@import 'assets/global.scss';
@import url('https://pro.fontawesome.com/releases/v5.10.0/css/all.css');
</style>
