<template>
  <div>
    <canvas
      class="canvas"
      ref="renderCanvas"
      id="renderCanvas"
      touch-action="none"
    ></canvas>

    <div class="triangle_svg" ref="triangleContainer">
      <svg @mouseup="stopDrag" class="svg_triangle">
        <polygon
          @mousemove="handleMouseMove"
          :points="trianglePoints"
          fill="blue"
        ></polygon>
        <circle
          :cx="sliderX"
          :cy="sliderY"
          r="10"
          fill="red"
          @mousedown="startDrag"
        ></circle>
      </svg>
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
  Animation,
  Mesh,
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

const trianglePoints = ref("100,0 0,200 200,200");
const sliderX = ref(100);
const sliderY = ref(100);
let offsetX = 0;
let offsetY = 0;
let isDragging = false;

const startDrag = (event) => {
  if (event.button === 0) {
    console.log(1);
    const circle = event.target;
    if (circle.tagName === "circle") {
      isDragging = true;
      const rect = circle.getBoundingClientRect();
      offsetX = event.clientX - rect.left - sliderX.value;
      offsetY = event.clientY - rect.top - sliderY.value;
    }
  }
};

const handleMouseMove = (event) => {
  if (isDragging) {
    const rect = event.target.getBoundingClientRect();
    sliderX.value = event.clientX - rect.left;
    sliderY.value = event.clientY - rect.top;

    //Вычисляем долю каждого телосложения
    let posXY = sliderX.value - rect.width / 2;
    let posZ = sliderY.value - rect.height / 2;

    let z = posZ < 0 ? -posZ / (rect.height / 2) : 0;
    let x = posXY < 0 && z == 0 ? -posXY / (rect.width / 2) : 0;
    let y = posXY > 0 && z == 0 ? posXY / (rect.width / 2) : 0;
    characterModelGlob.value.changeModel(x, y, z);
  }
};

const stopDrag = () => {
  isDragging = false;
  console.log(3);
};

onMounted(async () => {
  const canvas = renderCanvas.value;

  const engine = new Engine(canvas);

  const scene = new Scene(engine);

  const characterModel = new CharacterModel(scene);
  characterModelGlob.value = characterModel;

  var camera = new ArcRotateCamera(
    "Camera",
    (3 * Math.PI) / 2,
    Math.PI / 4,
    14,
    Vector3.Zero(),
    scene
  );

  camera.attachControl(canvas, true);

  camera.lowerRadiusLimit = 10;
  camera.upperRadiusLimit = 20;

  const light = new DirectionalLight("light", new Vector3(0, 0, 1), scene);
  const light2 = new DirectionalLight("light", new Vector3(0, 0, -1), scene);

  light.intensity = 0.7;

  const ground = Mesh.CreateGround("ground", 1000, 1000, 1, scene, false);
  const groundMaterial = new StandardMaterial("ground", scene);
  groundMaterial.specularColor = Color3.Black();
  ground.material = groundMaterial;

  await characterModel.build();

  console.log("mCharacter", characterModel.mCharacter);

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
  width: 20px;
  height: 20px;
  background-color: red;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.result {
  margin-top: 20px;
}
//TRIANGLE/

.triangle_svg {
  position: relative;
  width: 200px;
  height: 200px;
  background-color: lightgray;
}

.svg_triangle {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  position: absolute;
}
</style>
