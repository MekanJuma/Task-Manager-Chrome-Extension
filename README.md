# Todo-Ext

A Chrome extension for managing tasks with a clean and intuitive interface.

## Features

- Create, edit, and delete tasks
- Organize tasks by groups
- Track task status (Active/Completed)
- Drag and drop reordering within groups
- Beautiful and responsive UI
- Local storage for data persistence
- Empty state handling
- Toast notifications for actions

## Installation

1. Clone this repository:
```bash
git clone https://github.com/MekanJuma/Task-Manager-Chrome-Extension.git
```

2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `Task-Manager-Chrome-Extension` directory

## Usage

1. Click the extension icon to open the task manager
2. Use the "New Task" button to create new tasks
3. Organize tasks into groups
4. Drag and drop tasks to reorder them
5. Click on a task title to view details
6. Use the edit and delete buttons to manage tasks
7. Switch between Active and Completed tasks using the tabs

## Development

The extension is built using vanilla JavaScript and uses Chrome's storage API for data persistence.

### Project Structure

- `popup.html` - Main extension interface
- `popup.js` - Core functionality and event handling
- `styles.css` - Styling and animations
- `manifest.json` - Extension configuration

## License

MIT License 
