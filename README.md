# 🦊 FoxySpoofers

> **A modern Chrome extension to create a virtual camera, spoof geolocation, manage a local proxy, and change your User-Agent directly in your browser.**
![image](https://github.com/user-attachments/assets/ea6971f5-4324-463e-8861-d2b43198383d)
---

## 🚨 What's New
### v1.0.4
- Unified container styles for a more polished and consistent appearance
- Updated several labels for improved clarity and usability
- Automatic aspect ratio adjustment when switching videos

### v1.0.3
- Added Leaflet map functionality with geocoding support in main.js
- Introduced NavSpoofers class to handle navigation attribute spoofing
- Created NavSpoofSettings class for fetching user agent and other settings
- Developed SpoofAttributes class to manage various spoofable attributes
- Integrated settings fetching from chrome.storage or meta tags
- Enhanced navigator properties such as userAgent, language, and screen resolution
- Implemented event listeners for dynamic updates in navigation spoofing

### v1.0.2
- Complete UI redesign for a modern, consistent look.
- User-Agent spoofing is now fully functional and configurable.
- All features except video spoofing are now global (apply to all domains).
- Extension loads before page scripts, preventing 404 errors on some sites.

### v1.0.1
- Added User-Agent spoofing for all outgoing requests.
- Geolocation spoofing UI available (functionality coming soon).

### v1.0.0
- Initial release with:
  - Responsive popup interface
  - Virtual camera with drag & drop video support
  - Persistent video state and IndexedDB storage
  - Real-time sync across tabs
  - One-click enable/disable
  - Data wipe button
  - Toast notifications
  - Geolocation and proxy spoofing UI

---

## 🚀 Features

- **Virtual Camera:** Replace your webcam with any video on supported sites.
- **Popup Controls:** Play, pause, seek, and manage video directly from the extension.
- **Per-Domain Video Activation:** Only videos are per-domain; all other spoofers are global.
- **Custom Geolocation:** Spoof your GPS position for all sites, now with interactive Leaflet map and geocoding support.
- **Configurable Proxy:** Apply a local HTTP/HTTPS/SOCKS5 proxy globally.
- **User-Agent Spoofer:** Change your browser's User-Agent globally.
- **Navigation Attribute Spoofing:** Spoof navigator properties like userAgent, language, and screen resolution.
- **Dynamic Settings:** Fetch and update spoofing settings from chrome.storage or meta tags in real time.
- **No External Servers:** All processing and storage is local to your browser.

---

## 🛠️ Installation

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the extension folder.
5. The extension icon should now appear in your Chrome toolbar.

---

## 🎬 Usage

1. Click the extension icon to open the popup.
2. Load a video (drag-and-drop or use the button).
3. Click **Enable camera** to activate the virtual camera.
4. Use the video controls to play, pause, or seek.
5. The extension will remember your position and settings.

Bonus. You can also go to a website ant then add `/foxyspoofers`, it works as well!
![image](https://github.com/user-attachments/assets/ff4fcac6-1da8-4968-8485-cf36a8d5bbec)

---

## 👤 Authors

- [Fox3000foxy](https://github.com/fox3000foxy)
- GitHub Copilot (GPT 4.1, Claude 3.5 Sonnet)

---

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Notes

- Works best on sites that use `getUserMedia` for webcam access.
- All video and settings data stays on your device.
- For feedback or issues, open an issue on GitHub.

---

## 🦋 Known Issues

- To pause the video, click directly on the video. The pause button on the seek bar may not correctly pause the mirrored stream.
- You may click to pause and then click to unpause to make the sync function availiable in background
