<template>
  <div>
    <canvas
      class="canvas"
      ref="renderCanvas"
      id="renderCanvas"
      touch-action="none"
    ></canvas>

    <div>
      <div class="triangle" @mousemove.self="updatePosition">
        <div
          class="slider"
          :style="{ left: sliderPositionX, top: sliderPositionY }"
        ></div>
      </div>

      <div class="result">
        <p>Результат:</p>
        <p>X: {{ pointPosition.x }}</p>
        <p>Y: {{ pointPosition.y }}</p>
        <p>Z: {{ pointPosition.z }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";

// import * as BABYLON from "babylonjs";
// import "@babylonjs/loaders";
import {
  ArcRotateCamera,
  FreeCamera,
  FollowCamera,
  AnimationPropertiesOverride,
} from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import "@babylonjs/loaders";
import "@babylonjs/inspector";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import CharacterModel from "../sdk/CharacterModule";

const { pages } = defineProps({
  pages: Array,
});

const renderCanvas = ref(null);

const characterModelGlob = ref();

const sliderPositionX = ref("50%");
const sliderPositionY = ref("50%");
const pointPosition = ref({ x: 0, y: 0, z: 0 });

const updatePosition = (event) => {
  const triangle = event.currentTarget.getBoundingClientRect();

  const x = (event.clientX - triangle.left) / triangle.width;
  const y = (event.clientY - triangle.top) / triangle.height;

  console.log(1, x);
  console.log(1, y);
  console.log("triangle", event.currentTarget);
  console.log("event", event);

  sliderPositionX.value = `${x * 100}%`;
  sliderPositionY.value = `${y * 100}%`;

  characterModelGlob.value.changeModel(
    pointPosition.value.x,
    pointPosition.value.y,
    pointPosition.value.z
  );

  updatePointPosition(x, y);
};

const updatePointPosition = (x, y) => {
  const wA = 1 - x;
  const wB = 1 - y;
  const wC = y;

  pointPosition.value.x = wA;
  pointPosition.value.y = wB;
  pointPosition.value.z = wC;
};

onMounted(async () => {
  const canvas = renderCanvas.value;

  const engine = new Engine(canvas);

  const scene = new Scene(engine);

  const characterModel = new CharacterModel(scene);
  characterModelGlob.value = characterModel;

  const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

  camera.setTarget(Vector3.Zero());

  camera.attachControl(canvas, true);

  const light = new DirectionalLight("light", new Vector3(0, 0, 1), scene);

  light.intensity = 0.7;

  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 6, height: 6 },
    scene
  );

  let groundMaterial = new StandardMaterial("Ground Material", scene);
  ground.material = groundMaterial;

  await characterModel.build();
  console.log("red", characterModel.mCharacter);

  engine.runRenderLoop(() => {
    scene.render();
  });
});
</script>

<style scoped lang="scss">
html,
body {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.pressed_btn {
  background-color: rgb(255, 209, 6);
  box-shadow: inset 0px 0px 5px rgba(0, 0, 0, 0.2);
  transform: translateY(2px);
}

#renderCanvas {
  width: 100%;
  height: 100%;
  display: block;
  font-size: 0;
}

//TRIANGLE
.triangle {
  position: relative;
  width: 200px;
  height: 200px;
  background-color: lightgray;
}

.slider {
  position: absolute;
  width: 40px;
  height: 40px;
  background-color: red;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.result {
  margin-top: 20px;
}
//TRIANGLE/
</style>
