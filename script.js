
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");

const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const categoryFilter = document.getElementById("categoryFilter");
const priorityFilter = document.getElementById("priorityFilter");

const submitButton = document.getElementById("submitButton");
const cancelEdit = document.getElementById("cancelEdit");
const formTitle = document.getElementById("formTitle");
const themeToggle = document.getElementById("themeToggle");

function loadTasks() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("taskflow_tasks") || "[]"
        );

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.completed === "boolean" &&
            ["Personal", "Study", "Work", "Health", "Other"]
                .includes(task.category) &&
            ["Low", "Medium", "High"].includes(task.priority)
        );
    } catch (error) {
        console.error("Unable to load saved tasks:", error);
        return [];
    }
}

let tasks = loadTasks();
let editingTaskId = null;


function saveTasks() {
    try {
        localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Unable to save tasks:", error);
        alert("Tasks could not be saved. Check your browser storage.");
        return false;
    }
}


function saveTheme(isDark) {
    try {
        localStorage.setItem("taskflow_dark_mode", String(isDark));
    } catch (error) {
        console.error("Unable to save theme preference:", error);
    }
}


function renderTasks() {
    taskList.replaceChildren();

    const searchText = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const category = categoryFilter.value;
    const priority = priorityFilter.value;

    
    totalTasks.textContent = tasks.length;

    completedTasks.textContent = tasks.filter(
        task => task.completed
    ).length;

    pendingTasks.textContent = tasks.filter(
        task => !task.completed
    ).length;

    
    const filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchText);

        const matchesStatus =
            status === "All" ||
            (status === "Completed" && task.completed) ||
            (status === "Pending" && !task.completed);

        const matchesCategory =
            category === "All" || task.category === category;

        const matchesPriority =
            priority === "All" || task.priority === priority;

        return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory &&
            matchesPriority
        );
    });

    
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        if (a.dueDate && b.dueDate) {
            return a.dueDate.localeCompare(b.dueDate);
        }

        if (a.dueDate) return -1;
        if (b.dueDate) return 1;

        return b.createdAt - a.createdAt;
    });

    emptyMessage.hidden = filteredTasks.length > 0;

    filteredTasks.forEach(task => {
        taskList.appendChild(createTaskCard(task));
    });
}


function createTaskCard(task) {
    const card = document.createElement("article");
    card.className = "task-card";

    if (task.completed) {
        card.classList.add("completed");
    }

    const main = document.createElement("div");
    main.className = "task-main";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task completed");

    checkbox.addEventListener("change", () => {
        toggleTask(task.id);
    });

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("h3");
    title.textContent = task.title;

    const description = document.createElement("p");

    const dueDate = task.dueDate || "";

    description.textContent = dueDate
        ? `Due date: ${dueDate}`
        : "No due date set";

    if (
        dueDate &&
        dueDate < getToday() &&
        !task.completed
    ) {
        description.classList.add("due-overdue");
        description.textContent += " — Overdue!";
    }

    const badges = document.createElement("div");
    badges.className = "badges";

    const categoryBadge = document.createElement("span");
    categoryBadge.className = "badge";
    categoryBadge.textContent = task.category;

    const priorityBadge = document.createElement("span");
    priorityBadge.className = `badge priority-${task.priority}`;
    priorityBadge.textContent = `${task.priority} Priority`;

    const statusBadge = document.createElement("span");
    statusBadge.className = "badge";
    statusBadge.textContent = task.completed
        ? "Completed"
        : "Pending";

    badges.append(
        categoryBadge,
        priorityBadge,
        statusBadge
    );

    info.append(title, description, badges);
    main.append(checkbox, info);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "✏️ Edit";
    editButton.setAttribute("aria-label", `Edit ${task.title}`);

    editButton.addEventListener("click", () => {
        editTask(task.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "🗑️ Delete";
    deleteButton.setAttribute(
        "aria-label",
        `Delete ${task.title}`
    );

    deleteButton.addEventListener("click", () => {
        deleteTask(task.id);
    });

    actions.append(editButton, deleteButton);
    card.append(main, actions);

    return card;
}


function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = taskInput.value.trim();
    const category = categoryInput.value;
    const priority = priorityInput.value;
    const dueDate = dueDateInput.value;

    if (!title) {
        alert("Please enter a task name.");
        taskInput.focus();
        return;
    }

    if (title.length > 120) {
        alert("Task name cannot exceed 120 characters.");
        return;
    }

    if (
        !["Personal", "Study", "Work", "Health", "Other"]
            .includes(category)
    ) {
        alert("Please select a valid category.");
        return;
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
        alert("Please select a valid priority.");
        return;
    }

    if (dueDate && dueDate < getToday()) {
        alert("Please select today or a future due date.");
        dueDateInput.focus();
        return;
    }

    if (editingTaskId !== null) {
        const oldTask = tasks.find(
            task => task.id === editingTaskId
        );

        if (!oldTask) {
            resetForm();
            return;
        }

        const previousTask = { ...oldTask };

        oldTask.title = title;
        oldTask.category = category;
        oldTask.priority = priority;
        oldTask.dueDate = dueDate;

        if (!saveTasks()) {
            Object.assign(oldTask, previousTask);
            return;
        }
    } else {
        const newTask = {
            id: crypto.randomUUID(),
            title: title,
            category: category,
            priority: priority,
            dueDate: dueDate,
            completed: false,
            createdAt: Date.now()
        };

        tasks.push(newTask);

        if (!saveTasks()) {
            tasks = tasks.filter(task => task.id !== newTask.id);
            return;
        }
    }

    resetForm();
    renderTasks();
});


function editTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    editingTaskId = id;

    taskInput.value = task.title;
    categoryInput.value = task.category;
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate || "";

    formTitle.textContent = "Edit Task";
    submitButton.textContent = "Save Changes";
    cancelEdit.hidden = false;

    taskInput.focus();

    document.querySelector(".task-form-section")
        .scrollIntoView({ behavior: "smooth" });
}


function resetForm() {
    taskForm.reset();

    editingTaskId = null;

    formTitle.textContent = "Add a New Task";
    submitButton.textContent = "+ Add Task";
    cancelEdit.hidden = true;

    priorityInput.value = "Medium";
}


cancelEdit.addEventListener("click", resetForm);


function deleteTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    const confirmed = confirm(
        `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    const previousTasks = [...tasks];

    tasks = tasks.filter(item => item.id !== id);

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    if (editingTaskId === id) {
        resetForm();
    }

    renderTasks();
}


function toggleTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    task.completed = !task.completed;

    if (!saveTasks()) {
        task.completed = !task.completed;
        return;
    }

    renderTasks();
}


searchInput.addEventListener("input", renderTasks);


statusFilter.addEventListener("change", renderTasks);
categoryFilter.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);


function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);

    themeToggle.textContent = isDark
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";

    saveTheme(isDark);
}

themeToggle.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark-mode");
    applyTheme(isDark);
});


try {
    applyTheme(
        localStorage.getItem("taskflow_dark_mode") === "true"
    );
} catch (error) {
    console.error("Unable to restore theme:", error);
}


renderTasks();
