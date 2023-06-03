<template @mouseup="stopDrag">
  <div>
    <q-btn-group>
      <q-btn
        :class="btnsToggleBool[0] ? 'pressed_btn' : ''"
        @click="toggleGizmo(0, 'positionGizmoEnabled')"
        glossy
        label="Смещение"
      />

      <q-btn
        :class="btnsToggleBool[1] ? 'pressed_btn' : ''"
        @click="toggleGizmo(1, 'rotationGizmoEnabled')"
        glossy
        label="Вращение"
      />

      <q-btn
        :class="btnsToggleBool[2] ? 'pressed_btn' : ''"
        @click="toggleGizmo(2, 'scaleGizmoEnabled')"
        glossy
        label="Масштабирование"
      />

      <q-btn
        :class="btnsToggleBool[3] ? 'pressed_btn' : ''"
        @click="toggleGizmo(3, 'boundingBoxGizmoEnabled')"
        glossy
        label="Мульти"
      />

      <q-btn
        :class="btnsToggleBool[4] ? 'pressed_btn' : ''"
        @click="toggleGizmo(4)"
        glossy
        label="Курсор"
      />
    </q-btn-group>

    <canvas
      class="canvas"
      ref="renderCanvas"
      id="renderCanvas"
      touch-action="none"
    ></canvas>

    <q-btn @click="changeModel">Увеличить</q-btn>
    <q-btn @click="rotateModel">Повернуть</q-btn>

    <div class="triangle_svg" ref="triangleContainer">
      <svg @mouseup="stopDrag" class="svg_triangle">
        <polygon
          class="polygon_triangle"
          :points="trianglePoints"
          fill="transparent"
          ref="trianglePolygon"
          @mousemove="handleMouseMove"
        ></polygon>
        <image
          class="circleInTriangle"
          :x="sliderX - imageSize / 2"
          :y="sliderY - imageSize / 2"
          :width="imageSize"
          :height="imageSize"
          xlink:href="../assets/circleInTriangle.svg"
          @mousedown.self="startDrag"
        ></image>
      </svg>

      <!-- <img class="triangle_img" src="../assets/triangleBodyGange.svg" alt="" /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import {
  ArcRotateCamera,
  FreeCamera,
  FollowCamera,
  AnimationPropertiesOverride,
  Animation,
  Mesh,
  PointerEventTypes,
  ActionManager,
  VertexBuffer,
  GizmoManager,
  TransformNode,
  ShaderStore,
  ShaderMaterial,
  ShaderLanguage,
  UniformBuffer,
  TextureSampler,
  Constants,
  Effect,
} from "@babylonjs/core";
import { Engine } from "@babylonjs/core/Engines/engine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import "@babylonjs/loaders";
import "@babylonjs/inspector";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import CharacterModel from "../sdk/CharacterModule";
import { Tools } from "@babylonjs/inspector/tools";

const { pages } = defineProps({
  pages: Array,
});

let btnsToggleBool = ref([true, false, false, false, false]);
let offsetX = 0;
let offsetY = 0;
let sphere = null;
let isDragging = false;

const renderCanvas = ref(null);
const trianglePolygon = ref(null);
const characterModelGlob = ref();
const gizmoManager = ref(null);
const trianglePoints = ref("100,0 0,170 200,170");
const sliderX = ref(100);
const sliderY = ref(100);
const imageSize = 30;
const currentGizmoAction = ref("positionGizmoEnabled");

const startDrag = (event) => {
  if (event.button === 0) {
    isDragging = true;
  }
};

const handleMouseMove = (event) => {
  if (isDragging) {
    const rect = event.target.getBoundingClientRect();
    //globalPointToChange(rect, event.clienntX, event.clientY)
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

const stopDrag = (event) => {
  isDragging = false;
};

const changeModel = () => {
  characterModelGlob.value.changePartModelInSphere(
    sphere,
    characterModelGlob.value.mCharacter
  );
};

const rotateModel = () => {
  // sphere.addChild(characterModelGlob.value.mCharacter);
  // console.log(characterModelGlob.value);

  characterModelGlob.value.rotatePartModelInSphere(
    sphere,
    characterModelGlob.value.mCharacter
  );
};

const toggleGizmoManager = function (arrValues) {
  gizmoManager.value.positionGizmoEnabled = arrValues[0];
  gizmoManager.value.rotationGizmoEnabled = arrValues[1];
  gizmoManager.value.scaleGizmoEnabled = arrValues[2];
  gizmoManager.value.boundingBoxGizmoEnabled = arrValues[3];
};

const toggleGizmo = (ind, giz) => {
  btnsToggleBool.value = [false, false, false, false, false];
  btnsToggleBool.value[ind] = true;
  if (ind == 4) {
    toggleGizmoManager([false, false, false, false, false]);
    return;
  }
  if (gizmoManager.value) {
    gizmoManager.value[currentGizmoAction.value] = false;
    gizmoManager.value[giz] = !gizmoManager.value[giz];
  }
  currentGizmoAction.value = giz;
};

onMounted(async () => {
  document.body.addEventListener("mouseup", stopDrag);

  const canvas = renderCanvas.value;

  const engine = new Engine(canvas);

  const scene = new Scene(engine);

  const characterModel = new CharacterModel(scene, engine);
  characterModelGlob.value = characterModel;

  var camera = new ArcRotateCamera(
    "Camera",
    Math.PI / 2,
    Math.PI / 4,
    50,
    new Vector3(0, 1, 0),
    scene
  );

  camera.attachControl(canvas, true);

  camera.lowerRadiusLimit = 0.2;
  camera.upperRadiusLimit = 7;

  camera.useBouncingBehavior = true;

  const light = new DirectionalLight("light", new Vector3(0, 0, 1), scene);
  const light2 = new DirectionalLight("light", new Vector3(0, 0, -1), scene);

  light.intensity = 0.7;

  const ground = Mesh.CreateGround("ground", 1000, 1000, 1, scene, false);
  const groundMaterial = new StandardMaterial("ground", scene);
  groundMaterial.specularColor = Color3.Yellow();
  ground.material = groundMaterial;

  await characterModel.build();

  console.log("mCharacter", characterModel.mCharacter);

  // scene.onPointerObservable.add(function (evt) {
  //   console.log(evt.pickInfo.pickedMesh);
  // }, PointerEventTypes.POINTERUP);

  //Добавление сферы на сцену
  sphere = Mesh.CreateSphere(`sphere`, 16, 0.4, scene);

  sphere.position.y = 1;

  let material = new StandardMaterial("transparentMaterial", scene);
  material.alpha = 0.3; // Установка прозрачности (от 0 до 1)
  sphere.material = material;

  sphere.actionManager = new ActionManager(scene);
  sphere.material.diffuseColor = Color3.Blue();
  gizmoManager.value = new GizmoManager(scene);
  gizmoManager.value.boundingBoxGizmoEnabled = true;
  gizmoManager.value.attachableMeshes = [sphere];

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

.circleInTriangle {
  position: relative;
  z-index: 1;
}

.polygon_triangle {
  position: relative;
  z-index: 2;
}
//TRIANGLE/

.triangle_svg {
  position: relative;
  width: 200px;
  height: 200px;
  background-color: transparent;
  background-image: url("../assets/triangleBodyGange.svg");
  background-size: 100% 100%;
  background-position: center;
}

// .triangle_img {
//   position: absolute;
//   width: 100%;
//   height: 100%;
// }

.svg_triangle {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  position: absolute;
}

.pressed_btn {
  background-color: rgb(255, 209, 6);
  box-shadow: inset 0px 0px 5px rgba(0, 0, 0, 0.2);
  transform: translateY(2px);
}
</style>
