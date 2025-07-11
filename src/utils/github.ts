// Validate if the input is a valid GitHub folder URL (flexible)
export function isValidGithubUrl(url: string): boolean {
  url = url.trim().replace(/^@/, '')
  // Accept both /tree/ and /main/ or /master/ or /branch/ style
  return /github\.com\/.+\/.+\/(tree\/[^\/]+\/.+|[^\/]+\/.+)/.test(url)
}

// Convert GitHub folder URL to API endpoint (flexible)
export function githubUrlToApi(url: string): { apiUrl: string, repoRoot: string } | null {
  url = url.trim().replace(/^@/, '')
  // Try to match /tree/{branch}/{folder}
  let match = url.match(/github\.com\/(.+?)\/(.+?)\/tree\/([^\/]+)\/(.+)/)
  if (match) {
    const [, user, repo, branch, folder] = match
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${folder}?ref=${branch}`
    const repoRoot = `${user}/${repo}/${branch}`
    return { apiUrl, repoRoot }
  }
  // Try to match /{branch}/{folder} (no /tree/)
  match = url.match(/github\.com\/(.+?)\/(.+?)\/([^\/]+)\/(.+)/)
  if (match) {
    const [, user, repo, branch, folder] = match
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${folder}?ref=${branch}`
    const repoRoot = `${user}/${repo}/${branch}`
    return { apiUrl, repoRoot }
  }
  return null
}

// Recursively fetch all files in a folder from the GitHub API
export async function fetchGithubFolder(apiUrl: string, pathPrefix = ''): Promise<Array<{ path: string, download_url: string, size: number }>> {
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error('Failed to fetch from GitHub API')
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error('Not a directory')
  let files: Array<{ path: string, download_url: string, size: number }> = []
  for (const item of data) {
    if (item.type === 'file' && item.download_url) {
      files.push({ path: pathPrefix + item.name, download_url: item.download_url, size: item.size })
    } else if (item.type === 'dir') {
      const subFiles = await fetchGithubFolder(item.url, pathPrefix + item.name + '/')
      files = files.concat(subFiles)
    }
  }
  return files
}

// Detect if the input is a GitHub file URL (with /blob/)
export function isGithubFileUrl(url: string): boolean {
  url = url.trim().replace(/^@/, '')
  return /github\.com\/.+\/.+\/blob\//.test(url)
}

// Convert GitHub file URL to API endpoint and file info
export function githubFileUrlToApi(url: string): { apiUrl: string, fileName: string, repoRoot: string } | null {
  url = url.trim().replace(/^@/, '')
  // Match /blob/{branch}/{path/to/file}
  const match = url.match(/github\.com\/(.+?)\/(.+?)\/blob\/([^\/]+)\/(.+)/)
  if (match) {
    const [, user, repo, branch, filePath] = match
    const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/${filePath}?ref=${branch}`
    const fileName = filePath.split('/').pop() || 'downloaded-file'
    const repoRoot = `${user}/${repo}/${branch}`
    return { apiUrl, fileName, repoRoot }
  }
  return null
}

// Fetch a single file's metadata from the GitHub API
export async function fetchGithubFile(apiUrl: string): Promise<{ path: string, download_url: string, size: number }> {
  const res = await fetch(apiUrl)
  if (!res.ok) throw new Error('Failed to fetch file from GitHub API')
  const data = await res.json()
  if (data.type !== 'file' || !data.download_url) throw new Error('Not a file or missing download_url')
  return { path: data.name, download_url: data.download_url, size: data.size }
} 