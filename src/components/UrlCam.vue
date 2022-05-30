<template>
  <div>
    <input type="text" class="d-block w-75 mx-auto" v-model="url" />
    <button class="btn btn-primary my-3" @click="changeUrlCam">Confirm Address</button>
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
import * as Hls from 'hls.js';

@Component
export default class UrlCam extends Vue {
  @Prop() private model: cocoSSD.ObjectDetection | undefined;

  private url: string = 'https://s1.worldcam.live:8082/zalewo-fontanna/tracks-v1/mono.m3u8';
  private hls = new Hls();
  private videoResolution = { width: 960, height: 720 };
  private predictionInterval: number | undefined;

  async mounted() {
    const video = await this.initUrlCam(this.$refs.video);
    this.videoResolution = { width: video.videoWidth, height: video.videoHeight };
    this.predictionInterval = setInterval(() => {
      this.analyzeVideoFrame(video);
    }, 50);
  }

  beforeDestroy() {
    clearInterval(this.predictionInterval);
  }

  initUrlCam(videoRef: Vue | Element | Vue[] | Element[]): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = <HTMLVideoElement>videoRef;

      if (Hls.isSupported()) {
        this.hls.loadSource(this.url);
        this.hls.attachMedia(video);
        this.hls.on(Hls.Events.MANIFEST_PARSED, function () {
          video.onloadedmetadata = () => {
            video.play();
            resolve(video);
          };
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = this.url;
        console.log('HLS is not supported');
      }
    }).catch((error) => {
      reject(new Error(error));
    });
  }

  async changeUrlCam() {
    clearInterval(this.predictionInterval);
    if (this.hls) {
      this.hls.detachMedia();
    }
    const video = await this.initUrlCam(this.$refs.video);
    this.videoResolution = { width: video.videoWidth, height: video.videoHeight };
    this.predictionInterval = setInterval(() => {
      this.analyzeVideoFrame(video);
    }, 50);
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
