<template>
  <div>
    <div class="btn-group">
      <button class="btn btn-info" @click="manual">Manual</button>
      <button class="btn btn-light" @click="gather(0)">Gather Class 1 Data</button>
      <button class="btn btn-warning" @click="gather(1)">Gather Class 2 Data</button>
      <button class="btn btn-primary" @click="train">Train</button>
      <button class="btn btn-success" @click="save">Save</button>
      <button class="btn btn-danger" @click="reset">Reset</button>
    </div>

    <p class="m-3" id="status">Gather class data <br /><br /></p>

    <div class="video-player">
      <video width="960" height="720" ref="video" />
      <canvas width="960" height="720" ref="canvas" />
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Prop, Vue } from 'vue-property-decorator';
import * as tf from '@tensorflow/tfjs';
import { drawPredictions, TL } from '../utils';

@Component
export default class TransferLearning extends Vue {
  @Prop() private model: tf.GraphModel | undefined;

  data() {
    return {
      tl: null,
    };
  }

  async mounted() {
    const video = await this.initWebCam(this.$refs.video);
    this.tl = new TL(this.model, this.$refs.video);
  }

  beforeDestroy() {
    this.tl.reset();
  }

  initWebCam(videoRef: Vue | Element | Vue[] | Element[]): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const getUserMedia = (navigator.getUserMedia =
        navigator.getUserMedia ||
        navigatorAny.webkitGetUserMedia ||
        navigatorAny.mozGetUserMedia ||
        navigatorAny.msGetUserMedia);

      if (getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          const video = <HTMLVideoElement>videoRef;

          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            resolve(video);
          };
        });
      } else {
        reject();
      }
    });
  }

  gather(number) {
    this.tl.gather(number);
  }

  train() {
    this.tl.train();
  }

  save() {
    this.tl.save();
  }

  reset() {
    this.tl.reset();
  }

  manual() {
    this.tl.manual();
  }
}
</script>

<style scoped lang="scss"></style>
