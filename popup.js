// State management
let currentStatus = 'Active';
let tasks = [];
let groups = new Set();
let draggedTask = null;
let draggedElement = null;
let currentSort = { field: 'createdDate', direction: 'desc' };
let donutChart = null;
let currentTags = new Set();

// DOM Elements
const addTaskBtn = document.getElementById('addTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const taskList = document.getElementById('taskList');
const tabButtons = document.querySelectorAll('.tab-btn');
const groupList = document.getElementById('groupList');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const reportBtn = document.getElementById('reportBtn');
const searchInput = document.getElementById('searchInput');
const sortBtn = document.getElementById('sortBtn');
const sortDropdown = document.getElementById('sortDropdown');
const metricsModal = document.getElementById('metricsModal');
const closeMetricsModalBtn = document.getElementById('closeMetricsModalBtn');
const tagsContainer = document.getElementById('tagsContainer');
const taskTagsInput = document.getElementById('taskTags');

// Initialize the extension
document.addEventListener('DOMContentLoaded', async () => {
    await loadTasks();
    await loadGroups();
    await loadThemePreference();
    await loadTags();
    // Set default sort
    currentSort = { field: 'createdDate', direction: 'desc' };
    setupSortDropdown();
    renderTasks();
    updateSortDisplay(); // Ensure sort display is shown on initial load
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    addTaskBtn.addEventListener('click', () => showModal());
    cancelBtn.addEventListener('click', () => hideModal());
    closeModalBtn.addEventListener('click', () => hideModal());
    taskForm.addEventListener('submit', handleTaskSubmit);
    
    // Add status change listener
    document.getElementById('taskStatus').addEventListener('change', (e) => {
        const completionHoursGroup = document.getElementById('completionHoursGroup');
        if (completionHoursGroup) {
            completionHoursGroup.style.display = e.target.value === 'Completed' ? 'block' : 'none';
        }
    });
    
    // Add completion hours input handler
    const completionHoursInput = document.getElementById('completionHours');
    completionHoursInput.addEventListener('input', (e) => {
        let value = e.target.value;
        
        // Replace comma with dot for decimal
        value = value.replace(',', '.');
        
        // Ensure only valid decimal numbers
        if (value && !isNaN(value)) {
            // Round to nearest 0.5
            const rounded = Math.round(parseFloat(value) * 2) / 2;
            if (rounded !== parseFloat(value)) {
                e.target.value = rounded;
            }
        }
    });
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentStatus = btn.dataset.status;
            updateTabs();
            renderTasks();
        });
    });

    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Report button
    reportBtn.addEventListener('click', showMetricsModal);
    closeMetricsModalBtn.addEventListener('click', hideMetricsModal);

    // Search
    searchInput.addEventListener('input', handleSearch);

    // Sort
    sortBtn.addEventListener('click', toggleSortDropdown);
    document.addEventListener('click', (e) => {
        if (!sortBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
            sortDropdown.style.display = 'none';
        }
    });

    // Add event listener for status filter
    document.getElementById('chartStatusFilter').addEventListener('change', (e) => {
        updateDonutChart(e.target.value);
    });

    // Tags input
    taskTagsInput.addEventListener('keydown', handleTagInput);
    tagsContainer.addEventListener('click', handleTagRemoval);
}

// Theme Management
async function loadThemePreference() {
    const result = await chrome.storage.local.get('theme');
    const theme = result.theme || 'light';
    document.body.classList.toggle('dark-theme', theme === 'dark');
    updateThemeIcon(theme === 'dark');
}

async function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    await chrome.storage.local.set({ theme: isDark ? 'dark' : 'light' });
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    themeToggleBtn.innerHTML = isDark ? `
        <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    ` : `
        <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
}

// Search Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedSearch = debounce((e) => {
    const searchTerm = e.target.value.toLowerCase();
    renderTasks(searchTerm);
}, 300); // 300ms delay

function handleSearch(e) {
    debouncedSearch(e);
}

// Sort Functions
function setupSortDropdown() {
    const sortFields = [
        { field: 'title', label: 'Title' },
        { field: 'createdDate', label: 'Created Date' },
        { field: 'group', label: 'Group' }
    ];

    sortDropdown.innerHTML = sortFields.map(({ field, label }) => `
        <div class="dropdown-item" data-field="${field}">
            ${label}
            <svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="dropdown-submenu">
                <div class="dropdown-item sort-direction" data-field="${field}" data-direction="asc">
                    ASC
                </div>
                <div class="dropdown-item sort-direction" data-field="${field}" data-direction="desc">
                    DESC
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners for sort options
    sortDropdown.querySelectorAll('.sort-direction').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the click from bubbling up
            const { field, direction } = e.target.dataset;
            currentSort = { field, direction };
            sortDropdown.style.display = 'none';
            renderTasks();
            updateSortDisplay(); // Update the sort display when sort changes
        });
    });
}

// Function to update sort display
function updateSortDisplay() {
    const sortDisplay = document.querySelector('.sort-display');
    if (!sortDisplay) return;

    const fieldLabels = {
        'title': 'Title',
        'createdDate': 'Created Date',
        'group': 'Group'
    };

    const directionIcons = {
        'asc': `<svg class="sort-direction-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 4L8 12M8 4L4 8M8 4L12 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        'desc': `<svg class="sort-direction-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12L8 4M8 12L4 8M8 12L12 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    };

    sortDisplay.innerHTML = `
        <div class="sort-display-content">
            <span class="sort-label">Sort by:</span>
            <span class="sort-value">
                ${fieldLabels[currentSort.field]}
                ${directionIcons[currentSort.direction]}
            </span>
        </div>
    `;
}

function toggleSortDropdown() {
    const isVisible = sortDropdown.style.display === 'block';
    sortDropdown.style.display = isVisible ? 'none' : 'block';
}

// Metrics Modal
function showMetricsModal() {
    updateMetricsCards();
    updateDonutChart();
    metricsModal.style.display = 'block';
}

function hideMetricsModal() {
    metricsModal.style.display = 'none';
}

function updateMetricsCards() {
    const metrics = calculateMetrics();
    document.getElementById('activeTaskCount').textContent = metrics.activeTasks;
    document.getElementById('completedTaskCount').textContent = metrics.completedTasks;
    document.getElementById('onHoldTaskCount').textContent = metrics.onHoldTasks;
}

function calculateTasksByGroup(statusFilter = 'all') {
    const groupCounts = {};
    tasks.forEach(task => {
        if (statusFilter === 'all' || task.status === statusFilter) {
            const group = task.group || 'Uncategorized';
            groupCounts[group] = (groupCounts[group] || 0) + 1;
        }
    });
    return groupCounts;
}

function getChartColors(count) {
    const baseColors = [
        { bg: '#4A90E2', border: '#2171C7' }, // Blue
        { bg: '#7ED321', border: '#5CA018' }, // Green
        { bg: '#F5A623', border: '#D88C15' }, // Orange
        { bg: '#9013FE', border: '#6B0BC1' }, // Purple
        { bg: '#50E3C2', border: '#3DAB92' }, // Turquoise
        { bg: '#FF5C5C', border: '#D64545' }, // Red
        { bg: '#B8E986', border: '#8EBE62' }, // Light Green
        { bg: '#BD10E0', border: '#9B0CB9' }  // Pink
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
        const colorSet = baseColors[i % baseColors.length];
        colors.push({
            backgroundColor: colorSet.bg,
            borderColor: colorSet.border,
            borderWidth: 2
        });
    }
    return colors;
}

async function updateDonutChart(statusFilter = 'all') {
    const ctx = document.getElementById('tasksDonutChart').getContext('2d');
    const groupData = calculateTasksByGroup(statusFilter);
    const labels = Object.keys(groupData);
    const data = Object.values(groupData);
    const colors = getChartColors(labels.length);

    const themeSetting = await chrome.storage.local.get('theme');
    const legendColor = themeSetting.theme == 'dark' ? '#ededed' : '#000000';

    if (donutChart) {
        donutChart.destroy();
    }

    donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.map(c => c.backgroundColor),
                borderColor: colors.map(c => c.borderColor),
                borderWidth: colors.map(c => c.borderWidth)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    return {
                                        text: `${label} (${value})`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor[i],
                                        fontColor: legendColor,
                                        lineWidth: data.datasets[0].borderWidth,
                                        hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                title: {
                    display: false
                },
                datalabels: {
                    color: '#ffffff',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: (value) => {
                        if (value === 0) return '';
                        return value;
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Add event listener for status filter
document.getElementById('chartStatusFilter').addEventListener('change', (e) => {
    updateDonutChart(e.target.value);
});

function calculateMetrics() {
    return {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => t.status === 'Active').length,
        completedTasks: tasks.filter(t => t.status === 'Completed').length,
        onHoldTasks: tasks.filter(t => t.status === 'On Hold').length,
        totalGroups: groups.size
    };
}

// Modal Functions
function showModal(task = null, viewMode = false) {
    taskModal.style.display = 'block';
    const modalContent = document.querySelector('.modal-content');
    
    // Remove any existing edit button first
    const existingEditBtn = document.querySelector('.edit-icon-btn');
    if (existingEditBtn) {
        existingEditBtn.remove();
    }
    
    if (viewMode) {
        modalContent.classList.add('view-mode');
        document.getElementById('modalTitle').textContent = task.title;
        
        // Create a new layout for view mode
        const viewContent = document.createElement('div');
        viewContent.className = 'view-content';
        
        // Meta section with status, group, and creation date
        const metaSection = document.createElement('div');
        metaSection.className = 'view-meta-section';
        metaSection.innerHTML = `
            <div class="view-meta-left">
                <span class="task-status status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                <span class="task-group">${task.group || 'Uncategorized'}</span>
            </div>
            <span class="task-date">Created ${formatDate(task.createdDate)}</span>
        `;
        
        // Description section
        const descriptionSection = document.createElement('div');
        descriptionSection.className = 'view-description-section';
        descriptionSection.innerHTML = `
            <h3>Description</h3>
            <div class="description-content">${task.description || 'No description provided'}</div>
        `;
        
        // Add tags section to view mode
        const tagsSection = document.createElement('div');
        tagsSection.className = 'task-tags';
        if (task.tags && task.tags.length > 0) {
            tagsSection.innerHTML = `
                <h3>Tags</h3>
                <div class="tags-list">
                    ${task.tags.map(tag => `
                        <span class="tag-pill">
                            <span class="tag-text">${tag}</span>
                        </span>
                    `).join('')}
                </div>
            `;
            viewContent.appendChild(tagsSection);
        }
        
        // Assemble the view content
        viewContent.appendChild(metaSection);
        viewContent.appendChild(descriptionSection);
        
        // Replace the form with the view content
        taskForm.style.display = 'none';
        modalContent.appendChild(viewContent);
        
        // Add event listeners for buttons
        document.getElementById('closeModalBtn').addEventListener('click', hideModal);
        
        // Add edit button to modal header
        const modalHeader = document.querySelector('.modal-header');
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn edit-icon-btn';
        editBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        editBtn.title = 'Edit Task';
        editBtn.addEventListener('click', () => {
            showModal(task, false);
        });
        
        // Insert edit button before close button
        const closeBtn = document.getElementById('closeModalBtn');
        modalHeader.insertBefore(editBtn, closeBtn);
    } else {
        modalContent.classList.remove('view-mode');
        // Remove view content if it exists
        const viewContent = modalContent.querySelector('.view-content');
        if (viewContent) {
            viewContent.remove();
        }
        taskForm.style.display = 'block';
        
        if (task) {
            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskGroup').value = task.group;
            document.getElementById('completionHours').value = task.completionHours || '';
            document.getElementById('completionHoursGroup').style.display = task.status === 'Completed' ? 'block' : 'none';
            taskForm.dataset.taskId = task.id;
            renderTags(new Set(task.tags || []));
        } else {
            document.getElementById('modalTitle').textContent = 'New Task';
            taskForm.reset();
            delete taskForm.dataset.taskId;
            document.getElementById('completionHoursGroup').style.display = 'none';
            renderTags(new Set());
        }
    }
}

function hideModal() {
    taskModal.style.display = 'none';
    taskForm.reset();
    delete taskForm.dataset.taskId;
    
    // Remove view content if it exists
    const viewContent = document.querySelector('.view-content');
    if (viewContent) {
        viewContent.remove();
    }
    
    // Reset form state
    const inputs = taskForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => input.disabled = false);
    document.querySelector('.modal-content').classList.remove('view-mode');
}

// Task Management
async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskId = taskForm.dataset.taskId;
    const group = document.getElementById('taskGroup').value;
    const newStatus = document.getElementById('taskStatus').value;
    
    // Get tags from the tags container
    const taskTags = Array.from(tagsContainer.querySelectorAll('.tag-pill'))
        .map(pill => pill.getAttribute('data-tag'));
    
    // Get the highest order number for the group
    const groupTasks = tasks.filter(t => t.group === group && t.status === currentStatus);
    const maxOrder = groupTasks.length > 0 
        ? Math.max(...groupTasks.map(t => t.order)) 
        : 0;

    let completionDate = null;
    let completionHours = null;
    
    if (newStatus === 'Completed') {
        completionDate = new Date().toISOString();
        completionHours = parseFloat(document.getElementById('completionHours').value) || 0;
    }
    
    const taskData = {
        id: taskId || Date.now().toString(),
        title: document.getElementById('taskTitle').value,
        status: newStatus,
        description: document.getElementById('taskDescription').value,
        group: group,
        tags: taskTags,
        createdDate: taskId ? tasks.find(t => t.id === taskId).createdDate : new Date().toISOString(),
        completionDate: completionDate,
        completionHours: completionHours,
        order: taskId ? tasks.find(t => t.id === taskId).order : maxOrder + 1
    };

    if (taskId) {
        // Update existing task
        const index = tasks.findIndex(t => t.id === taskId);
        tasks[index] = taskData;
        showToast(`Task "${taskData.title}" updated successfully!`);
    } else {
        // Add new task
        tasks.push(taskData);
        showToast(`Task "${taskData.title}" created successfully!`);
    }

    // Add group to groups set and update the datalist
    if (taskData.group) {
        groups.add(taskData.group);
        await saveGroups();
        updateGroupList();
    }

    await saveTasks();
    hideModal();
    renderTasks();
}

async function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        tasks = tasks.filter(t => t.id !== taskId);
        showToast(`Task "${task.title}" deleted successfully!`);
        
        // Check if this was the last task in the group
        const remainingTasksInGroup = tasks.filter(t => t.group === task.group);
        if (remainingTasksInGroup.length === 0) {
            groups.delete(task.group);
            await saveGroups();
            updateGroupList();
        }
        
        await saveTasks();
        renderTasks();
    }
}

// Storage Functions
async function loadTasks() {
    const result = await chrome.storage.local.get('tasks');
    tasks = result.tasks || [];
}

async function saveTasks() {
    await chrome.storage.local.set({ tasks });
}

async function loadGroups() {
    const result = await chrome.storage.local.get('groups');
    groups = new Set(result.groups || []);
    updateGroupList();
}

async function saveGroups() {
    await chrome.storage.local.set({ groups: Array.from(groups) });
}

// UI Functions
function updateTabs() {
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === currentStatus);
    });
}

function updateGroupList() {
    groupList.innerHTML = Array.from(groups)
        .map(group => `<option value="${group}">`)
        .join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

// Toast Function
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger reflow
    toast.offsetHeight;
    
    // Add show class
    toast.classList.add('show');
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Drag and Drop Functions
function setupDragAndDrop(taskCard, taskId) {
    taskCard.draggable = true;
    
    taskCard.addEventListener('dragstart', (e) => {
        draggedTask = taskId;
        draggedElement = taskCard;
        taskCard.classList.add('dragging');
        setTimeout(() => {
            taskCard.style.opacity = '0.5';
        }, 0);
    });
    
    taskCard.addEventListener('dragend', async () => {
        taskCard.classList.remove('dragging');
        taskCard.style.opacity = '1';
        
        const groupContent = taskCard.parentElement;
        const taskCards = [...groupContent.querySelectorAll('.task-card')];
        const task = tasks.find(t => t.id === draggedTask);
        
        if (task) {
            const oldOrder = task.order;
            taskCards.forEach((card, index) => {
                const taskId = card.getAttribute('data-task-id');
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    task.order = index + 1;
                }
            });
            
            if (oldOrder !== task.order) {
                showToast(`Task "${task.title}" reordered!`);
            }
        }
        
        await saveTasks();
        draggedTask = null;
        draggedElement = null;
    });
    
    taskCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        const groupContent = taskCard.parentElement;
        const taskCards = [...groupContent.querySelectorAll('.task-card:not(.dragging)')];
        const afterElement = getDragAfterElement(taskCards, e.clientY);
        
        if (afterElement) {
            groupContent.insertBefore(draggedElement, afterElement);
        } else {
            groupContent.appendChild(draggedElement);
        }
    });
}

function getDragAfterElement(taskCards, y) {
    return taskCards.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Render Functions
function renderTasks(searchTerm = '') {
    const filteredTasks = tasks
        .filter(task => task.status === currentStatus)
        .filter(task => {
            if (!searchTerm) return true;
            return (
                task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm) ||
                task.group.toLowerCase().includes(searchTerm) ||
                (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        });

    // Sort tasks first before grouping
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const { field, direction } = currentSort;
        const multiplier = direction === 'asc' ? 1 : -1;
        
        // Handle different field types
        switch (field) {
            case 'createdDate':
                return multiplier * (new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
            case 'title':
            case 'group':
                const aValue = (a[field] || '').toLowerCase();
                const bValue = (b[field] || '').toLowerCase();
                return multiplier * aValue.localeCompare(bValue);
            default:
                return 0;
        }
    });

    const groupedTasks = groupTasksByGroup(sortedTasks);
    
    taskList.innerHTML = '';
    
    // Add sort display section
    const sortDisplaySection = document.createElement('div');
    sortDisplaySection.className = 'sort-display';
    taskList.appendChild(sortDisplaySection);
    updateSortDisplay();
    
    if (sortedTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#adb5bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 8V12M12 16H12.01" stroke="#adb5bd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <h3>No ${currentStatus.toLowerCase()} tasks</h3>
            <p>Click the "Add Task" button to create your first task</p>
        `;
        taskList.appendChild(emptyState);
        return;
    }
    
    // Render groups in sorted order
    const sortedGroups = Object.keys(groupedTasks).sort((a, b) => {
        if (currentSort.field === 'group') {
            const multiplier = currentSort.direction === 'asc' ? 1 : -1;
            return multiplier * a.localeCompare(b);
        }
        return 0;
    });

    sortedGroups.forEach(group => {
        const groupTasks = groupedTasks[group];
        const groupSection = document.createElement('div');
        groupSection.className = 'group-section';
        
        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-header';
        groupHeader.innerHTML = `
            <div class="group-header-left">
                <div class="group-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3>${group}</h3>
            </div>
            <span class="task-count">${groupTasks.length}</span>
        `;
        
        const groupContent = document.createElement('div');
        groupContent.className = 'group-content';
        
        // Tasks are already sorted, so we can just render them
        groupTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            taskCard.setAttribute('data-task-id', task.id);
            
            const tagsHtml = task.tags && task.tags.length > 0
                ? `<div class="task-tags">${task.tags.map(tag => `
                    <span class="tag-pill">
                        <span class="tag-text">${tag}</span>
                    </span>
                `).join('')}</div>`
                : '';
            
            // Create completion time element if task is completed
            const completionInfo = task.status === 'Completed'
                ? `<div class="completion-info">Completed in: ${formatCompletionTime(task.completionHours)}</div>`
                : '';
            
            taskCard.innerHTML = `
                <div class="task-card-header">
                    <span class="task-title">${task.title}</span>
                    <span class="task-status status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                </div>
                <div class="task-description">${task.description || ''}</div>
                ${tagsHtml}
                ${completionInfo}
                <div class="task-meta">
                    <span>Created ${formatDate(task.createdDate)}</span>
                    <div class="task-actions">
                        <button class="btn secondary-btn edit-btn" data-task-id="${task.id}">Edit</button>
                        <button class="btn secondary-btn delete-btn" data-task-id="${task.id}">Delete</button>
                    </div>
                </div>
            `;
            
            groupContent.appendChild(taskCard);
            setupDragAndDrop(taskCard, task.id);
        });
        
        groupSection.appendChild(groupHeader);
        groupSection.appendChild(groupContent);
        taskList.appendChild(groupSection);
        
        // Add click event for group header
        groupHeader.addEventListener('click', () => {
            const icon = groupHeader.querySelector('.group-icon');
            const content = groupContent;
            
            icon.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });
    });

    // Add event listeners to buttons and title
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const taskId = btn.dataset.taskId;
            const task = tasks.find(t => t.id === taskId);
            showModal(task);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const taskId = btn.dataset.taskId;
            if (confirm('Are you sure you want to delete this task?')) {
                deleteTask(taskId);
            }
        });
    });
    
    document.querySelectorAll('.task-title').forEach(title => {
        title.addEventListener('click', () => {
            const taskCard = title.closest('.task-card');
            const taskId = taskCard.getAttribute('data-task-id');
            const task = tasks.find(t => t.id === taskId);
            showModal(task, true);
        });
    });
}

function groupTasksByGroup(tasks) {
    return tasks.reduce((acc, task) => {
        const group = task.group || 'Uncategorized';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(task);
        return acc;
    }, {});
}

// Update the task card rendering to show completion time if available
function formatTimeSpent(startDate, endDate) {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMillis = end - start;
    
    const days = Math.floor(diffInMillis / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffInMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMillis % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeSpent = '';
    if (days > 0) timeSpent += `${days}d `;
    if (hours > 0) timeSpent += `${hours}h `;
    if (minutes > 0) timeSpent += `${minutes}m`;
    
    return timeSpent.trim() || '< 1m';
}

// Add this new function to format completion time
function formatCompletionTime(hours) {
    if (!hours && hours !== 0) return '0 hours';
    
    const fullHours = Math.floor(hours);
    const minutes = Math.round((hours - fullHours) * 60);
    
    if (fullHours === 0) {
        return `${minutes} minutes`;
    } else if (minutes === 0) {
        return `${fullHours} ${fullHours === 1 ? 'hour' : 'hours'}`;
    } else {
        return `${fullHours} ${fullHours === 1 ? 'hour' : 'hours'} ${minutes} minutes`;
    }
}

// Tags Management
async function loadTags() {
    const result = await chrome.storage.local.get('tags');
    currentTags = new Set(result.tags || []);
}

async function saveTags() {
    await chrome.storage.local.set({ tags: Array.from(currentTags) });
}

function handleTagInput(e) {
    if (e.key === 'Enter' && e.target.value.trim()) {
        e.preventDefault();
        const tag = e.target.value.trim().toLowerCase();
        addTag(tag);
        e.target.value = '';
    }
}

function handleTagRemoval(e) {
    const removeBtn = e.target.closest('.remove-tag');
    if (removeBtn) {
        const tagElement = removeBtn.closest('.tag-pill');
        const tag = tagElement.getAttribute('data-tag');
        removeTag(tag);
    }
}

function getTaskTagsFromForm() {
    // Always get tags from the DOM for both new and existing tasks
    return new Set(Array.from(tagsContainer.querySelectorAll('.tag-pill')).map(pill => pill.getAttribute('data-tag')));
}

function addTag(tag) {
    const taskTags = getTaskTagsFromForm();
    if (!taskTags.has(tag)) {
        taskTags.add(tag);
        currentTags.add(tag);
        renderTags(taskTags);
        saveTags();
    }
}

function removeTag(tag) {
    const taskTags = getTaskTagsFromForm();
    taskTags.delete(tag);
    renderTags(taskTags);
}

function renderTags(tags) {
    tagsContainer.innerHTML = Array.from(tags).map(tag => `
        <span class="tag-pill" data-tag="${tag}">
            ${tag}
            <span class="remove-tag">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </span>
        </span>
    `).join('');
} 