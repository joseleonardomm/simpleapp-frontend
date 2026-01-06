// Variables globales
let transactions = [];
let percentages = [];
let categoryBalances = {};
let chart = null;
let editingTransactionId = null;

// Categorías por defecto
const defaultCategories = [
    { id: 1, name: 'Necesidades', color: '#4a6fa5' },
    { id: 2, name: 'Ahorro', color: '#7dcd85' },
    { id: 3, name: 'Educación', color: '#e9c46a' },
    { id: 4, name: 'Entretenimiento', color: '#e76f51' },
    { id: 5, name: 'Otros', color: '#9d4edd' }
];

// Porcentajes por defecto
const defaultPercentages = [
    { categoryId: 1, name: 'Necesidades', value: 50 },
    { categoryId: 2, name: 'Ahorro', value: 20 },
    { categoryId: 3, name: 'Educación', value: 10 },
    { categoryId: 4, name: 'Entretenimiento', value: 10 },
    { categoryId: 5, name: 'Otros', value: 10 }
];

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupEventListeners();
    loadData();
    updateUI();
});

// Inicializar la aplicación
function initApp() {
    // Cargar datos del localStorage o usar valores por defecto
    const savedTransactions = localStorage.getItem('financeTransactions');
    const savedPercentages = localStorage.getItem('financePercentages');
    const savedCategoryBalances = localStorage.getItem('financeCategoryBalances');
    
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
    
    if (savedPercentages) {
        percentages = JSON.parse(savedPercentages);
    } else {
        percentages = [...defaultPercentages];
        savePercentages();
    }
    
    if (savedCategoryBalances) {
        categoryBalances = JSON.parse(savedCategoryBalances);
    } else {
        // Inicializar balances de categorías a 0
        initializeCategoryBalances();
    }
    
    // Configurar fecha por defecto en el formulario
    document.getElementById('date').valueAsDate = new Date();
    
    // Llenar categorías en el formulario
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    defaultCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
    });
    
    // Configurar opciones de mes y año
    setupMonthYearSelectors();
    
    // Añadir evento para mostrar/ocultar advertencia de saldo insuficiente
    setupCategoryWarning();
}

// Inicializar balances de categorías
function initializeCategoryBalances() {
    defaultCategories.forEach(category => {
        categoryBalances[category.id] = 0;
    });
    saveCategoryBalances();
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Botones para abrir modales
    document.getElementById('addTransactionBtn').addEventListener('click', () => openTransactionModal());
    document.getElementById('addPercentageBtn').addEventListener('click', () => openPercentageModal());
    document.getElementById('viewAllTransactionsBtn').addEventListener('click', () => openAllTransactionsModal());
    
    // Cerrar modales
    document.getElementById('closeTransactionModal').addEventListener('click', () => closeTransactionModal());
    document.getElementById('closePercentageModal').addEventListener('click', () => closePercentageModal());
    document.getElementById('closeAllTransactionsModal').addEventListener('click', () => closeAllTransactionsModal());
    document.getElementById('cancelTransaction').addEventListener('click', () => closeTransactionModal());
    document.getElementById('cancelPercentage').addEventListener('click', () => closePercentageModal());
    
    // Enviar formularios
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('percentageForm').addEventListener('submit', handlePercentageSubmit);
    
    // Filtro de transacciones
    document.getElementById('filterType').addEventListener('change', updateTransactionsTable);
    document.getElementById('allTransactionsFilterType').addEventListener('change', updateAllTransactionsTable);
    
    // Selectores de mes y año
    document.getElementById('monthSelect').addEventListener('change', updateMonthSummary);
    document.getElementById('yearSelect').addEventListener('change', updateMonthSummary);
    
    // Botón para agregar campo de porcentaje
    document.getElementById('addPercentageField').addEventListener('click', addPercentageField);
    
    // Cambiar tipo de transacción para mostrar/ocultar campo de categoría
    document.getElementById('typeIncome').addEventListener('change', handleTransactionTypeChange);
    document.getElementById('typeExpense').addEventListener('change', handleTransactionTypeChange);
    
    // Cerrar modal al hacer clic fuera de él
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Manejar cambio de tipo de transacción
function handleTransactionTypeChange() {
    const isExpense = document.getElementById('typeExpense').checked;
    const categoryField = document.getElementById('categoryField');
    const categorySelect = document.getElementById('category');
    
    if (isExpense) {
        categoryField.classList.add('visible');
        categorySelect.required = true;
    } else {
        categoryField.classList.remove('visible');
        categorySelect.required = false;
        categorySelect.value = '';
        document.getElementById('categoryWarning').style.display = 'none';
    }
}

// Configurar advertencia de saldo insuficiente
function setupCategoryWarning() {
    const categorySelect = document.getElementById('category');
    const amountInput = document.getElementById('amount');
    const warningElement = document.getElementById('categoryWarning');
    
    function checkCategoryBalance() {
        const categoryId = parseInt(categorySelect.value);
        const amount = parseFloat(amountInput.value) || 0;
        const isExpense = document.getElementById('typeExpense').checked;
        
        if (isExpense && categoryId) {
            const available = categoryBalances[categoryId] || 0;
            
            if (amount > available) {
                warningElement.textContent = `Advertencia: Saldo disponible en esta categoría: $${available.toFixed(2)}`;
                warningElement.style.display = 'block';
            } else {
                warningElement.style.display = 'none';
            }
        } else {
            warningElement.style.display = 'none';
        }
    }
    
    categorySelect.addEventListener('change', checkCategoryBalance);
    amountInput.addEventListener('input', checkCategoryBalance);
}

// Cargar datos en la UI
function loadData() {
    updateSummaryCards();
    updateTransactionsTable();
    updatePercentageList();
    updateChart();
    updateMonthSummary();
}

// Guardar transacciones en localStorage
function saveTransactions() {
    localStorage.setItem('financeTransactions', JSON.stringify(transactions));
}

// Guardar porcentajes en localStorage
function savePercentages() {
    localStorage.setItem('financePercentages', JSON.stringify(percentages));
}

// Guardar balances de categorías en localStorage
function saveCategoryBalances() {
    localStorage.setItem('financeCategoryBalances', JSON.stringify(categoryBalances));
}

// Actualizar las tarjetas de resumen
function updateSummaryCards() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        }
    });
    
    document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpense').textContent = `$${totalExpense.toFixed(2)}`;
    document.getElementById('totalBalance').textContent = `$${(totalIncome - totalExpense).toFixed(2)}`;
}

// Actualizar la tabla de transacciones (mostrar solo 5)
function updateTransactionsTable() {
    const filterType = document.getElementById('filterType').value;
    const tbody = document.getElementById('transactionsBody');
    const emptyState = document.getElementById('emptyTransactions');
    
    // Filtrar transacciones
    let filteredTransactions = [...transactions];
    if (filterType !== 'all') {
        filteredTransactions = transactions.filter(t => t.type === filterType);
    }
    
    // Ordenar por fecha (más reciente primero)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Tomar solo las últimas 5 transacciones
    const transactionsToShow = filteredTransactions.slice(0, 5);
    
    // Agregar transacciones a la tabla
    transactionsToShow.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Determinar texto para la columna de tipo/categoría
        let categoryText = '';
        if (transaction.type === 'income') {
            categoryText = '<span style="color: var(--accent-color);">Ingreso (Distribuido)</span>';
        } else {
            const category = defaultCategories.find(c => c.id === transaction.categoryId);
            categoryText = category ? category.name : 'Desconocida';
        }
        
        // Formatear fecha
        const date = new Date(transaction.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        
        // Determinar clase para el monto
        const amountClass = transaction.type === 'income' ? 'transaction-income' : 'transaction-expense';
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        
        row.innerHTML = `
            <td>${transaction.description}</td>
            <td>${categoryText}</td>
            <td>${formattedDate}</td>
            <td class="${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</td>
            <td>
                <div class="transaction-actions">
                    <button class="action-btn edit-btn" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Agregar listeners a los botones de editar y eliminar
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            editTransaction(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            deleteTransaction(id);
        });
    });
}

// Actualizar la tabla de todas las transacciones (modal)
function updateAllTransactionsTable() {
    const filterType = document.getElementById('allTransactionsFilterType').value;
    const tbody = document.getElementById('allTransactionsBody');
    const emptyState = document.getElementById('emptyAllTransactions');
    
    // Filtrar transacciones
    let filteredTransactions = [...transactions];
    if (filterType !== 'all') {
        filteredTransactions = transactions.filter(t => t.type === filterType);
    }
    
    // Ordenar por fecha (más reciente primero)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Agregar todas las transacciones a la tabla
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Determinar texto para la columna de tipo/categoría
        let categoryText = '';
        if (transaction.type === 'income') {
            categoryText = '<span style="color: var(--accent-color);">Ingreso (Distribuido)</span>';
        } else {
            const category = defaultCategories.find(c => c.id === transaction.categoryId);
            categoryText = category ? category.name : 'Desconocida';
        }
        
        // Formatear fecha
        const date = new Date(transaction.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        
        // Determinar clase para el monto
        const amountClass = transaction.type === 'income' ? 'transaction-income' : 'transaction-expense';
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        
        row.innerHTML = `
            <td>${transaction.description}</td>
            <td>${categoryText}</td>
            <td>${formattedDate}</td>
            <td class="${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</td>
            <td>
                <div class="transaction-actions">
                    <button class="action-btn edit-btn" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Agregar listeners a los botones de editar y eliminar en el modal
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            editTransaction(id);
            closeAllTransactionsModal();
        });
    });
    
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            deleteTransaction(id);
        });
    });
}

// Actualizar la lista de porcentajes y saldos disponibles
function updatePercentageList() {
    const percentageList = document.getElementById('percentageList');
    const remainingPercentage = document.getElementById('remainingPercentage');
    
    // Calcular total de porcentajes asignados
    let totalPercentage = 0;
    percentages.forEach(p => totalPercentage += p.value);
    
    // Calcular porcentaje restante
    const remaining = 100 - totalPercentage;
    
    // Actualizar texto
    if (remaining >= 0) {
        remainingPercentage.textContent = `${remaining}% disponible`;
        remainingPercentage.style.color = 'var(--accent-color)';
    } else {
        remainingPercentage.textContent = `Exceso: ${Math.abs(remaining)}%`;
        remainingPercentage.style.color = 'var(--danger-color)';
    }
    
    // Calcular total de saldos
    let totalAvailable = 0;
    defaultCategories.forEach(category => {
        totalAvailable += categoryBalances[category.id] || 0;
    });
    
    // Limpiar lista
    percentageList.innerHTML = '';
    
    // Agregar porcentajes y saldos a la lista
    percentages.forEach(percentage => {
        const category = defaultCategories.find(c => c.id === percentage.categoryId);
        const categoryName = category ? category.name : percentage.name;
        const categoryColor = category ? category.color : '#cccccc';
        const available = categoryBalances[percentage.categoryId] || 0;
        
        // Calcular porcentaje de uso (cuánto del presupuesto asignado se ha gastado)
        // Para calcular el presupuesto asignado, necesitamos saber el total de ingresos
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let totalIncome = 0;
        
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (transactionDate.getMonth() === currentMonth && 
                transactionDate.getFullYear() === currentYear &&
                transaction.type === 'income') {
                totalIncome += transaction.amount;
            }
        });
        
        const assignedBudget = totalIncome * (percentage.value / 100);
        const usagePercentage = assignedBudget > 0 ? (available / assignedBudget) * 100 : 0;
        const progressPercentage = Math.min(usagePercentage, 100);
        
        const item = document.createElement('div');
        item.className = 'percentage-item';
        item.innerHTML = `
            <div class="percentage-info">
                <div class="percentage-name">${categoryName}</div>
                <div class="percentage-value">${percentage.value}%</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progressPercentage}%; background-color: ${categoryColor};"></div>
                </div>
            </div>
            <div class="percentage-available ${available >= 0 ? 'positive' : 'negative'}">
                $${available.toFixed(2)}
            </div>
        `;
        
        percentageList.appendChild(item);
    });
}

// Actualizar el gráfico de distribución
function updateChart() {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    // Preparar datos para el gráfico
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    percentages.forEach(percentage => {
        const category = defaultCategories.find(c => c.id === percentage.categoryId);
        labels.push(category ? category.name : percentage.name);
        data.push(percentage.value);
        backgroundColors.push(category ? category.color : '#cccccc');
    });
    
    // Destruir gráfico anterior si existe
    if (chart) {
        chart.destroy();
    }
    
    // Crear nuevo gráfico
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            }
        }
    });
}

// Configurar selectores de mes y año
function setupMonthYearSelectors() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    // Meses
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    
    // Establecer mes actual
    const currentMonth = new Date().getMonth();
    monthSelect.value = currentMonth;
    
    // Años (últimos 5 años y próximos 2)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 2; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    
    // Establecer año actual
    yearSelect.value = currentYear;
}

// Actualizar resumen mensual
function updateMonthSummary() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const year = parseInt(document.getElementById('yearSelect').value);
    const summaryContent = document.getElementById('monthSummary');
    
    // Filtrar transacciones por mes y año
    const monthlyTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
    });
    
    // Calcular totales
    let totalIncome = 0;
    let totalExpense = 0;
    let categoryExpenses = {};
    
    monthlyTransactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
            
            // Acumular gastos por categoría
            const categoryId = transaction.categoryId;
            if (!categoryExpenses[categoryId]) {
                categoryExpenses[categoryId] = 0;
            }
            categoryExpenses[categoryId] += transaction.amount;
        }
    });
    
    // Calcular balance
    const balance = totalIncome - totalExpense;
    
    // Crear contenido del resumen
    let html = `
        <div class="summary-item">
            <span>Total de Ingresos</span>
            <span style="color: var(--accent-color); font-weight: 600;">+$${totalIncome.toFixed(2)}</span>
        </div>
        <div class="summary-item">
            <span>Total de Gastos</span>
            <span style="color: var(--danger-color); font-weight: 600;">-$${totalExpense.toFixed(2)}</span>
        </div>
        <div class="summary-item">
            <span>Balance del Mes</span>
            <span style="color: ${balance >= 0 ? 'var(--accent-color)' : 'var(--danger-color)'}; font-weight: 700;">${balance >= 0 ? '+' : ''}$${balance.toFixed(2)}</span>
        </div>
    `;
    
    // Agregar gastos por categoría si hay gastos
    if (Object.keys(categoryExpenses).length > 0) {
        html += `<div class="summary-item" style="margin-top: 20px; border-top: 2px solid var(--gray-color); padding-top: 20px;">
            <span><strong>Gastos por Categoría</strong></span>
            <span></span>
        </div>`;
        
        Object.keys(categoryExpenses).forEach(categoryId => {
            const category = defaultCategories.find(c => c.id === parseInt(categoryId));
            const categoryName = category ? category.name : 'Desconocida';
            const amount = categoryExpenses[categoryId];
            
            html += `
                <div class="summary-item">
                    <span>${categoryName}</span>
                    <span>-$${amount.toFixed(2)}</span>
                </div>
            `;
        });
    }
    
    // Si no hay transacciones
    if (monthlyTransactions.length === 0) {
        html = `<div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <h3>No hay transacciones para este mes</h3>
            <p>No se registraron ingresos ni gastos en el período seleccionado</p>
        </div>`;
    }
    
    summaryContent.innerHTML = html;
}

// Abrir modal de transacción
function openTransactionModal(transaction = null) {
    const modal = document.getElementById('transactionModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('transactionForm');
    
    // Ocultar advertencia
    document.getElementById('categoryWarning').style.display = 'none';
    
    if (transaction) {
        // Modo edición
        title.textContent = 'Editar Transacción';
        document.getElementById('transactionId').value = transaction.id;
        document.getElementById('description').value = transaction.description;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('date').value = transaction.date;
        
        if (transaction.type === 'income') {
            document.getElementById('typeIncome').checked = true;
            document.getElementById('category').value = '';
        } else {
            document.getElementById('typeExpense').checked = true;
            document.getElementById('category').value = transaction.categoryId;
        }
        
        editingTransactionId = transaction.id;
    } else {
        // Modo creación
        title.textContent = 'Nueva Transacción';
        form.reset();
        document.getElementById('date').valueAsDate = new Date();
        document.getElementById('typeIncome').checked = true;
        document.getElementById('category').value = '';
        editingTransactionId = null;
    }
    
    // Mostrar/ocultar campo de categoría según el tipo seleccionado
    handleTransactionTypeChange();
    
    modal.classList.add('active');
}

// Cerrar modal de transacción
function closeTransactionModal() {
    document.getElementById('transactionModal').classList.remove('active');
    document.getElementById('transactionForm').reset();
    document.getElementById('categoryWarning').style.display = 'none';
    editingTransactionId = null;
}

// Abrir modal de todas las transacciones
function openAllTransactionsModal() {
    const modal = document.getElementById('allTransactionsModal');
    
    // Sincronizar el filtro con el de la vista principal
    const mainFilter = document.getElementById('filterType').value;
    document.getElementById('allTransactionsFilterType').value = mainFilter;
    
    // Actualizar la tabla del modal
    updateAllTransactionsTable();
    
    modal.classList.add('active');
}

// Cerrar modal de todas las transacciones
function closeAllTransactionsModal() {
    document.getElementById('allTransactionsModal').classList.remove('active');
}

// Abrir modal de porcentajes
function openPercentageModal() {
    const modal = document.getElementById('percentageModal');
    const percentageInputs = document.getElementById('percentageInputs');
    
    // Limpiar inputs existentes
    percentageInputs.innerHTML = '';
    
    // Agregar inputs para cada porcentaje
    percentages.forEach((percentage, index) => {
        const category = defaultCategories.find(c => c.id === percentage.categoryId);
        const categoryName = category ? category.name : percentage.name;
        
        const inputGroup = document.createElement('div');
        inputGroup.className = 'form-group';
        inputGroup.innerHTML = `
            <label for="percentage-${index}">${categoryName}</label>
            <div style="display: flex; gap: 10px;">
                <input type="number" id="percentage-${index}" class="percentage-input" 
                       value="${percentage.value}" min="0" max="100" step="1" data-index="${index}">
                <span style="align-self: center;">%</span>
                <button type="button" class="btn btn-danger delete-percentage-btn" data-index="${index}" ${percentages.length <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        percentageInputs.appendChild(inputGroup);
    });
    
    // Actualizar total
    updatePercentageTotal();
    
    // Agregar listeners a los inputs y botones de eliminar
    document.querySelectorAll('.percentage-input').forEach(input => {
        input.addEventListener('input', updatePercentageTotal);
    });
    
    document.querySelectorAll('.delete-percentage-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.getAttribute('data-index'));
            deletePercentageField(index);
        });
    });
    
    modal.classList.add('active');
}

// Cerrar modal de porcentajes
function closePercentageModal() {
    document.getElementById('percentageModal').classList.remove('active');
}

// Agregar campo de porcentaje
function addPercentageField() {
    const percentageInputs = document.getElementById('percentageInputs');
    const newIndex = percentages.length;
    
    // Encontrar categorías no utilizadas
    const usedCategoryIds = percentages.map(p => p.categoryId);
    const availableCategories = defaultCategories.filter(c => !usedCategoryIds.includes(c.id));
    
    if (availableCategories.length === 0) {
        alert('No hay más categorías disponibles. Elimina una categoría existente para agregar una nueva.');
        return;
    }
    
    // Usar la primera categoría disponible
    const category = availableCategories[0];
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'form-group';
    inputGroup.innerHTML = `
        <label for="percentage-${newIndex}">${category.name}</label>
        <div style="display: flex; gap: 10px;">
            <input type="number" id="percentage-${newIndex}" class="percentage-input" 
                   value="0" min="0" max="100" step="1" data-index="${newIndex}">
            <span style="align-self: center;">%</span>
            <button type="button" class="btn btn-danger delete-percentage-btn" data-index="${newIndex}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    percentageInputs.appendChild(inputGroup);
    
    // Agregar a la lista de porcentajes (temporalmente)
    percentages.push({
        categoryId: category.id,
        name: category.name,
        value: 0
    });
    
    // Actualizar total y habilitar botones de eliminar
    updatePercentageTotal();
    
    // Agregar listeners
    document.getElementById(`percentage-${newIndex}`).addEventListener('input', updatePercentageTotal);
    document.querySelector(`.delete-percentage-btn[data-index="${newIndex}"]`).addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        deletePercentageField(index);
    });
    
    // Habilitar todos los botones de eliminar
    document.querySelectorAll('.delete-percentage-btn').forEach(btn => {
        btn.disabled = false;
    });
}

// Eliminar campo de porcentaje
function deletePercentageField(index) {
    // Solo permitir eliminar si hay más de un porcentaje
    if (percentages.length <= 1) {
        alert('Debe haber al menos un porcentaje definido.');
        return;
    }
    
    // Eliminar del array
    percentages.splice(index, 1);
    
    // Volver a abrir el modal para actualizar la vista
    closePercentageModal();
    openPercentageModal();
}

// Actualizar total de porcentajes
function updatePercentageTotal() {
    let total = 0;
    
    document.querySelectorAll('.percentage-input').forEach(input => {
        total += parseInt(input.value) || 0;
    });
    
    document.getElementById('percentageTotal').textContent = `${total}%`;
    
    // Cambiar color si excede 100%
    if (total > 100) {
        document.getElementById('percentageTotal').style.color = 'var(--danger-color)';
    } else if (total === 100) {
        document.getElementById('percentageTotal').style.color = 'var(--accent-color)';
    } else {
        document.getElementById('percentageTotal').style.color = 'var(--dark-color)';
    }
}

// Manejar envío del formulario de transacción
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const id = editingTransactionId || Date.now();
    const description = document.getElementById('description').value;
    let categoryId = null;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    const type = document.querySelector('input[name="type"]:checked').value;
    
    // Validar datos básicos
    if (!description || !amount || !date) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }
    
    // Validar según el tipo de transacción
    if (type === 'expense') {
        categoryId = parseInt(document.getElementById('category').value);
        if (!categoryId) {
            alert('Por favor seleccione una categoría para el gasto');
            return;
        }
        
        // Verificar saldo disponible para gastos
        const available = categoryBalances[categoryId] || 0;
        if (amount > available) {
            if (!confirm(`Advertencia: El saldo disponible en esta categoría es de $${available.toFixed(2)}. ¿Desea continuar con el gasto de $${amount.toFixed(2)}?`)) {
                return;
            }
        }
    }
    
    // Si estamos editando, primero revertimos la transacción anterior
    let oldTransaction = null;
    if (editingTransactionId) {
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index !== -1) {
            oldTransaction = transactions[index];
            
            // Revertir el efecto de la transacción anterior
            if (oldTransaction.type === 'income') {
                // Revertir distribución de ingresos
                const totalIncome = oldTransaction.amount;
                percentages.forEach(percentage => {
                    const categoryAmount = totalIncome * (percentage.value / 100);
                    categoryBalances[percentage.categoryId] -= categoryAmount;
                });
            } else {
                // Revertir gasto
                categoryBalances[oldTransaction.categoryId] += oldTransaction.amount;
            }
        }
    }
    
    // Crear objeto de transacción
    const transaction = {
        id,
        description,
        categoryId,
        amount,
        date,
        type
    };
    
    // Procesar transacción según su tipo
    if (type === 'income') {
        // Distribuir el ingreso según los porcentajes establecidos
        percentages.forEach(percentage => {
            const categoryAmount = amount * (percentage.value / 100);
            categoryBalances[percentage.categoryId] += categoryAmount;
        });
    } else {
        // Descontar el gasto de la categoría seleccionada
        categoryBalances[categoryId] -= amount;
    }
    
    // Agregar o actualizar transacción
    if (editingTransactionId) {
        // Actualizar transacción existente
        const index = transactions.findIndex(t => t.id === editingTransactionId);
        if (index !== -1) {
            transactions[index] = transaction;
        }
    } else {
        // Agregar nueva transacción
        transactions.push(transaction);
    }
    
    // Guardar y actualizar UI
    saveTransactions();
    saveCategoryBalances();
    updateUI();
    
    // Cerrar modal
    closeTransactionModal();
    
    // Mostrar mensaje de confirmación
    showNotification(`Transacción ${editingTransactionId ? 'actualizada' : 'agregada'} correctamente`, 'success');
}

// Manejar envío del formulario de porcentajes
function handlePercentageSubmit(e) {
    e.preventDefault();
    
    // Recolectar valores de los inputs
    const newPercentages = [];
    let total = 0;
    
    document.querySelectorAll('.percentage-input').forEach((input, index) => {
        const value = parseInt(input.value) || 0;
        total += value;
        
        // Obtener categoría correspondiente
        const categoryIndex = parseInt(input.getAttribute('data-index'));
        const originalPercentage = percentages[categoryIndex];
        
        newPercentages.push({
            categoryId: originalPercentage.categoryId,
            name: originalPercentage.name,
            value: value
        });
    });
    
    // Validar que la suma sea 100%
    if (total !== 100) {
        alert(`La suma de los porcentajes debe ser 100%. Actual: ${total}%`);
        return;
    }
    
    // Actualizar porcentajes
    percentages = newPercentages;
    
    // Guardar y actualizar UI
    savePercentages();
    updateUI();
    
    // Cerrar modal
    closePercentageModal();
    
    // Mostrar mensaje de confirmación
    showNotification('Porcentajes actualizados correctamente', 'success');
}

// Editar transacción
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        openTransactionModal(transaction);
    }
}

// Eliminar transacción
function deleteTransaction(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            const transaction = transactions[index];
            
            // Revertir el efecto de la transacción
            if (transaction.type === 'income') {
                // Revertir distribución de ingresos
                const totalIncome = transaction.amount;
                percentages.forEach(percentage => {
                    const categoryAmount = totalIncome * (percentage.value / 100);
                    categoryBalances[percentage.categoryId] -= categoryAmount;
                });
            } else {
                // Revertir gasto
                categoryBalances[transaction.categoryId] += transaction.amount;
            }
            
            // Eliminar transacción
            transactions.splice(index, 1);
            
            // Guardar y actualizar
            saveTransactions();
            saveCategoryBalances();
            updateUI();
            
            showNotification('Transacción eliminada correctamente', 'success');
        }
    }
}

// Actualizar toda la UI
function updateUI() {
    updateSummaryCards();
    updateTransactionsTable();
    updatePercentageList();
    updateChart();
    updateMonthSummary();
}

// Mostrar notificación
function showNotification(message, type) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        background-color: ${type === 'success' ? 'var(--accent-color)' : 'var(--danger-color)'};
        color: white;
        font-weight: 600;
        box-shadow: var(--box-shadow);
        z-index: 1001;
        transform: translateX(150%);
        transition: transform 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Ocultar y eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(150%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Función auxiliar para formatear fecha como YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}