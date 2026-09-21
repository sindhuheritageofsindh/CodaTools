function cornerPalette(data, width, height) {
  const points = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]]
  return points.map(([x, y]) => {
    const i = (y * width + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
  })
}

function distance(data, index, palette) {
  let best = Infinity
  for (const color of palette) {
    const dr = data[index] - color[0]
    const dg = data[index + 1] - color[1]
    const db = data[index + 2] - color[2]
    best = Math.min(best, Math.sqrt(dr * dr + dg * dg + db * db))
  }
  return best
}

export function removeConnectedBackground(imageData, width, height, tolerance = 48, feather = 8) {
  const data = imageData.data
  const total = width * height
  const seen = new Uint8Array(total)
  const queue = new Uint32Array(total)
  let head = 0
  let tail = 0
  const palette = cornerPalette(data, width, height)
  const threshold = Math.max(4, tolerance)
  const softStart = Math.max(0, threshold - feather)

  const enqueue = (p) => {
    if (seen[p]) return
    const i = p * 4
    if (data[i + 3] === 0 || distance(data, i, palette) <= threshold) {
      seen[p] = 1
      queue[tail++] = p
    }
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x)
    if (height > 1) enqueue((height - 1) * width + x)
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width)
    if (width > 1) enqueue(y * width + width - 1)
  }

  while (head < tail) {
    const p = queue[head++]
    const x = p % width
    const y = Math.floor(p / width)
    const i = p * 4
    const dist = distance(data, i, palette)
    if (dist <= softStart) data[i + 3] = 0
    else if (dist <= threshold) {
      const ratio = (dist - softStart) / Math.max(1, threshold - softStart)
      data[i + 3] = Math.min(data[i + 3], Math.round(255 * ratio))
    }
    if (x > 0) enqueue(p - 1)
    if (x < width - 1) enqueue(p + 1)
    if (y > 0) enqueue(p - width)
    if (y < height - 1) enqueue(p + width)
  }
  return imageData
}
