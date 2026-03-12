const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const type = document.getElementById('type');
const category = document.getElementById('category');
const themeToggle = document.getElementById('theme-toggle');
const exportBtn = document.getElementById('export-btn');
const budgetAlert = document.getElementById('budget-alert');

let editID = null;

const budgetInput = document.getElementById('budget-input');
const setBudgetBtn = document.getElementById('set-budget-btn');

let budgetLimit = localStorage.getItem('budgetLimit') !== null 
    ? +localStorage.getItem('budgetLimit') 
    : 2000;

budgetInput.value = budgetLimit;

const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

let expenseChart;

function generateID() {
    return Math.floor(Math.random() * 100000000);
}

function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a description and amount');
        return;
    }

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: +amount.value,
        type: type.value,
        category: category.value,
        date: new Date().toLocaleDateString()
    };

    transactions.push(transaction);
    addTransactionDOM(transaction);
    updateValues();
    updateLocalStorage();
    renderChart();

    text.value = '';
    amount.value = '';
}

function addTransactionDOM(transaction) {
    const sign = transaction.type === 'income' ? '+' : '-';
    const item = document.createElement('li');

    item.classList.add(transaction.type === 'income' ? 'plus' : 'minus');
    
    item.innerHTML = `
        <div>
            ${transaction.text} <small>(${transaction.category})</small> 
        </div>
        <div class="action-buttons">
            <span>${sign}$${Math.abs(transaction.amount)}</span>
            <button class="edit-btn" onclick="editTransaction(${transaction.id})">✎</button>
            <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
        </div>
    `;
    list.appendChild(item);
}

function updateValues() {
    const amounts = transactions.map(transaction => 
        transaction.type === 'income' ? transaction.amount : -Math.abs(transaction.amount)
    );

    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
    
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);

    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1
    ).toFixed(2);

    balance.innerText = `$${total}`;
    money_plus.innerText = `+$${income}`;
    money_minus.innerText = `-$${expense}`;

    if (expense > budgetLimit) {
        budgetAlert.classList.remove('hidden');
    } else {
        budgetAlert.classList.add('hidden');
    }
}

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    init();
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function renderChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    const expenses = transactions.filter(t => t.type === 'expense');
    const categories = [...new Set(expenses.map(t => t.category))];
    
    const categoryTotals = categories.map(cat => {
        return expenses
            .filter(t => t.category === cat)
            .reduce((acc, t) => acc + t.amount, 0);
    });

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.length > 0 ? categories : ['No Expenses'],
            datasets: [{
                data: categoryTotals.length > 0 ? categoryTotals : [1],
                backgroundColor: ['#ff9ff3', '#feca57', '#ff6b6b', '#48dbfb', '#1dd1a1'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function exportToCSV() {
    if (transactions.length === 0) {
        alert('No data to export!');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Description,Amount,Type,Category,Date\n";

    transactions.forEach(t => {
        const row = `${t.id},"${t.text}",${t.amount},${t.type},${t.category},${t.date}`;
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expense_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    themeToggle.innerText = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
});

function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
    renderChart();

    // Load theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        themeToggle.innerText = '☀️ Light Mode';
    }
}

function editTransaction(id) {

    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    text.value = transaction.text;
    amount.value = Math.abs(transaction.amount);
    type.value = transaction.type;
    category.value = transaction.category;

    editID = id;

    const submitBtn = form.querySelector('.btn');
    submitBtn.innerText = 'Update transaction';
    submitBtn.style.backgroundColor = '#feca57'; 
}

form.addEventListener('submit', addTransaction);
exportBtn.addEventListener('click', exportToCSV);

init();

setBudgetBtn.addEventListener('click', () => {
    const newBudget = +budgetInput.value;
    
    if (newBudget <= 0) {
        alert('Please enter a valid budget amount greater than 0.');
        return;
    }

    budgetLimit = newBudget;
    localStorage.setItem('budgetLimit', budgetLimit);
    
    updateValues(); 
    
    setBudgetBtn.innerText = "Saved!";
    setTimeout(() => setBudgetBtn.innerText = "Save Budget", 2000);
});
