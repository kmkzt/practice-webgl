export const createIndices = (len: number): Uint16Array => {
  const result: number[] = []
  // TODO: validate array
  // const check = len ％ 3;
  // if (check !== 0) {
  //   console.log('ERROR')
  //   return []
  // }

  for (let i = 0; i < len / 6; i += 1) {
    if (i % 2 === 0) {
      const c = Math.floor(i / 2) * 4
      result.push(c, c + 1, c + 2)
    } else {
      const c = Math.floor((i - 1) / 2) * 4
      result.push(c, c + 2, c + 3)
    }
  }
  return new Uint16Array(result)
}
