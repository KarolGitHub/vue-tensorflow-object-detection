<template>
  <div class="my-3">
    <image-uploader
      class="mb-3"
      :preview="false"
      capture="environment"
      :debug="1"
      doNotResize="gif"
      :autoRotate="true"
      outputFormat="verbose"
      accept="image/*"
      @input="setImage"
    >
      <label for="fileInput" slot="upload-label" class="upload-label d-block">
        <div class="btn btn-primary mx-auto">Upload Image</div>
      </label>
    </image-uploader>

    <canvas ref="canvas" width="1" height="1" />
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Prop, Vue } from 'vue-property-decorator';
import * as cocoSSD from '@tensorflow-models/coco-ssd';
import { drawPredictions } from '../utils';

@Component
export default class ImageUpload extends Vue {
  @Prop() private model: cocoSSD.ObjectDetection | undefined;

  private loaded = false;

  setImage(file) {
    this.loaded = true;

    let $image = new Image();
    $image.src = file.dataUrl;
    $image.onload = (e) => {
      const canvas = <HTMLCanvasElement>this.$refs.canvas;
      const ctx = <CanvasRenderingContext2D>canvas.getContext('2d');

      const path = e.path || (e.composedPath && e.composedPath());

      ctx.canvas.width = Math.min(window.innerWidth, path[0].width);
      ctx.canvas.height = Math.min(window.innerHeight, path[0].height);

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage($image, 0, 0);

      this.model.detect(canvas).then((predictions) => {
        drawPredictions(predictions, ctx);
      });
    };
  }
}
</script>

<style lang="scss"></style>
