<template>
  <div class="my-3">
    <image-uploader
      class="mb-3"
      :preview="false"
      capture="false"
      accept="video/*"
      :debug="1"
      :autoRotate="true"
      outputFormat="verbose"
      @input="handleVideoUpload"
    >
      <label for="fileInput" slot="upload-label" class="upload-label d-block">
        <div class="btn btn-primary mx-auto">Upload Video</div>
      </label>
    </image-uploader>

    <div class="video-player">
      <video width="960" height="720" ref="video" controls v-show="file != ''" autoPlay playsInline muted />
      <canvas width="960" height="720" ref="canvas" />
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Prop, Vue } from 'vue-property-decorator';
import * as cocoSSD from '@tensorflow-models/coco-ssd';
import { drawPredictions } from '../utils';

@Component
export default class WebCam extends Vue {
  @Prop() private model: cocoSSD.ObjectDetection | undefined;

  private videoResolution = { width: 960, height: 720 };
  private predictionInterval: number | undefined;
  private file = '';

  beforeDestroy() {
    clearInterval(this.predictionInterval);
  }

  handleVideoUpload() {
    const video = <HTMLVideoElement>this.$refs.video;
    this.file = event.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(this.file);
    reader.addEventListener('load', function () {
      video.src = reader.result;
    });

    video.onloadedmetadata = () => {
      this.videoResolution = { width: video.videoWidth, height: video.videoHeight };
      video.play();
      this.predictionInterval = setInterval(() => {
        this.analyzeVideoFrame(video);
      }, 50);
    };
  }

  analyzeVideoFrame(video: HTMLVideoElement) {
    if (video.readyState >= 3) {
      this.model.detect(video).then((predictions) => {
        const canvas = <HTMLCanvasElement>this.$refs.canvas;
        if (canvas) {
          const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          drawPredictions(predictions, ctx, this.videoResolution);
        }
      });
    }
  }
}
</script>

<style scoped lang="scss"></style>
