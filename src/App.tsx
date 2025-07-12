import { useState, useEffect } from 'react'
import { isValidGithubUrl, githubUrlToApi, fetchGithubFolder, isGithubFileUrl, githubFileUrlToApi, fetchGithubFile } from './utils/github'
import { generateZip } from './utils/zip'
import { saveAs } from 'file-saver'

// Progress steps
const steps = [
  { key: 'fetching', label: 'Retrieving data...' },
  { key: 'zipping', label: 'Zipping the data...' },
  { key: 'downloading', label: 'Downloading ZIP...' },
  { key: 'done', label: 'Download complete!' },
]
const fileSteps = [
  { key: 'fetching', label: 'Retrieving data...' },
  { key: 'downloading', label: 'Downloading file...' },
  { key: 'done', label: 'Download complete!' },
]

type Progress = 'idle' | 'fetching' | 'zipping' | 'downloading' | 'done'

type FileInfo = { path: string, download_url: string, size: number }

type Summary = {
  fileCount: number
  totalSize: number
  fileTypes: Record<string, number>
  files: FileInfo[]
  zipName: string
  downloadTime: number
}

// Accent color options
const ACCENT_COLORS = [
  { name: 'Blue', value: 'blue', classes: { base: 'blue-700', hover: 'blue-600', active: 'blue-800', light: 'blue-200', bg: 'blue-900', border: 'blue-700', text: 'blue-100', faded: 'blue-300' } },
  { name: 'Green', value: 'green', classes: { base: 'green-700', hover: 'green-600', active: 'green-800', light: 'green-200', bg: 'green-900', border: 'green-700', text: 'green-100', faded: 'green-300' } },
  { name: 'Purple', value: 'purple', classes: { base: 'purple-700', hover: 'purple-600', active: 'purple-800', light: 'purple-200', bg: 'purple-900', border: 'purple-700', text: 'purple-100', faded: 'purple-300' } },
]

function getAccentClasses(accent: string) {
  return ACCENT_COLORS.find(c => c.value === accent)?.classes || ACCENT_COLORS[0].classes
}

function App() {
  const [url, setUrl] = useState('')
  const [progress, setProgress] = useState<Progress>('idle')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zipProgress, setZipProgress] = useState<{ done: number, total: number } | null>(null)
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [accent, setAccent] = useState(() => localStorage.getItem('accentColor') || 'blue')
  const [urlInputFocused, setUrlInputFocused] = useState(false)
  useEffect(() => { localStorage.setItem('accentColor', accent) }, [accent])
  const accentClasses = getAccentClasses(accent)

  const handleDownload = async () => {
    setError(null)
    setSummary(null)
    setZipProgress(null)
    setShowAllFiles(false)
    // Handle single file URL
    if (isGithubFileUrl(url)) {
      const fileApiInfo = githubFileUrlToApi(url)
      if (!fileApiInfo) {
        setError('Could not parse GitHub file URL. Please check the format.')
        return
      }
      setProgress('fetching')
      let file, startTime = Date.now()
      try {
        file = await fetchGithubFile(fileApiInfo.apiUrl)
      } catch (e: any) {
        setError('GitHub API error: ' + (e.message || 'Failed to fetch file. Check if the file is public and the URL is correct.'))
        setProgress('idle')
        return
      }
      setProgress('downloading')
      try {
        const res = await fetch(file.download_url)
        if (!res.ok) throw new Error('Failed to download file.')
        const blob = await res.blob()
        saveAs(blob, file.path)
        const downloadTime = (Date.now() - startTime) / 1000
        setProgress('done')
        setSummary({
          fileCount: 1,
          totalSize: file.size,
          fileTypes: { [file.path.split('.').pop()?.toLowerCase() || 'unknown']: 1 },
          files: [file],
          zipName: file.path,
          downloadTime
        })
      } catch (e: any) {
        setError('Download error: Failed to trigger file download.')
        setProgress('idle')
        return
      }
      return
    }
    if (!isValidGithubUrl(url)) {
      setError('Please enter a valid GitHub folder URL.\nExample: https://github.com/user/repo/tree/main/folder')
      return
    }
    const apiInfo = githubUrlToApi(url)
    if (!apiInfo) {
      setError('Could not parse GitHub URL. Please check the format.')
      return
    }
    setProgress('fetching')
    let files: FileInfo[]
    let startTime = Date.now()
    try {
      files = await fetchGithubFolder(apiInfo.apiUrl)
      if (!files.length) throw new Error('No files found in this folder.')
    } catch (e: any) {
      setError('GitHub API error: ' + (e.message || 'Failed to fetch files. Check if the folder is public and the URL is correct.'))
      setProgress('idle')
      return
    }
    setProgress('zipping')
    setZipProgress({ done: 0, total: files.length })
    let zipBlob, totalSize
    try {
      const zipResult = await generateZip(files, (done, total) => setZipProgress({ done, total }))
      zipBlob = zipResult.zipBlob
      totalSize = zipResult.totalSize
    } catch (e: any) {
      setError('ZIP error: ' + (e.message || 'Failed to zip files.'))
      setProgress('idle')
      setZipProgress(null)
      return
    }
    setZipProgress(null)
    setProgress('downloading')
    const zipName = `${apiInfo.repoRoot.replace(/\//g, '-')}.zip`
    try {
      saveAs(zipBlob, zipName)
    } catch (e: any) {
      setError('Download error: Failed to trigger download.')
      setProgress('idle')
      return
    }
    setProgress('done')
    // File type breakdown
    const fileTypes: Record<string, number> = {}
    for (const f of files) {
      const ext = f.path.split('.').pop()?.toLowerCase() || 'unknown'
      fileTypes[ext] = (fileTypes[ext] || 0) + 1
    }
    const downloadTime = (Date.now() - startTime) / 1000
    setSummary({
      fileCount: files.length,
      totalSize,
      fileTypes,
      files,
      zipName,
      downloadTime
    })
  }

  // Reset everything
  const handleReset = () => {
    setProgress('idle')
    setSummary(null)
    setError(null)
    setUrl('')
    setZipProgress(null)
    setShowAllFiles(false)
  }

  // Clear error on input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (error) setError(null)
  }

  return (
    <>
      <div className={`min-h-screen w-full bg-gradient-to-b from-${accent}-950 via-${accent}-900 to-${accent}-700 flex flex-row`}>
        {/* Navbar at the very top */}
        <div className={`fixed top-0 left-0 w-full z-10 ${urlInputFocused ? 'sm:block hidden' : ''}`}>
          <nav className="w-full bg-white/10 backdrop-blur border-b border-white/20 py-6 px-4 flex items-center justify-center shadow-lg relative">
            <span className="text-white text-sm md:text-base font-sans font-semibold tracking-wide text-center">
              No content is hosted on this website. This is a tool to download files from a user-provided GitHub repository URL.
            </span>
          </nav>
        </div>
        {/* Main content shifted towards the top */}
        <div className="flex-1 flex flex-col items-center mt-40">
          <div className="w-full max-w-xl flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-cursive font-normal text-white mb-10 text-center tracking-tight drop-shadow-lg animate-fadeinup whitespace-nowrap" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Get <span className="mx-2 align-middle text-3xl">&middot;</span> GitHub <span className="mx-2 align-middle text-3xl">&middot;</span> Directory
            </h1>
            {/* Theme selector */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-white/80 text-sm">Theme:</span>
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.value}
                  aria-label={c.name}
                  className={`w-8 h-8 rounded-full border-2 ${accent === c.value ? 'border-white scale-110 ring-2 ring-white' : 'border-white/40'} transition-all hover:scale-105`}
                  style={{ backgroundColor: `var(--tw-${c.classes.base.replace('-', '-')})` }}
                  onClick={() => setAccent(c.value)}
                >
                  <span className="sr-only">{c.name}</span>
                </button>
              ))}
            </div>
            <div className="w-full flex flex-col sm:flex-row items-center gap-2 mb-8">
              <input
                type="text"
                className="flex-1 w-full max-w-2xl px-6 py-4 rounded-lg border-2 border-white/70 bg-white/10 text-white text-xl text-center placeholder:text-white/60 placeholder:text-center placeholder:truncate placeholder:text-base sm:placeholder:text-lg md:placeholder:text-xl focus:outline-none focus:ring-2 focus:ring-white/80 shadow-lg transition-all"
                placeholder="Paste GitHub.com folder or file URL + press Enter"
                value={url}
                onChange={handleInputChange}
                onKeyDown={e => { if (e.key === 'Enter') handleDownload() }}
                disabled={progress !== 'idle'}
                onFocus={() => setUrlInputFocused(true)}
                onBlur={() => setUrlInputFocused(false)}
              />
              <button
                onClick={handleDownload}
                disabled={progress !== 'idle'}
                className={`self-center sm:self-auto px-5 py-3 rounded-lg font-semibold text-white bg-${accent}-700 hover:bg-${accent}-600 active:bg-${accent}-800 border-2 border-white/30 shadow-lg transition-all text-lg ${progress !== 'idle' ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                Download
              </button>
            </div>
            <a href="#" className={`text-white underline text-lg hover:text-${accent}-200 transition-colors mb-8`} onClick={e => { e.preventDefault(); setShowInfo(true); }}>info + token</a>

            {/* Error UI */}
            {error && (
              <div className="w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto bg-red-500/90 text-white text-center rounded-lg py-3 px-4 mb-4 animate-pulse text-base break-words whitespace-pre-line max-w-full">
                {error.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                <button onClick={handleReset} className="mt-2 px-4 py-1 bg-white/20 text-white rounded hover:bg-white/30 transition">Reset</button>
              </div>
            )}

            {/* Progress UI (mobile only) */}
            {progress !== 'idle' && !error && progress !== 'done' && (
              <div className="block lg:hidden w-full flex flex-col items-center mt-4">
                {(isGithubFileUrl(url) ? fileSteps : steps).map((step, idx) => (
                  <div key={step.key} className={`flex items-center gap-2 mb-2 ${progress === step.key ? 'font-bold text-white' : 'text-white/60'}`}> 
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: progress === step.key ? accentClasses.base === 'blue-700' ? '#60a5fa' : accentClasses.base === 'green-700' ? '#16a34a' : '#9333ea' : '#374151' }}></span>
                    {step.label}
                    {/* Show progress bar for zipping */}
                    {step.key === 'zipping' && progress === 'zipping' && zipProgress && (
                      <span className={`ml-4 w-40 h-2 bg-${accent}-900/40 rounded overflow-hidden inline-block align-middle`}>
                        <span
                          className={`block h-2 bg-${accent}-400 transition-all`}
                          style={{ width: `${(zipProgress.done / zipProgress.total) * 100}%` }}
                        ></span>
                      </span>
                    )}
                    {step.key === 'zipping' && progress === 'zipping' && zipProgress && (
                      <span className="ml-2 text-xs text-white/80">{zipProgress.done}/{zipProgress.total}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Downloaded file info summary sidebar (desktop) */}
        {progress === 'done' && summary && (
          <div className={`hidden lg:block fixed right-0 top-28 w-[350px] max-h-[80vh] overflow-y-auto bg-${accent}-900/90 text-white rounded-l-xl px-12 py-6 shadow-2xl z-20`}>
            <div className="font-semibold text-lg mb-1">Download Summary</div>
            <div className="mb-1">ZIP file: <span className={`font-mono text-${accent}-200`}>{summary.zipName}</span></div>
            <div>Files: <span className="font-bold">{summary.fileCount}</span></div>
            <div>Total size: <span className="font-bold">{(summary.totalSize / 1024 / 1024).toFixed(2)} MB</span></div>
            <div className="mb-1">Types: {Object.entries(summary.fileTypes).map(([ext, count]) => (
              <span key={ext} className={`inline-block mr-2 text-${accent}-200`}>{count} × .{ext}</span>
            ))}</div>
            <div className="mb-2 text-left">
              <span className="font-semibold">Files:</span>
              <ul className="ml-4 mt-1 text-sm max-h-40 overflow-y-auto">
                {(summary.files.length > 5 && !showAllFiles ? summary.files.slice(0, 5) : summary.files).map((f, i) => (
                  <li key={f.path} className="truncate">{f.path} <span className={`text-xs text-${accent}-300`}>({(f.size/1024).toFixed(1)} KB)</span></li>
                ))}
                {summary.files.length > 5 && !showAllFiles && (
                  <li className={`text-${accent}-300 cursor-pointer hover:underline`} onClick={() => setShowAllFiles(true)}>
                    ...and {summary.files.length - 5} more (Show all)
                  </li>
                )}
                {summary.files.length > 5 && showAllFiles && (
                  <li className={`text-${accent}-300 cursor-pointer hover:underline`} onClick={() => setShowAllFiles(false)}>
                    Show less
                  </li>
                )}
              </ul>
            </div>
            <div className="mb-2">Download time: <span className="font-bold">{summary.downloadTime.toFixed(2)} seconds</span></div>
            <button onClick={handleReset} className="mt-2 px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition">Download Another</button>
          </div>
        )}
        {/* Mobile summary card: only show basic info after download */}
        {progress === 'done' && summary && (
          <div className={`block lg:hidden fixed bottom-0 left-0 w-full bg-${accent}-900/95 text-white px-6 py-5 shadow-2xl z-30 rounded-t-xl pb-24`}>
            <div className="font-semibold text-lg mb-1">Download Summary</div>
            <div className={`mb-1`}>ZIP file: <span className={`font-mono text-${accent}-200`}>{summary.zipName}</span></div>
            <div>Files: <span className="font-bold">{summary.fileCount}</span></div>
            <div>Total size: <span className="font-bold">{(summary.totalSize / 1024 / 1024).toFixed(2)} MB</span></div>
            <button onClick={handleReset} className="mt-4 w-full px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition font-semibold">Download Another</button>
          </div>
        )}
      </div>
      {/* Animated Info Panel (desktop only) */}
      <div className={`hidden lg:block fixed left-0 top-28 h-[80vh] w-[370px] z-30 transition-transform duration-500 ease-in-out ${showInfo ? 'translate-x-0' : '-translate-x-[110%]'} bg-${accent}-900/95 text-white rounded-r-xl px-7 py-5 shadow-2xl`}
        style={{ willChange: 'transform' }}
      >
        <button onClick={() => setShowInfo(false)} className={`absolute top-3 right-4 text-${accent}-200 hover:text-white text-xl font-bold focus:outline-none`}>&times;</button>
        <div className="font-bold text-lg mb-3">About & Usage</div>
        <div className="mb-3 text-base">
          <p className="mb-2">This tool lets you download any public GitHub directory as a ZIP file or a single file, directly in your browser. No backend, no data stored.</p>
          <ul className="list-disc ml-6 text-white/90">
            <li>Paste a GitHub folder or file URL</li>
            <li>Click Enter or the download button.</li>
            <li>Progress is shown step-by-step.</li>
            <li>After zipping, the download starts automatically.</li>
            <li>Summary appears on the right</li>
          </ul>
        </div>
        <div className="text-sm text-white/70 mb-4">No data is sent to any server. All processing is done in your browser.</div>
        <div className="mb-3 text-base">
          <div className="font-semibold mb-1">GitHub Token (optional):</div>
          <p className="mb-2">For large folders or private repos, you may need a GitHub personal access token. Paste it in the input as <span className="font-mono">https://TOKEN@github.com/...</span></p>
          <hr className={`border-${accent}-700 my-2`} />
          <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className={`underline text-${accent}-300 hover:text-${accent}-100 block text-sm`}>Get a token here</a>
        </div>
      </div>
      {/* Mobile Info Overlay */}
      {showInfo && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gradient-to-b from-blue-900 via-green-900 to-purple-900 flex items-center justify-center min-h-screen">
          <div className={`relative w-full max-w-md mx-auto bg-${accent}-900/95 text-white rounded-2xl px-6 py-6 shadow-2xl overflow-y-auto max-h-[90vh]`}>
            <button onClick={() => setShowInfo(false)} className={`absolute top-3 right-4 text-${accent}-200 hover:text-white text-2xl font-bold focus:outline-none`}>&times;</button>
            <div className="font-bold text-lg mb-3 text-center text-white">About & Usage</div>
            <div className="mb-3 text-base text-white">
              <p className="mb-2">This tool lets you download any public GitHub directory as a ZIP file, directly in your browser. No backend, no data stored.</p>
              <ul className="list-disc ml-6 text-white/90">
                <li>Paste a GitHub folder URL</li>
                <li>Click Enter or the download button.</li>
                <li>Progress is shown step-by-step.</li>
                <li>After zipping, the download starts automatically.</li>
                <li>Summary appears on the right (desktop) or bottom (mobile).</li>
              </ul>
            </div>
            <div className="text-sm text-white/70 mb-4">No data is sent to any server. All processing is done in your browser.</div>
            <div className="mb-3 text-base text-white">
              <div className="font-semibold mb-1">GitHub Token (optional):</div>
              <p className="mb-2">For large folders or private repos, you may need a GitHub personal access token. Paste it in the input as <span className="font-mono">https://TOKEN@github.com/...</span></p>
              <hr className={`border-${accent}-700 my-2`} />
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className={`underline text-${accent}-300 hover:text-${accent}-100 block text-sm`}>Get a token here</a>
            </div>
          </div>
        </div>
      )}
      {/* Footer with developer info and social links */}
      <footer className={`w-full fixed bottom-0 left-0 z-10 bg-${accent}-950/90 text-white flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 py-3 px-4 text-sm shadow-inner`}>
        <span>
          Developed by <span className="font-semibold">Himanchal Kaushale</span>
        </span>
        <span className="flex gap-3">
          <a href="https://www.linkedin.com/in/himanchal-kaushale" target="_blank" rel="noopener noreferrer" className={`hover:text-${accent}-300 transition-colors flex items-center gap-1`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.967v5.7h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.04 0 3.601 2.002 3.601 4.604v5.592z"/></svg>
            LinkedIn
          </a>
          <a href="https://github.com/himanchalkaushale" target="_blank" rel="noopener noreferrer" className={`hover:text-${accent}-300 transition-colors flex items-center gap-1`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 0c-6.627 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.045.138 3.003.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.371.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .321.218.694.825.576 4.765-1.588 8.199-6.084 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
        </span>
      </footer>
    </>
  )
}

export default App
