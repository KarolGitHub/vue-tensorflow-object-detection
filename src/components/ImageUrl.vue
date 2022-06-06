<template>
  <div>
    <div class="mb-3">
      <input type="text" class="d-block w-75 mx-auto" v-model="url" />
      <button class="btn btn-primary mt-3" @click="fetchImage">Load Image Url</button>
    </div>
    <canvas ref="canvas" width="1" height="1" />
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Prop, Vue } from 'vue-property-decorator';
import * as cocoSSD from '@tensorflow-models/coco-ssd';
import { drawPredictions } from '../utils';

@Component
export default class ImageUrl extends Vue {
  @Prop() private model: cocoSSD.ObjectDetection | undefined;

  private url: string = 'https://i.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U';

  fetchImage() {
    let $image = new Image();
    $image.crossOrigin = 'Anonymous';
    $image.onerror = function () {
      alert('Failed to fetch img from url');
    };
    $image.onabort = function () {
      alert('aborted');
    };
    $image.onload = (e) => {
      const canvas = <HTMLCanvasElement>this.$refs.canvas;
      const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      ctx.canvas.width = Math.min(window.innerWidth, e.path[0].width);
      ctx.canvas.height = Math.min(window.innerHeight, e.path[0].height);

      ctx.drawImage($image, 0, 0);

      this.model.detect(canvas).then((predictions) => {
        drawPredictions(predictions, ctx);
      });
    };
    $image.src = this.url;
  }
}
</script>

<style lang="scss"></style>
