# GitHub Directory Downloader

A modern, responsive web app to download any GitHub directory as a ZIP file—or any single file—directly in your browser, with no backend required.

---

## 🚀 Features
- **Download any public GitHub folder as a ZIP**
- **Download any single file from a public GitHub repo**
- **Pure frontend:** No backend, no data stored
- **Recursive folder support**
- **Step-by-step progress:**
  - Folders: Retrieving, zipping, downloading
  - Files: Retrieving, downloading
- **Responsive UI:** Works beautifully on desktop and mobile
- **Customizable accent color:** Blue, green, or purple (picker in footer)
- **Modern design:** Glassy panels, sidebar summary, animated info panel
- **Error handling:** Friendly, clear error messages
- **GitHub token support:** For large/private repos (optional)
- **Download summary:** File count, size, type breakdown, and more
- **Info panel:** Up-to-date usage instructions and privacy info

---

## 🌐 Live Demo
> _Add your live deployment link here if available_

---

## 📸 Screenshots
>Screenshot1.png
>Screenshot2.png
>Screenshot3.png
---

## 🖥️ Tech Stack
- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [JSZip](https://stuk.github.io/jszip/)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/)
- GitHub REST API

---

## 📦 Usage
1. Paste any GitHub **folder** or **file** URL (e.g. `/tree/` or `/blob/`).
2. The placeholder is always centered, responsive, and fits in one line.
3. Click the **Download** button or press Enter.
4. Watch the progress steps:
   - For folders: Retrieving, zipping, downloading
   - For files: Retrieving, downloading
5. The ZIP or file will download automatically when ready.
6. See a summary of your download as a sidebar (desktop) or card (mobile).
7. Pick your favorite accent color from the footer color picker—UI updates instantly.

### Downloading from Private Repos or Large Folders
- Paste a GitHub personal access token in the URL as `https://TOKEN@github.com/...`

---

## 📝 Example URLs
- Folder: `https://github.com/user/repo/tree/main/folder`
- File: `https://github.com/user/repo/blob/main/file.txt`

---

## 🛡️ Privacy
- All processing is done in your browser. No data is sent to any server.

---

## 🖌️ Customization
- Change the accent color using the color picker in the footer. The entire app updates instantly.

---

## 🙏 Credits
- Inspired by [download-directory.github.io](https://download-directory.github.io/)
- Built with [React](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [JSZip](https://stuk.github.io/jszip/), and [FileSaver.js](https://github.com/eligrey/FileSaver.js/)

---

## 📄 License
[MIT](LICENSE)
