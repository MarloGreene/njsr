document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    let tasks;
    try {
        tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    } catch (e) {
        console.error('Failed to parse tasks:', e);
        tasks = [];
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            if (task.completed) li.classList.add('completed');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                saveTasks();
                renderTasks();
            });

            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = task.text;
            textSpan.addEventListener('dblclick', () => editTask(task, textSpan));

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => editTask(task, textSpan));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                renderTasks();
            });

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);

            li.appendChild(checkbox);
            li.appendChild(textSpan);
            li.appendChild(actionsDiv);

            taskList.appendChild(li);
        });
    }

    function editTask(task, textSpan) {
        textSpan.contentEditable = true;
        textSpan.classList.add('editing');
        textSpan.focus();

        const saveEdit = () => {
            task.text = textSpan.textContent.trim();
            textSpan.contentEditable = false;
            textSpan.classList.remove('editing');
            saveTasks();
            renderTasks();
        };

        textSpan.addEventListener('blur', saveEdit);
        textSpan.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                textSpan.textContent = task.text;
                textSpan.contentEditable = false;
                textSpan.classList.remove('editing');
            }
        });
    }

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (text) {
            const task = {
                id: Date.now(),
                text,
                completed: false
            };
            tasks.push(task);
            saveTasks();
            renderTasks();
            taskInput.value = '';
        }
    });

    renderTasks();
});