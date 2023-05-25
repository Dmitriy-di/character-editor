<template>
  <div>
    <canvas
      class="canvas"
      ref="renderCanvas"
      id="renderCanvas"
      touch-action="none"
    ></canvas>

    <div class="triangle_svg">
      <svg class="svg_triangle">
        <polygon
          @mousemove.self="handleMouseMove"
          :points="trianglePoints"
          fill="blue"
        ></polygon>
        <circle :cx="sliderX" :cy="sliderY" r="10" fill="red"></circle>
      </svg>
    </div>

    <!-- <div>
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
    </div> -->
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

// const sliderPositionX = ref("50%");
// const sliderPositionY = ref("50%");
// const pointPosition = ref({ x: 0, y: 0, z: 0 });
const trianglePoints = ref("100,0 0,200 200,200");
const sliderX = ref(100);
const sliderY = ref(100);
let x = 0;
let y = 0;
let z = 0;

// const updatePosition = (event) => {
//   const triangle = event.currentTarget.getBoundingClientRect();

//   const x = (event.clientX - triangle.left) / triangle.width;
//   const y = (event.clientY - triangle.top) / triangle.height;

//   console.log(1, x);
//   console.log(1, y);
//   console.log("triangle.left", triangle.left);
//   console.log("triangle.top", triangle.top);
//   console.log("event.clientX", event.clientX);
//   console.log("event.clientY", event.clientY);

//   sliderPositionX.value = `${x * 100}%`;
//   sliderPositionY.value = `${y * 100}%`;

//   updatePointPosition(x, y);
// };

// const updatePointPosition = (x, y) => {
//   const wA = 1 - x;
//   const wB = 1 - y;
//   const wC = y;
//   console.log(wA, wB, wC);

//   pointPosition.value.x = wA;
//   pointPosition.value.y = wB;
//   pointPosition.value.z = wC;

//   //ХУДОЙ ТОЛСТЫЙ АТЛЕТИЧНЫЙ
//   // characterModelGlob.value.changeModel(wA, wB, wC);
// };

const handleMouseMove = (event) => {
  // Получаем координаты мыши относительно SVG-контейнера
  const svgRect = event.target.getBoundingClientRect();
  const mouseX = event.clientX - svgRect.left;
  const mouseY = event.clientY - svgRect.top;

  // Обновляем значения координат ползунка в модели
  sliderX.value = mouseX;
  sliderY.value = mouseY;

  //Вычисляем долю каждого телосложения
  let posXY = mouseX - svgRect.width / 2;
  let posZ = mouseY - svgRect.height / 2;

  let x = posXY < 0 ? -posXY / (svgRect.width / 2) : 0;
  let y = posXY > 0 ? posXY / (svgRect.width / 2) : 0;
  let z = posZ < 0 ? -posZ / (svgRect.height / 2) : 0;
  characterModelGlob.value.changeModel(x, y, z);
  console.log("x", x);
  console.log("y", y);
  console.log("z", z);
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

  const ground = Mesh.CreateGround("ground", 1000, 1000, 1, scene, false);
  const groundMaterial = new StandardMaterial("ground", scene);
  groundMaterial.specularColor = Color3.Black();
  ground.material = groundMaterial;

  // let groundMaterial = new StandardMaterial("Ground Material", scene);
  // ground.material = groundMaterial;

  await characterModel.build();
  console.log("red", characterModel.mCharacter.isPickable);
  console.log("red", characterModel.mSkinny.isPickable);
  console.log("red", characterModel.mFat.isPickable);
  console.log("red", characterModel.mAthletic.isPickable);
  console.log("red", characterModel.mNormal.isPickable);

  const mCharacter = characterModel.mCharacter;

  // scene.onPointerDown = function (event) {
  //   let pickResult = scene.pick(event.clientX, event.clientY);
  //   let pickedPoint = pickResult.pickedPoint;
  //   console.log(pickedPoint);
  // };

  let isDragging = false; // Флаг для отслеживания состояния перетаскивания
  let pickedPoint = null; // Выбранная точка для перемещения

  scene.onPointerDown = function (event) {
    if (event.button === 0) {
      // Проверка нажатия левой кнопки мыши

      let pickResult = scene.pick(event.clientX, event.clientY);
      pickedPoint = pickResult.pickedPoint;
      console.log(pickResult.pickedMesh);
      console.log(pickResult.pickedPoint);

      // Ваш код обработки начала перетаскивания
      isDragging = true;
    }
  };

  scene.onPointerUp = function (event) {
    if (event.button === 0) {
      // Проверка отпускания левой кнопки мыши
      // Ваш код обработки окончания перетаскивания
      isDragging = false;
      pickedPoint = null;
    }
  };

  scene.onPointerMove = function (event) {
    if (isDragging && pickedPoint) {
      let pickResult = scene.pick(event.clientX, event.clientY);
      let newPoint = pickResult.pickedPoint;

      // Ваш код для перемещения точек модели в определенном радиусе
      // Вы можете использовать методы изменения позиции меша или его вершин

      // Пример изменения позиции меша
      let distance = Vector3.Distance(pickedPoint, newPoint);
      if (distance <= 1) {
        console.log(mCharacter);
        // // Изменение позиции меша
        // mCharacter.position.addInPlace(newPoint.subtract(pickedPoint));

        // // Или изменение позиции вершин меша
        // let vertices = mCharacter.getVerticesData(VertexBuffer.PositionKind);
        // for (let i = 0; i < vertices.length; i += 3) {
        //   let vertex = new Vector3(
        //     vertices[i],
        //     vertices[i + 1],
        //     vertices[i + 2]
        //   );
        //   let vertexDistance = Vector3.Distance(pickedPoint, vertex);
        //   if (vertexDistance <= 1) {
        //     vertices[i] += newPoint.x - pickedPoint.x;
        //     vertices[i + 1] += newPoint.y - pickedPoint.y;
        //     vertices[i + 2] += newPoint.z - pickedPoint.z;
        //   }
        // }
        // mCharacter.updateVerticesData(VertexBuffer.PositionKind, vertices);
      }

      pickedPoint = newPoint;
    }
  };

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
