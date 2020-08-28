import { mat4 } from 'gl-matrix'
// shader program
// import vsSource from './model.vert'
// import fsSource from './texture.frag'

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

/**
 * Object
 */
const cube = [
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
const positions = new Float32Array(cube.flat(Infinity))
// Multiple Render Test
const positions2 = new Float32Array(
  cube.map(c => [c[0] - 2, c[1] - 2, c[2] - 2]).flat(Infinity)
)

// Now set up the colors for the vertices
const colors = new Float32Array(
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

// This array defines each face as two triangles, using the
// indices into the vertex array to specify each triangle's
// position.
const indices = new Uint16Array(
  [
    // front
    [0, 1, 2],
    [0, 2, 3],
    // back
    [4, 5, 6],
    [4, 6, 7],
    // top
    [8, 9, 10],
    [8, 10, 11],
    // bottom
    [12, 13, 14],
    [12, 14, 15],
    // right
    [16, 17, 18],
    [16, 18, 19],
    // left
    [20, 21, 22],
    [20, 22, 23]
  ].flat(Infinity)
)
/**
 * PARAMETER
 */
let cubeRotation = 20

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

  const cube: ModelObject = {
    model: createVBO(gl, positions),
    // position2: createVBO(gl, positions2),
    texture: createVBO(gl, colors),
    draw: {
      buffer: createIBO(gl, indices),
      count: indices.length
    }
  }

  const cube2: ModelObject = {
    model: createVBO(gl, positions2),
    // position2: createVBO(gl, positions2),
    texture: createVBO(gl, colors),
    draw: {
      buffer: createIBO(gl, indices),
      count: indices.length
    }
  }

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
