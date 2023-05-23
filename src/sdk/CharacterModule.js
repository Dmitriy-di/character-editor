import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { Scene } from '@babylonjs/core/scene'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
// import ConfigEditor from "./ConfigEditor";
import { SkeletonViewer } from '@babylonjs/core/Debug/skeletonViewer'
import { Space, Vector3, VertexBuffer } from '@babylonjs/core'
// import MathUtils from "../utils/MathUtils";

// редактируемая модель персонажа
export default class CharacterModel {
  mScene = null
  mCharacter = null // отредактированный
  mSkinny = null // худой
  mFat = null // жирный
  mAthletic = null // накачанный
  mNormal = null // обычное телосложение
  mIsUpdatableVertecies = null // являются ли массивы вершин обновляемыми
  // конструктор
  constructor(inScene) {
    this.mScene = inScene
    this.mIsUpdatableVertecies = false
  }
  // подгрузить и настроить модели персонажа
  async build() {
    this.mNormal = await this.loadModel('CharNormal.glb') // обычное телосложение
    this.mNormal.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mNormal.position = new Vector3(-4, 0, 0)
    this.mNormal.scaling = new Vector3(2, 2, -2)

    this.mAthletic = await this.loadModel('CharAthletic.glb') // накачанный
    this.mAthletic.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mAthletic.position = new Vector3(-2, 0, 0)
    this.mAthletic.scaling = new Vector3(2, 2, -2)

    this.mCharacter = await this.loadModel('CharNormal.glb') // обычное телосложение
    this.mCharacter.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mCharacter.position = new Vector3(0, 0, 0)
    this.mCharacter.scaling = new Vector3(2.5, 2.5, -2.5)
    //  this.mCharacter.skeleton.beginAnimation('default', 0, 0, false)

    this.mSkinny = await this.loadModel('CharSkinny.glb') // худой
    this.mSkinny.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mSkinny.position = new Vector3(2, 0, 0)
    this.mSkinny.scaling = new Vector3(2, 2, -2)

    this.mFat = await this.loadModel('CharFat.glb') // жирный
    this.mFat.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mFat.position = new Vector3(4, 0, 0)
    this.mFat.scaling = new Vector3(2, 2, -2)

    this.mIsUpdatableVertecies = false
  }
  // подгрузить модель персонажа
  async loadModel(inFilename) {
    const res = await SceneLoader.ImportMeshAsync(
      '',
      'assets/',
      inFilename,
      this.mScene,
      // 	function(newMeshes){
      // 		newMeshes[0].scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
      //   }
    )
    const resMesh = res.meshes[0]
    const MeshSkel = res.skeletons[0]
    resMesh.name = inFilename.replace('.glb', '')
    resMesh.checkCollisions = false
    resMesh.isPickable = false
    // apply to all children as well
    resMesh.getChildMeshes().forEach((child) => {
      child.checkCollisions = false
      child.isPickable = false
    })

    //  if (ConfigEditor.showSkeleton) {
    //    //DEBUG STUFF!
    //    let options = {
    //      pauseAnimations: false,
    //      returnToRest: false,
    //      computeBonesUsingShaders: true,
    //      useAllBones: true,
    //      displayMode: SkeletonViewer.DISPLAY_SPHERE_AND_SPURS,
    //      displayOptions: {
    //        sphereBaseSize: 10,
    //        sphereScaleUnit: 100,
    //        sphereFactor: 0.9,
    //        midStep: 0.25,
    //        midStepFactor: 0.05
    //      }
    //    };
    //    let skeletonView = new SkeletonViewer(
    //      MeshSkel,
    //      resMesh,
    //      this.mScene,
    //      false, //autoUpdateBoneMatrices?
    //      0,  // renderingGroup
    //      options
    //    );
    //  }
    return resMesh
  }
  // изменить модель в соответствии с весами
  changeModel(inSkinnyVal, inFatVal, inAthleticVal) {
    console.log(
      'inSkinnyVal = ' +
        inSkinnyVal +
        '; inFatVal = ' +
        inFatVal +
        '; inAthleticVal = ' +
        inAthleticVal,
    )
    //  const sVal = MathUtils.clamp(inSkinnyVal);
    //  const fVal = MathUtils.clamp(inFatVal);
    //  const aVal = MathUtils.clamp(inAthleticVal);

    const sVal = inSkinnyVal
    const fVal = inFatVal
    const aVal = inAthleticVal
    const meshes = this.mCharacter.getChildMeshes()
    const meshesS = this.mSkinny.getChildMeshes() // худой
    const meshesF = this.mFat.getChildMeshes() // жирный
    const meshesA = this.mAthletic.getChildMeshes() // накачанный
    const meshesN = this.mNormal.getChildMeshes() // обычное телосложение
    for (let i = 0; i < meshes.length; i++) {
      this.changeMesh(
        meshes[i],
        meshesN[i],
        meshesS[i],
        meshesF[i],
        meshesA[i],
        sVal,
        fVal,
        aVal,
      )
    }
    // после первого прогона изменений - вершины выставлены в обновляемые
    this.mIsUpdatableVertecies = true
  }
  // изменить непосредственно меш с вершинами
  changeMesh(
    inMesh = null,
    inMeshN = null,
    inMeshS = null,
    inMeshF = null,
    inMeshA = null,
    inSkinnyVal,
    inFatVal,
    inAthleticVal,
  ) {
    let positions = inMesh.getVerticesData(VertexBuffer.PositionKind)
    const len = positions.length
    const positionsN = inMeshN.getVerticesData(VertexBuffer.PositionKind)
    const positionsS = inMeshS.getVerticesData(VertexBuffer.PositionKind)
    const positionsF = inMeshF.getVerticesData(VertexBuffer.PositionKind)
    const positionsA = inMeshA.getVerticesData(VertexBuffer.PositionKind)
    if (positions && positionsN && positionsS && positionsF && positionsA) {
      if (
        positionsN.length === len &&
        positionsS.length === len &&
        positionsF.length === len &&
        positionsA.length === len
      ) {
        for (let i = 0; i < positions.length; i += 3) {
          const i2 = i + 1
          const i3 = i2 + 1
          // сдвигаем к худощавой моделе
          positions[i] =
            positionsN[i] + (positionsS[i] - positionsN[i]) * inSkinnyVal
          positions[i2] =
            positionsN[i2] + (positionsS[i2] - positionsN[i2]) * inSkinnyVal
          positions[i3] =
            positionsN[i3] + (positionsS[i3] - positionsN[i3]) * inSkinnyVal
          // сдвинутый к худому сдвигаем к толстому
          positions[i] =
            positions[i] + (positionsF[i] - positions[i]) * inFatVal
          positions[i2] =
            positions[i2] + (positionsF[i2] - positions[i2]) * inFatVal
          positions[i3] =
            positions[i3] + (positionsF[i3] - positions[i3]) * inFatVal
          // сдвинутый к толстому сдвигаем к атлетичному
          positions[i] =
            positions[i] + (positionsA[i] - positions[i]) * inAthleticVal
          positions[i2] =
            positions[i2] + (positionsA[i2] - positions[i2]) * inAthleticVal
          positions[i3] =
            positions[i3] + (positionsA[i3] - positions[i3]) * inAthleticVal
        }
        // нужно новый буффер создать, так как прошлый был не обновляемым
        if (this.mIsUpdatableVertecies)
          inMesh.updateVerticesData(
            VertexBuffer.PositionKind,
            positions,
            true,
            true,
          )
        else inMesh.setVerticesData(VertexBuffer.PositionKind, positions, true)
        //   I think the problem is that updateVerticesData returns early without doing anything if the buffer doesn’t exist already or if it isn’t updatable, but if you use setVerticesData it will create a new buffer for you and set it regardless. Try doing it like below.
        //  inSubMesh.updateVerticesData(VertexBuffer.PositionKind, positions);
      }
    }
    const meshes = inMesh.getChildMeshes()
    const meshesS = inMeshS.getChildMeshes() // худой
    const meshesF = inMeshF.getChildMeshes() // жирный
    const meshesA = inMeshA.getChildMeshes() // накачанный
    const meshesN = inMeshN.getChildMeshes() // обычное телосложение
    for (let j = 0; j < meshes.length; j++) {
      this.changeMesh(
        meshes[j],
        meshesN[j],
        meshesS[j],
        meshesF[j],
        meshesA[j],
        inSkinnyVal,
        inFatVal,
        inAthleticVal,
      )
    }
  }
}
