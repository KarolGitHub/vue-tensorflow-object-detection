<template>
  <div>
    <div class="video-player">
      <video width="960" height="720" ref="video" autoPlay playsInline muted />
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

  private predictionInterval;

  async mounted() {
    const video = await this.initWebCam(this.$refs.video);
    this.predictionInterval = setInterval(() => {
      this.analyzeVideoFrame(video);
    }, 50);
  }

  beforeDestroy() {
    clearInterval(this.predictionInterval);
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
