export const createRandomColors = (len: number) => {
  const genRandColor = () => [Math.random(), Math.random(), Math.random(), 1.0]
  const result = []
  for (let step = 0; step < len; step += 1) {
    const col = genRandColor()
    result.push(...col)
  }
  return new Float32Array(result)
}
