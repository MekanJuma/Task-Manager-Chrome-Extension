# Todo-Ext

A Chrome extension for managing tasks with a clean and intuitive interface.

## Features

- Create, edit, and delete tasks
- Organize tasks by groups
- Track task status (Active/Completed/On Hold)
- Tag tasks with custom labels
- Drag and drop reordering within groups
- Beautiful and responsive UI
- Local storage for data persistence
- Empty state handling
- Toast notifications for actions
- Smart search with debouncing
- Advanced sorting (by title, date, group)
- Theme toggle (Light/Dark mode)
- Task completion time tracking
- Comprehensive reporting
  - Task distribution by group
  - Status-based filtering
  - Visual analytics with charts
  - Completion metrics

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
4. Add tags by typing and pressing Enter
5. Remove tags using the × button
6. Drag and drop tasks to reorder them
7. Click on a task title to view details
8. Use the edit and delete buttons to manage tasks
9. Switch between Active, Completed, and On Hold tasks using the tabs
10. Use the search bar to filter tasks (with smart debouncing)
11. Sort tasks using the sort dropdown
12. Toggle between light and dark themes
13. View task analytics in the report section

## Development

The extension is built using vanilla JavaScript and uses Chrome's storage API for data persistence.

### Project Structure

- `popup.html` - Main extension interface
- `popup.js` - Core functionality and event handling
- `styles.css` - Styling and animations
- `manifest.json` - Extension configuration

### Features Implementation

#### Search
- Implements debounced search functionality (300ms delay)
- Searches across task titles, descriptions, groups, and tags

#### Sorting
- Supports sorting by multiple fields:
  - Title (A-Z, Z-A)
  - Created Date (Newest/Oldest)
  - Group (A-Z, Z-A)

#### Theme System
- Light/Dark mode toggle
- Persistent theme preference
- Automatic UI adaptation

#### Task Completion Tracking
- Records completion time for tasks
- Calculates and displays time spent on completed tasks
- Supports task status changes with time tracking

#### Tagging System
- Add multiple tags to tasks
- Real-time tag addition with Enter key
- Interactive tag removal with × button
- Tag pills with modern design
- Tags visible in task cards and detailed view
- Tags included in search functionality
- Persistent tag storage
- Cross-task tag consistency

#### Reporting System
- Interactive donut chart for task distribution
- Status-based filtering in reports
- Group-wise task analysis
- Real-time metrics updates

## Author

**Mekan Jumayev**
- GitHub: [MekanJuma](https://github.com/MekanJuma)
- LinkedIn: [Mekan Jumayev](https://www.linkedin.com/in/mekanjuma)
- Instagram: [Mekan Jumayev](https://www.instagram.com/jumaevmekan)
