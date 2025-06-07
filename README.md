# 🦊 FoxySpoofers

> **A modern Chrome extension to create a virtual camera, spoof geolocation, and manage a local proxy directly in your browser.**

---

![image](https://github.com/user-attachments/assets/a3881a33-785d-4062-9e31-90b15974f96c)
![image](https://github.com/user-attachments/assets/896feafb-323e-4e6f-9807-b8f1327a099b)
![image](https://github.com/user-attachments/assets/6813f493-00bd-444d-b6db-5990addd730b)
![image](https://github.com/user-attachments/assets/e502f809-dc2f-4973-af81-de81aba5545c)

## ✨ What's new in v1.0.2

- **Graphical redesign:** Complete UI overhaul for a more modern and consistent look.
- **User-Agent spoofer finished:** User-Agent spoofing is now fully functional and configurable.
- **Global settings:** All features except videos are now global (apply to all domains, not just the current one).
- **No more 404 page:** Thanks to using `document_start` in the manifest, the extension now loads before page scripts, preventing 404 errors on some sites.

---

## ✨ What's new in v1.0.1

- **User-Agent spoofer:** Added the ability to spoof the User-Agent for all outgoing requests.
- **Geolocation:** Geolocation spoofing UI is present, but the geolocation is not actually instantiated (only the virtual camera is active).

---

## ✨ What's new in v1.0.0

- **Modern UI:** Responsive popup interface with video drag & drop, animated status, toast notifications.
- **Persistent video state:** Resume playback where you left off, even after restart.
- **IndexedDB storage:** Videos and settings stored locally for speed and privacy.
- **BroadcastChannel sync:** Controls and video state synchronized in real time across all tabs.
- **One-click enable/disable:** Instantly turn the virtual camera on or off.
- **Drag & Drop support:** Easily load a video by drag-and-drop.
- **Data wipe:** One button to clear everything (videos, settings, geolocation, proxy).
- **Improved notifications:** Clear messages for every action or error.
- **Settings (coming soon):** Loop, autoplay, mute (UI already ready).
- **Geolocation spoofing:** Choose a latitude/longitude and enable simulated geolocation.
- **Local proxy:** Set an HTTP/HTTPS/SOCKS5 proxy for the current domain, stored locally.

---

## 🚀 Features

- **Virtual camera:** Replace your webcam with any video on supported sites.
- **Popup controls:** Play, pause, seek, and manage video directly from the extension.
- **Per-domain video activation:** Only videos are per-domain; all other spoofers are now global.
- **Custom geolocation:** Spoof your GPS position for all sites.
- **Configurable proxy:** Apply a local proxy globally (HTTP/HTTPS/SOCKS5).
- **User-Agent spoofer:** Change your browser's User-Agent globally.
- **No external servers:** Everything is processed and stored locally in your browser.

---

## 🛠️ Installation

1. **Download** or clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the extension folder.
5. The extension icon should now appear in your Chrome toolbar.

---

## 🎬 Usage

1. Click the extension icon to open the popup.
2. **Load a video** (drag-and-drop or use the button).
3. Click **Enable camera** to activate the virtual camera.
4. Use the video controls to play, pause, or seek.
5. The extension will remember your position and settings.

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
- All video data stays on your device.
- For feedback or issues, open an issue on GitHub.

---

## 🦋 Known bugs

- Click directly on the video to pause it; do not use the pause button on the seek bar, as it will not correctly pause the mirrored stream.
