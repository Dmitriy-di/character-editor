import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { Scene } from '@babylonjs/core/scene'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { SkeletonViewer } from '@babylonjs/core/Debug/skeletonViewer'
import { Quaternion, Vector3, Matrix } from '@babylonjs/core/Maths/math.vector'
import {
  Space,
  VertexBuffer,
  TransformNode,
  Mesh,
  GizmoManager,
  ShaderStore,
  ShaderMaterial,
  UniformBuffer,
  ShaderLanguage,
  Constants,
  TextureSampler,
} from '@babylonjs/core'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'

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
  constructor(inScene, inEngine) {
    this.mScene = inScene
    this.mIsUpdatableVertecies = false
    this.mEngine = inEngine
  }
  // подгрузить и настроить модели персонажа
  async build() {
    this.mNormal = await this.loadModel('Male_normal.glb') // обычное телосложение
    // this.mNormal.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mNormal.position = new Vector3(-4, 0, 0)
    this.mNormal.scaling = new Vector3(0, 0, 0)

    this.mAthletic = await this.loadModel('Male_thin.glb') // накачанный
    // this.mAthletic.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mAthletic.position = new Vector3(-2, 0, 0)
    this.mAthletic.scaling = new Vector3(0, 0, 0)

    this.mCharacter = await this.loadModel('Male_normal.glb') // обычное телосложение
    // this.mCharacter.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mCharacter.position = new Vector3(0, 0, 0)

    //!Временно вместо тонкого взял качка, т.к. у тонкого не такое же количество вершин, что у других
    this.mSkinny = await this.loadModel('Male_Atlet.glb') // худой
    // this.mSkinny.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mSkinny.position = new Vector3(2, 0, 0)
    this.mSkinny.scaling = new Vector3(0, 0, 0)

    this.mFat = await this.loadModel('Male_fat.glb') // жирный
    // this.mFat.rotate(new Vector3(0, 1, 0), Math.PI, Space.LOCAL)
    this.mFat.position = new Vector3(4, 0, 0)
    this.mFat.scaling = new Vector3(0, 0, -0)

    this.mIsUpdatableVertecies = false
  }

  // подгрузить модель персонажа
  async loadModel(inFilename) {
    ShaderStore.ShadersStoreWGSL['customcubeVertexShader'] = `   
        #include<sceneUboDeclaration>
        #include<meshUboDeclaration>

        attribute position : vec3<f32>;
        attribute normal : vec3<f32>;
        attribute uv: vec2<f32>;
 
        varying vNormal : vec3<f32>;
        varying vUV : vec2<f32>;

        struct MyUBO {
            scale: f32,
        };

        var<uniform> myUBO: MyUBO;

        @vertex
        fn main(input : VertexInputs) -> FragmentInputs {
            vertexOutputs.position = scene.viewProjection * mesh.world * vec4<f32>(vertexInputs.position * vec3<f32>(myUBO.scale), 1.0);
            vertexOutputs.vNormal = vertexInputs.normal;
            vertexOutputs.vUV = vertexInputs.uv;
        }    
    `

    ShaderStore.ShadersStoreWGSL['customcubeFragmentShader'] = `
        uniform vColor : array<vec4<f32>, 2>;

        varying vNormal : vec3<f32>;
        varying vUV : vec2<f32>;

        var diffuse : texture_2d<f32>;
        var mySampler : sampler;

        @fragment
        fn main(input : FragmentInputs) -> FragmentOutputs {
            fragmentOutputs.color.r = fragmentInputs.vUV.x;
            fragmentOutputs.color.g = fragmentInputs.vUV.y;
            fragmentOutputs.color.b = 0.0f;
            fragmentOutputs.color.a = 1.0f;
           // fragmentOutputs.color = textureSample(diffuse, mySampler, fragmentInputs.vUV) * uniforms.vColor[1];
        }
    `

    const myUBO = new UniformBuffer(this.mEngine)

    myUBO.addUniform('scale', 1)
    myUBO.updateFloat('scale', 1.5)
    myUBO.update()

    const mainTexture = new Texture('assets/textures/crate.png', this.mScene)

    var shaderMaterial = new ShaderMaterial(
      'shader',
      this.mScene,
      {
        vertex: 'customcube',
        fragment: 'customcube',
      },
      {
        attributes: ['position', 'normal', 'uv'],
        uniformBuffers: ['Scene', 'Mesh'],
        shaderLanguage: ShaderLanguage.WGSL,
      },
    )

    shaderMaterial.setFloats('vColor', [1, 0, 0, 1, 0, 1, 0, 1])
    shaderMaterial.setUniformBuffer('myUBO', myUBO)
    shaderMaterial.setTexture('diffuse', mainTexture)

    const sampler = new TextureSampler()

    sampler.setParameters() // use the default values
    sampler.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE

    shaderMaterial.setTextureSampler('mySampler', sampler)

    // const res = await SceneLoader.ImportMeshAsync(
    //   '',
    //   'assets/models2/',
    //   inFilename,
    //   this.mScene,
    // )

    //Остановка анимации
    // res.animationGroups[0].stop()

    //Запуск анимации
    //  res.animationGroups[0].start()

    // const resMesh = res.meshes[0]

    return new Promise((resolve) => {
      mainTexture.onLoadObservable.addOnce(async () => {
        const res = await SceneLoader.ImportMeshAsync(
          '',
          'assets/models2/',
          inFilename,
          this.mScene,
        )

        const resMesh = res.meshes[0]
        res.meshes[0].material = shaderMaterial
        res.meshes[1].material = shaderMaterial
        res.meshes[2].material = shaderMaterial
        res.meshes[3].material = shaderMaterial
        res.meshes[4].material = shaderMaterial

        // resMesh.material = shaderMaterial
        // res.material = shaderMaterial
        // for (let mesh of ac.resMesh) mesh.material = shaderMaterial

        resolve(resMesh)
      })
    })
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
        // positionsN.length === len &&
        // positionsS.length === len &&
        // positionsF.length === len &&
        // positionsA.length === len
        true
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

  // ====поиск вершин модели по условию=====
  // изменение вершин внутри сферы
  computeCenterSphereCoord(sphere) {
    return sphere.position
  }

  //вычислить радиус центра сферы в локальных координатах
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

  //вычислить квадрат растояния между вершинами
  //Есть встроенная функция
  squareDistTwoVertex3D(a, b) {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
  }

  //получить индексы вершин модели внутри сферы
  getIndicesVertexesModelInSphere(sphere, model) {
    let indicesModelInSphere = []
    let squareDistanceToCenterSphere = null
    let modelPoint = null
    //!Без clone при срабатывании matrix.invert() модель исчезает
    const matrix = model.computeWorldMatrix(true).clone()
    const invertedMatrix = matrix.invert()
    const centerSphere = this.computeCenterSphereCoord(sphere)
    const squareLocalRadiusSphere =
      this.computeSphereRadiusInLocalCoordSystem(sphere, matrix) ** 2

    // Преобразование координат центра сферы в координаты относительно координат model
    const localCenterSphere = Vector3.TransformCoordinates(
      centerSphere,
      invertedMatrix,
    )

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
        indicesModelInSphere.push(j)
      }
    }
    return indicesModelInSphere
  }

  // функция, ищущая вершины inMesh по встроенному(пока) условию
  searchingVertexesMesh(sphere, inMesh = null, parentMesh) {
    const indicesModelInSphere = this.getIndicesVertexesModelInSphere(
      sphere,
      inMesh,
    )

    const childMesh = {
      name: inMesh.name,
      indices: indicesModelInSphere,
      children: [],
    }

    if (parentMesh.children == undefined) {
      parentMesh.push(childMesh)
    } else {
      parentMesh.children.push(childMesh)
    }

    let positions = inMesh.getVerticesData(VertexBuffer.PositionKind)

    const meshes = inMesh.getChildMeshes()

    for (let j = 0, len = meshes.length; j < len; j++) {
      this.searchingVertexesMesh(sphere, meshes[j], childMesh)
    }
  }

  // функция, начинающая поиск вершин модели по условию
  searchingVertexesModel(sphere, model) {
    let vertexArr = []

    const meshes = model.getChildMeshes()

    for (let i = 0; i < meshes.length; i++) {
      this.searchingVertexesMesh(sphere, meshes[i], vertexArr)
    }

    console.log('Выбранные вершина модели', vertexArr)
    return vertexArr
  }

  // изменение части модели по нужным вершинам
  changePartModelInSphere(sphere, model) {
    const vertexArr = this.searchingVertexesModel(sphere, model)
    console.log('vertexArr', vertexArr)
    const meshes = model.getChildMeshes()

    for (let i = 0; i < meshes.length; i++) {
      this.changePartMeshInSphere(meshes[i], vertexArr[i].indices)
    }
  }

  // изменение части меша модели по нужным вершинам
  changePartMeshInSphere(inMesh, meshIndicesVertexForChanging) {
    let positions = inMesh.getVerticesData(VertexBuffer.PositionKind)

    for (let j = 0, len = meshIndicesVertexForChanging.length; j < len; j++) {
      positions[meshIndicesVertexForChanging[j]] *= 1.01
      positions[meshIndicesVertexForChanging[j] + 1] *= 1.01
      positions[meshIndicesVertexForChanging[j] + 2] *= 1.01
    }

    if (this.mIsUpdatableVertecies)
      inMesh.updateVerticesData(
        VertexBuffer.PositionKind,
        positions,
        true,
        true,
      )
    else inMesh.setVerticesData(VertexBuffer.PositionKind, positions, true)

    const meshes = inMesh.getChildMeshes()

    for (let j = 0, len = meshes.length; j < len; j++) {
      this.changePartMeshInSphere(
        meshes[j],
        meshIndicesVertexForChanging.children[j].indices,
      )
    }
  }

  // вращение часть модели в сфере
  rotatePartModelInSphere(sphere, model) {
    const vertexArr = this.searchingVertexesModel(sphere, model)
    const meshes = model.getChildMeshes()

    for (let i = 0; i < meshes.length; i++) {
      this.rotatePartMeshInSphere(meshes[i], vertexArr[i].indices, sphere)
    }
  }

  // вращение части меша модели по нужным вершинам
  rotatePartMeshInSphere(inMesh, meshIndicesVertexForChanging, sphere) {
    let positions = inMesh.getVerticesData(VertexBuffer.PositionKind)
    let normalsMesh = inMesh.getVerticesData(VertexBuffer.NormalKind)
    let uvsMesh = inMesh.getVerticesData(VertexBuffer.UVKind)
    //!Без clone при срабатывании matrix.invert() модель исчезает
    // const matrix = inMesh.computeWorldMatrix(true).clone()

    // Определяем ось вращения и угол поворота
    let vertices = []
    let indices = []
    let normals = []
    let uvs = []

    for (let j = 0, len = meshIndicesVertexForChanging.length; j < len; j++) {
      vertices.push(
        positions[meshIndicesVertexForChanging[j]],
        positions[meshIndicesVertexForChanging[j + 1]],
        positions[meshIndicesVertexForChanging[j + 2]],
      )
      const point = new Vector3(
        positions[meshIndicesVertexForChanging[j]],
        positions[meshIndicesVertexForChanging[j + 1]],
        positions[meshIndicesVertexForChanging[j + 2]],
      )

      console.log('point', point.x)
      console.log('positions', positions[meshIndicesVertexForChanging[0]])

      point.x = 1
      console.log('point', point.x)
      console.log('positions', positions[meshIndicesVertexForChanging[0]])

      break

      // normals.push(
      //   normalsMesh[meshIndicesVertexForChanging[j]],
      //   normalsMesh[meshIndicesVertexForChanging[j + 1]],
      //   normalsMesh[meshIndicesVertexForChanging[j + 2]],
      // )
      // uvs.push(
      //   uvsMesh[meshIndicesVertexForChanging[j]],
      //   uvsMesh[meshIndicesVertexForChanging[j + 1]],
      //   uvsMesh[meshIndicesVertexForChanging[j + 2]],
      // )

      // let inMeshVertex = new Vector3(
      //   positions[j],
      //   positions[j + 1],
      //   positions[j + 2],
      // )
      // // const localVertexPosition = Vector3.TransformCoordinates(
      // //   inMeshVertex,
      // //   matrix,
      // // )

      // let rotationQuaternion = Quaternion.RotationAxis(
      //   rotationAxis,
      //   rotationAngle,
      // ) // Создаем кватернион поворота

      // inMeshVertex.rotateByQuaternionToRef(rotationQuaternion, inMeshVertex) // Применяем поворот к точке

      // positions[j] = inMeshVertex.x
      // positions[j + 1] = inMeshVertex.y
      // positions[j + 2] = inMeshVertex.z
    }

    // Создание массива индексов вершин
    // for (let i = 0, len = vertices.length / 3; i < len; i++) {
    //   indices.push(i)
    // }

    // // Создание меша
    // let newMesh = new Mesh('customMesh', this.mScene)

    // newMesh.setVerticesData(VertexBuffer.PositionKind, vertices, false)
    // newMesh.setVerticesData(VertexBuffer.NormalKind, normals, false)
    // newMesh.setVerticesData(VertexBuffer.UVKind, uvs, false)
    // newMesh.setIndices(indices)

    // // sphere.addChild(newMesh)
    // let gizmoManager = new GizmoManager(this.mScene)
    // gizmoManager.boundingBoxGizmoEnabled = true
    // gizmoManager.attachableMeshes = [newMesh]

    // console.log('newMesh', newMesh)

    //!
    inMesh.updateVerticesData(
      VertexBuffer.PositionKind,
      inMesh.getVerticesData(VertexBuffer.PositionKind),
      false,
      false,
    )

    if (this.mIsUpdatableVertecies)
      inMesh.updateVerticesData(
        VertexBuffer.PositionKind,
        positions,
        true,
        true,
      )
    else inMesh.setVerticesData(VertexBuffer.PositionKind, positions, true)

    const meshes = inMesh.getChildMeshes()

    for (let j = 0, len = meshes.length; j < len; j++) {
      this.rotatePartMeshInSphere(
        meshes[j],
        meshIndicesVertexForChanging.children[j].indices,
      )
    }
  }
}
