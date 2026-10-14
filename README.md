# Snapstory-polaroid
A browser-based Polaroid photo studio with filters, stickers and PNG export
## ✨ Features

- **Photos:** upload multiple images, capture one with your camera, or generate a sample photo
- **6 layouts:** Classic, Little Duo, Photo Strip, Scrapbook, Mini Grid and Film Roll
- **Filters:** Sepia, B&W, Golden, Faded and Rose, applied per photo
- **Decorations:** draggable stickers, washi tape and custom text with size and rotation controls
- **Captions:** a main caption, a date or location line, and quick caption presets
- **Customization:** paper colors, studio themes, film grain, paper shadow, rounded corners
- **Workflow:** undo / redo, clear canvas, "Surprise me" randomizer, save and restore drafts
- **Export:** download your design as a high-resolution PNG
- **Private by design:** everything runs in your browser, and photos are never uploaded to a server

## 🛠️ Built With

- HTML5
- CSS3 (Grid, Flexbox, CSS variables)
- Vanilla JavaScript (Canvas API, Camera API, FileReader, Pointer Events, localStorage)
- [html2canvas](https://html2canvas.hertzen.com/) for PNG export

## 🚀 Run Locally

1. Clone or download this repository
2. Open the folder in VS Code
3. Start **Live Server** on `index.html`

The camera feature needs `localhost` or HTTPS, so open the project through Live Server rather than double-clicking the file.

## 📁 Project Structure

- `index.html`: page structure and UI
- `style.css`: styling, layouts and themes
- `script.js`: app state, photo handling, drag and drop, undo/redo and export

## 🧠 What I Learned

- Managing app state with a single state object and a render function
- Building undo / redo with state snapshots
- Drag and drop with pointer events
- Image resizing and processing with the Canvas API
- Saving user data in localStorage

## 🔮 Future Improvements

- Drag-to-resize and rotate stickers directly on the canvas
- More layouts and sticker packs
- Share directly to social media

