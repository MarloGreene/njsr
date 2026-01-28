// Expense Tracker - Cash
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const expenseForm = document.getElementById('expenseForm');
    const expensesContainer = document.getElementById('expensesContainer');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const filterPeriod = document.getElementById('filterPeriod');
    const totalAmount = document.getElementById('totalAmount');
    const budgetAmount = document.getElementById('budgetAmount');
    const remainingAmount = document.getElementById('remainingAmount');
    const budgetStatus = document.getElementById('budgetStatus');
    const setBudgetBtn = document.getElementById('setBudgetBtn');
    const budgetModal = document.getElementById('budgetModal');
    const budgetForm = document.getElementById('budgetForm');
    const budgetInput = document.getElementById('budgetInput');
    const exportBtn = document.getElementById('exportBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const categoryChart = document.getElementById('categoryChart');

    // Initialize
    let expenses = loadExpenses();
    let budget = loadBudget();
    let editingId = null;

    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();

    // Event Listeners
    expenseForm.addEventListener('submit', handleExpenseSubmit);
    searchInput.addEventListener('input', filterExpenses);
    filterCategory.addEventListener('change', filterExpenses);
    filterPeriod.addEventListener('change', filterExpenses);
    setBudgetBtn.addEventListener('click', openBudgetModal);
    budgetForm.addEventListener('submit', handleBudgetSubmit);
    exportBtn.addEventListener('click', exportToCSV);
    clearAllBtn.addEventListener('click', clearAllExpenses);

    // Modal close
    budgetModal.addEventListener('click', function(e) {
        if (e.target === budgetModal || e.target.classList.contains('modal-close')) {
            closeBudgetModal();
        }
    });

    // Initial render
    renderExpenses();
    updateSummary();
    updateCategoryBreakdown();

    // Functions
    function handleExpenseSubmit(e) {
        e.preventDefault();

        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        if (!description || !amount || !category || !date) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (amount <= 0) {
            showNotification('Amount must be greater than 0', 'error');
            return;
        }

        const expense = {
            id: editingId || Date.now().toString(),
            description,
            amount,
            category,
            date,
            createdAt: new Date().toISOString()
        };

        if (editingId) {
            // Update existing expense
            const index = expenses.findIndex(exp => exp.id === editingId);
            if (index !== -1) {
                expenses[index] = expense;
                editingId = null;
                showNotification('Expense updated successfully', 'success');
            }
        } else {
            // Add new expense
            expenses.push(expense);
            showNotification('Expense added successfully', 'success');
        }

        saveExpenses();
        renderExpenses();
        updateSummary();
        updateCategoryBreakdown();
        expenseForm.reset();
        document.getElementById('date').valueAsDate = new Date();
    }

    function renderExpenses(filteredExpenses = null) {
        const expensesToShow = filteredExpenses || expenses;

        if (expensesToShow.length === 0) {
            expensesContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // Sort by date (newest first)
        expensesToShow.sort((a, b) => new Date(b.date) - new Date(a.date));

        expensesContainer.innerHTML = expensesToShow.map(expense => `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-info">
                    <div class="expense-description">${escapeHtml(expense.description)}</div>
                    <div class="expense-meta">
                        ${getCategoryEmoji(expense.category)} ${getCategoryName(expense.category)} •
                        ${formatDate(expense.date)}
                    </div>
                </div>
                <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                <div class="expense-actions">
                    <button class="btn btn-icon btn-edit" onclick="editExpense('${expense.id}')">
                        ✏️
                    </button>
                    <button class="btn btn-icon btn-delete" onclick="deleteExpense('${expense.id}')">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    function filterExpenses() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const categoryFilter = filterCategory.value;
        const periodFilter = filterPeriod.value;

        let filtered = expenses.filter(expense => {
            const matchesSearch = !searchTerm ||
                expense.description.toLowerCase().includes(searchTerm) ||
                getCategoryName(expense.category).toLowerCase().includes(searchTerm);

            const matchesCategory = !categoryFilter || expense.category === categoryFilter;

            const matchesPeriod = checkPeriodFilter(expense.date, periodFilter);

            return matchesSearch && matchesCategory && matchesPeriod;
        });

        renderExpenses(filtered);
    }

    function checkPeriodFilter(expenseDate, period) {
        if (period === 'all') return true;

        const date = new Date(expenseDate);
        const now = new Date();

        switch (period) {
            case 'today':
                return date.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return date >= weekAgo;
            case 'month':
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            case 'year':
                return date.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    }

    function updateSummary() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        });

        const total = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        totalAmount.textContent = `$${total.toFixed(2)}`;
        budgetAmount.textContent = budget ? `$${budget.toFixed(2)}` : '$0.00';

        if (budget) {
            const remaining = budget - total;
            remainingAmount.textContent = `$${Math.abs(remaining).toFixed(2)}`;
            remainingAmount.className = remaining >= 0 ? 'amount positive' : 'amount negative';
            budgetStatus.textContent = remaining >= 0 ? 'Under budget' : 'Over budget';
        } else {
            remainingAmount.textContent = '$0.00';
            budgetStatus.textContent = 'No budget set';
        }
    }

    function updateCategoryBreakdown() {
        if (expenses.length === 0) {
            categoryChart.innerHTML = `
                <div class="chart-placeholder">
                    <div class="chart-icon">📈</div>
                    <p>Add some expenses to see your spending breakdown</p>
                </div>
            `;
            return;
        }

        const categoryTotals = {};
        expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: (amount / total) * 100
            }));

        categoryChart.innerHTML = sortedCategories.map(cat => `
            <div class="category-item">
                <div>
                    <div class="category-name">${getCategoryEmoji(cat.category)} ${getCategoryName(cat.category)}</div>
                    <div class="category-amount">$${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)</div>
                    <div class="category-bar">
                        <div class="category-fill" style="width: ${cat.percentage}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function handleBudgetSubmit(e) {
        e.preventDefault();
        const newBudget = parseFloat(budgetInput.value);

        if (newBudget < 0) {
            showNotification('Budget must be positive', 'error');
            return;
        }

        budget = newBudget;
        saveBudget();
        updateSummary();
        closeBudgetModal();
        showNotification('Budget updated successfully', 'success');
    }

    function openBudgetModal() {
        budgetInput.value = budget || '';
        budgetModal.style.display = 'block';
    }

    function closeBudgetModal() {
        budgetModal.style.display = 'none';
        budgetForm.reset();
    }

    function exportToCSV() {
        if (expenses.length === 0) {
            showNotification('No expenses to export', 'error');
            return;
        }

        const headers = ['Date', 'Description', 'Category', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...expenses.map(expense => [
                expense.date,
                `"${expense.description.replace(/"/g, '""')}"`,
                getCategoryName(expense.category),
                expense.amount.toFixed(2)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('Expenses exported successfully', 'success');
    }

    function clearAllExpenses() {
        if (expenses.length === 0) {
            showNotification('No expenses to clear', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete all expenses? This action cannot be undone.')) {
            expenses = [];
            saveExpenses();
            renderExpenses();
            updateSummary();
            updateCategoryBreakdown();
            showNotification('All expenses cleared', 'success');
        }
    }

    // Global functions for onclick handlers
    window.editExpense = function(id) {
        const expense = expenses.find(exp => exp.id === id);
        if (!expense) return;

        editingId = id;
        document.getElementById('description').value = expense.description;
        document.getElementById('amount').value = expense.amount;
        document.getElementById('category').value = expense.category;
        document.getElementById('date').value = expense.date;

        document.querySelector('.add-expense h2').textContent = 'Edit Expense';
        document.querySelector('button[type="submit"]').textContent = 'Update Expense';
    };

    window.deleteExpense = function(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            expenses = expenses.filter(exp => exp.id !== id);
            saveExpenses();
            renderExpenses();
            updateSummary();
            updateCategoryBreakdown();
            showNotification('Expense deleted successfully', 'success');
        }
    };

    // Utility functions
    function loadExpenses() {
        const stored = localStorage.getItem('cash_expenses');
        return stored ? JSON.parse(stored) : [];
    }

    function saveExpenses() {
        localStorage.setItem('cash_expenses', JSON.stringify(expenses));
    }

    function loadBudget() {
        const stored = localStorage.getItem('cash_budget');
        return stored ? parseFloat(stored) : null;
    }

    function saveBudget() {
        if (budget) {
            localStorage.setItem('cash_budget', budget.toString());
        } else {
            localStorage.removeItem('cash_budget');
        }
    }

    function getCategoryName(category) {
        const names = {
            'food': 'Food & Dining',
            'transport': 'Transportation',
            'shopping': 'Shopping',
            'entertainment': 'Entertainment',
            'bills': 'Bills & Utilities',
            'health': 'Health & Medical',
            'education': 'Education',
            'travel': 'Travel',
            'other': 'Other'
        };
        return names[category] || category;
    }

    function getCategoryEmoji(category) {
        const emojis = {
            'food': '🍽️',
            'transport': '🚗',
            'shopping': '🛍️',
            'entertainment': '🎬',
            'bills': '💡',
            'health': '🏥',
            'education': '📚',
            'travel': '✈️',
            'other': '📝'
        };
        return emojis[category] || '📝';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message, type = 'info') {
        // Simple notification - could be enhanced with toast library
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 1001;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});