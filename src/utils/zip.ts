import JSZip from 'jszip'

// Download files in parallel with a concurrency limit
async function parallelMap<T, R>(items: T[], limit: number, fn: (item: T, idx: number) => Promise<R>, onProgress?: (done: number, total: number) => void): Promise<R[]> {
  const results: R[] = []
  let idx = 0
  let done = 0
  async function next() {
    if (idx >= items.length) return
    const current = idx++
    try {
      results[current] = await fn(items[current], current)
    } finally {
      done++
      if (onProgress) onProgress(done, items.length)
      await next()
    }
  }
  const workers = Array(Math.min(limit, items.length)).fill(0).map(next)
  await Promise.all(workers)
  return results
}

export async function generateZip(
  files: Array<{ path: string, download_url: string }>,
  onProgress?: (done: number, total: number) => void
): Promise<{ zipBlob: Blob, totalSize: number }> {
  const zip = new JSZip()
  let totalSize = 0
  await parallelMap(
    files,
    6, // concurrency limit
    async (file) => {
      const res = await fetch(file.download_url)
      if (!res.ok) throw new Error(`Failed to fetch file: ${file.path}`)
      const blob = await res.blob()
      totalSize += blob.size
      zip.file(file.path, blob)
    },
    onProgress
  )
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  return { zipBlob, totalSize }
} 