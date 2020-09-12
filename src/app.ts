import { mat4 } from 'gl-matrix'
// shader program
// import vsSource from './model.vert'
// import fsSource from './texture.frag'

import { createRandomColors } from './colors'
import { createIndices } from './indices'
// @ts-ignore
import parseSTL from './loader.js'

// @ts-ignore
// import stlModel from 'raw-loader!./stl/eiffel.stl' // eslint-disable-line
import stlModel from 'raw-loader!./stl/cube.stl' // eslint-disable-line

interface ProgramInfo {
  program: WebGLProgram
  attribLocations: {
    [key: string]: number
  }
  uniformLocations: {
    [key: string]: WebGLUniformLocation | null
  }
}

interface ModelObject {
  model: WebGLBuffer | null
  texture: WebGLBuffer | null
  draw: {
    buffer: WebGLBuffer | null
    count: number
  }
}

const createModelObject = (
  gl: WebGLRenderingContext,
  pos: Float32Array,
  cols?: Float32Array
): ModelObject => {
  console.log(pos, cols)

  const createVBO = (
    gl: WebGLRenderingContext,
    data: Float32Array
  ): WebGLBuffer | null => {
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return buf
  }

  const createIBO = (
    gl: WebGLRenderingContext,
    data: Uint16Array
  ): WebGLBuffer | null => {
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
    return buf
  }
  const indices = createIndices(pos.length)
  const colors = cols || createRandomColors(indices[indices.length - 1] + 1)
  console.log(pos, indices, cols)
  return {
    model: createVBO(gl, pos),
    // position2: createVBO(gl, positions2),
    texture: createVBO(gl, colors),
    draw: {
      buffer: createIBO(gl, indices),
      count: indices.length
    }
  }
}

/**
 * Object
 */
const EXAMPLE_CUBE = [
  // Front face
  [-1.0, -1.0, 1.0],
  [1.0, -1.0, 1.0],
  [1.0, 1.0, 1.0],
  [-1.0, 1.0, 1.0],
  // Back face
  [-1.0, -1.0, -1.0],
  [-1.0, 1.0, -1.0],
  [1.0, 1.0, -1.0],
  [1.0, -1.0, -1.0],
  // Top face
  [-1.0, 1.0, -1.0],
  [-1.0, 1.0, 1.0],
  [1.0, 1.0, 1.0],
  [1.0, 1.0, -1.0],
  // Bottom face
  [-1.0, -1.0, -1.0],
  [1.0, -1.0, -1.0],
  [1.0, -1.0, 1.0],
  [-1.0, -1.0, 1.0],
  // Right face
  [1.0, -1.0, -1.0],
  [1.0, 1.0, -1.0],
  [1.0, 1.0, 1.0],
  [1.0, -1.0, 1.0],
  // Left face
  [-1.0, -1.0, -1.0],
  [-1.0, -1.0, 1.0],
  [-1.0, 1.0, 1.0],
  [-1.0, 1.0, -1.0]
]

/**
 * PARAMETER
 */
let cubeRotation = 0

function main() {
  const canvas = document.getElementById('app') as HTMLCanvasElement
  const gl = canvas.getContext('webgl2')
  if (!gl) {
    console.error(
      '[ERROR] Unable to initialize WebGL. Your browser or machine may not support it.'
    )
    return
  }
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `
  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
  if (!shaderProgram) {
    console.error('[ERROR] initShaderProgram')
    return
  }

  const programInfo: ProgramInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        'uProjectionMatrix'
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
    }
  }

  const cube: ModelObject = createModelObject(
    gl,
    new Float32Array(EXAMPLE_CUBE.flat(Infinity)),
    new Float32Array(
      [
        [1.0, 1.0, 1.0, 1.0], // Front face: white
        [1.0, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 1.0, 0.0, 1.0], // Top face: green
        [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // Right face: yellow
        [1.0, 0.0, 1.0, 1.0] // Left face: purple
      ]
        .map(c => [c, c, c, c])
        .flat(Infinity)
    )
  )

  const formatNum = (p: number): number => (p >> 32) / 20 - 2
  // const formatNum = (p: number): number => p

  const cube2: ModelObject = createModelObject(
    gl,
    // new Float32Array(
    //   EXAMPLE_CUBE.map(c => [c[0] - 2, c[1] - 2, c[2] - 2]).flat(Infinity)
    // )
    new Float32Array(parseSTL(stlModel).vertices.map(formatNum))
  )

  // Static Render
  // drawScene(gl, programInfo, buffers, 0)

  // Animation
  let then = 0
  const render = (now: number) => {
    now *= 0.001 // convert to seconds
    const deltaTime = now - then
    then = now

    cubeRotation += deltaTime
    drawScene(gl, programInfo, [cube, cube2])

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}
//
// Draw the scene.
//
function drawScene(
  gl: WebGLRenderingContext,
  programInfo: ProgramInfo,
  objs: ModelObject[]
) {
  // Setup Context
  gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
  gl.clearDepth(1.0) // Clear everything
  gl.enable(gl.DEPTH_TEST) // Enable depth testing
  gl.depthFunc(gl.LEQUAL) // Near things obscure far things
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.useProgram(programInfo.program)

  // View Matrix
  const fieldOfView = (45 * Math.PI) / 180 // in radians
  const aspect =
    gl.canvas instanceof HTMLCanvasElement
      ? gl.canvas.clientWidth / gl.canvas.clientHeight
      : 1
  const zNear = 0.1
  const zFar = 100.0
  const projectionMatrix = mat4.create()
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  )

  // Model Render
  const drawObject = (
    { model, texture, draw }: ModelObject,
    update?: (m: mat4) => void
  ) => {
    const mvMx = mat4.create()
    if (update) {
      update(mvMx)
    }

    // Object
    gl.bindBuffer(gl.ARRAY_BUFFER, model)
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      3,
      gl.FLOAT,
      false,
      0,
      0
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

    // color
    gl.bindBuffer(gl.ARRAY_BUFFER, texture)
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      4,
      gl.FLOAT,
      false,
      0,
      0
    )
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor)

    // Index
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, draw.buffer)
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      mvMx
    )
    gl.drawElements(gl.TRIANGLES, draw.count, gl.UNSIGNED_SHORT, 0)
  }

  objs.map(obj =>
    drawObject(obj, m => {
      mat4.translate(m, m, [0, 0, -6])
      mat4.rotate(m, m, cubeRotation, [0, 0, 1])
      mat4.rotate(m, m, cubeRotation * 0.7, [0, 1, 0])
    })
  )
}

function initShaderProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram | null {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

  if (!vertexShader || !fragmentShader) {
    console.error('[ERROR] loadShader error.')
    return null
  }
  const shaderProgram = gl.createProgram()
  if (!shaderProgram) {
    console.error('[ERROR] Unable to gl.crateProgram() ')
    return null
  }
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      '[ERROR] Unable to initialize the shader program: ' +
        gl.getProgramInfoLog(shaderProgram)
    )
    return null
  }

  return shaderProgram
}

function loadShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) {
    console.error('[ERROR] invalid Shader type number.')
    return null
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[ERROR] compileinfo: ' + gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

main()
