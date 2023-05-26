import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { Scene } from '@babylonjs/core/scene'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { SkeletonViewer } from '@babylonjs/core/Debug/skeletonViewer'
import { Space, Vector3, VertexBuffer } from '@babylonjs/core'

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
    // this.mNormal.position = new Vector3(-4, 0, 0)
    this.mNormal.scaling = new Vector3(0, 0, 0)

    this.mAthletic = await this.loadModel('CharAthletic.glb') // накачанный
    this.mAthletic.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mAthletic.position = new Vector3(-2, 0, 0)
    this.mAthletic.scaling = new Vector3(0, 0, 0)

    this.mCharacter = await this.loadModel('CharNormal.glb') // обычное телосложение
    // this.mCharacter.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    // this.mCharacter.position = new Vector3(0, 0, 0)

    this.mSkinny = await this.loadModel('CharSkinny.glb') // худой
    this.mSkinny.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    // this.mSkinny.position = new Vector3(2, 0, 0)
    this.mSkinny.scaling = new Vector3(0, 0, 0)

    this.mFat = await this.loadModel('CharFat.glb') // жирный
    this.mFat.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    // this.mFat.position = new Vector3(4, 0, 0)
    this.mFat.scaling = new Vector3(0, 0, -0)

    this.mIsUpdatableVertecies = false
  }

  // подгрузить модель персонажа
  async loadModel(inFilename) {
    const res = await SceneLoader.ImportMeshAsync(
      '',
      'assets/',
      inFilename,
      this.mScene,
    )

    //Остановка анимации
    res.animationGroups[0].stop()

    //Запуск анимации
    //  res.animationGroups[0].start()

    const resMesh = res.meshes[0]
    const MeshSkel = res.skeletons[0]
    resMesh.name = inFilename.replace('.glb', '')
    resMesh.checkCollisions = false
    // Чтобы на модели срабатывало событие onPointerDown/Up
    resMesh.isPickable = true
    // apply to all children as well
    resMesh.getChildMeshes().forEach((child) => {
      child.checkCollisions = false
      child.isPickable = true
    })

    return resMesh
  }

  // изменить модель в соответствии с весами
  changeModel(inSkinnyVal, inFatVal, inAthleticVal) {
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
    //! Убрать получение массивов координат всех моделей, на получение массива координат только нужной модели
    const positionsN = inMeshN.getVerticesData(VertexBuffer.PositionKind)
    const positionsS = inMeshS.getVerticesData(VertexBuffer.PositionKind)
    const positionsF = inMeshF.getVerticesData(VertexBuffer.PositionKind)
    const positionsA = inMeshA.getVerticesData(VertexBuffer.PositionKind)

    // inVal - модель, в сторону которой меняется текущая модель, positionType - массив координат вершин модели inVal
    const { inVal, positionsType } = inSkinnyVal
      ? { inVal: inSkinnyVal, positionsType: positionsS }
      : inFatVal
      ? { inVal: inFatVal, positionsType: positionsF }
      : { inVal: inAthleticVal, positionsType: positionsA }

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

          positions[i] =
            positionsN[i] + (positionsType[i] - positionsN[i]) * inVal
          positions[i2] =
            positionsN[i2] + (positionsType[i2] - positionsN[i2]) * inVal
          positions[i3] =
            positionsN[i3] + (positionsType[i3] - positionsN[i3]) * inVal
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

  computeCenterSphereCoord(sphere) {
    return sphere.position
  }

  // computeCenterSphereCoord(sphere) {
  //   const positions = sphere.getVerticesData(VertexBuffer.PositionKind)
  //   const vertex = new Vector3(positions[0], positions[1], positions[2])
  //   const distance = Vector3.Distance(vertex, sphere.position)
  //   return distance
  // }

  computeSphereRadiusInLocalCoordSystem(sphere, matrix) {
    const positions = sphere.getVerticesData(VertexBuffer.PositionKind)

    const pointOnSphere = new Vector3(positions[0], positions[1], positions[2])
    //При создании сферы её центр находится в (0,0,0) и при смещении центра не меняется массив positions, поэтому делаем так
    const centerSphere = new Vector3(0, 0, 0)

    const localPointOnSphere = Vector3.TransformCoordinates(
      pointOnSphere,
      matrix,
    )
    const localCenterSphere = Vector3.TransformCoordinates(centerSphere, matrix)

    const localRadiusSphere = Vector3.Distance(
      localPointOnSphere,
      localCenterSphere,
    )
    return localRadiusSphere
  }

  squareDistTwoVertex3D(a, b) {
    // console.log('center', a)
    // console.log('point', b)
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
  }

  getIndexesVertexesModelInSphere(sphere, model) {
    let indexesModelInSphere = []
    //!Без clone при срабатывании matrix.invert() модель исчезает
    const matrix = model.computeWorldMatrix(true).clone()
    const invertedMatrix = matrix.invert()
    let squareDistanceToCenterSphere = null
    const centerSphere = this.computeCenterSphereCoord(sphere)
    let modelPoint = null
    const squareLocalRadiusSphere =
      this.computeSphereRadiusInLocalCoordSystem(sphere, matrix) ** 2
    console.log('localRadiusSphere', squareLocalRadiusSphere)

    // Преобразование координат центра сферы в координаты относительно координат model
    const localCenterSphere = Vector3.TransformCoordinates(
      centerSphere,
      invertedMatrix,
    )

    console.log('localCenterSphere', localCenterSphere)

    let positionsModel = model.getVerticesData(VertexBuffer.PositionKind)
    for (let j = 0, length = positionsModel.length; j < length; j += 3) {
      modelPoint = {
        x: positionsModel[j],
        y: positionsModel[j + 1],
        z: positionsModel[j + 2],
      }
      squareDistanceToCenterSphere = this.squareDistTwoVertex3D(
        localCenterSphere,
        modelPoint,
      )

      if (squareDistanceToCenterSphere < squareLocalRadiusSphere) {
        indexesModelInSphere.push(j)
        // console.log('modelPoint', modelPoint)
        // console.log('localCenterSphere', localCenterSphere)
        // console.log(
        //   '123',
        //   squareDistanceToCenterSphere,
        //   squareLocalRadiusSphere,
        // )
      }
    }
    return indexesModelInSphere
  }

  changePartModelInSphere(sphere, inMesh = null) {
    const indexesModelInSphere = this.getIndexesVertexesModelInSphere(
      sphere,
      inMesh,
    )
    console.log('Индексы внутри сферы', indexesModelInSphere)

    let positions = inMesh.getVerticesData(VertexBuffer.PositionKind)

    for (let j = 0, len = indexesModelInSphere.length; j < len; j++) {
      positions[indexesModelInSphere[j]] *= 1.01
      positions[indexesModelInSphere[j] + 1] *= 1.01
      positions[indexesModelInSphere[j] + 2] *= 1.01
      // console.log(positions[j], positions[j + 1], positions[j + 2])
    }

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

    const meshes = inMesh.getChildMeshes()

    for (let j = 0, len = meshes.length; j < len; j++) {
      this.changePartModelInSphere(meshes[j])
    }
  }

  changePartMeshInSphere(sphere, model) {
    const meshes = model.getChildMeshes()

    for (let i = 0; i < meshes.length; i++) {
      this.changePartModelInSphere(sphere, meshes[i])
    }
  }
}
