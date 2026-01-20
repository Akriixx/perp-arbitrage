// public/client.js
const API_URL = '/api/scans';
const HISTORY_URL = '/api/spread-history';
const UPDATE_INTERVAL = 3000;
const CHART_REFRESH_INTERVAL = 60000; // 60s

// State
let rawData = [];
let favorites = JSON.parse(localStorage.getItem('arbi_favorites') || '[]');
let currentFilter = {
    exchange: 'ALL',
    search: '',
    onlyFavorites: false
};

// Accordion & Chart State
let expandedSymbol = null;
let currentPeriod = '7D';
let myChart = null;

// New Refresh Logic State
let chartTimer = null;
let countdownTimer = null;
let nextUpdateTimestamp = 0;
let isAutoRefresh = false;

// --- DOM ELEMENTS ---
const tbody = document.getElementById('opportunities-body');
const searchInput = document.getElementById('pair-search');
const menuItems = document.querySelectorAll('.menu-item');
const btnReset = document.getElementById('btn-reset');
const btnFavorites = document.getElementById('btn-favorites');

// --- INIT & EVENTS ---
function init() {
    setupListeners();
    fetchData(); // Initial load
    setInterval(() => {
        fetchData(); // Main table refresh
    }, UPDATE_INTERVAL);
}

function setupListeners() {
    searchInput.addEventListener('input', (e) => {
        currentFilter.search = e.target.value.toUpperCase();
        renderTable();
    });

    menuItems.forEach(item => {
        if (item.dataset.filter) {
            item.addEventListener('click', () => {
                menuItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentFilter.exchange = item.dataset.filter;
                currentFilter.onlyFavorites = false;
                btnFavorites.classList.remove('active');
                renderTable();
            });
        }
    });

    btnFavorites.addEventListener('click', () => {
        currentFilter.onlyFavorites = !currentFilter.onlyFavorites;
        if (currentFilter.onlyFavorites) {
            btnFavorites.classList.add('active');
            menuItems.forEach(i => i.classList.remove('active'));
        } else {
            btnFavorites.classList.remove('active');
            document.querySelector('[data-filter="ALl"]').classList.add('active');
        }
        renderTable();
    });

    btnReset.addEventListener('click', () => {
        currentFilter.search = '';
        currentFilter.exchange = 'ALL';
        currentFilter.onlyFavorites = false;
        searchInput.value = '';
        menuItems.forEach(i => i.classList.remove('active'));
        document.querySelector('[data-filter="ALl"]').classList.add('active');
        btnFavorites.classList.remove('active');
        closeAccordion();
        renderTable();
    });
}

// --- DATA FETCHING ---
async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        rawData = json.pairs;
        updateStatus(true);
        // Smart Render: Only update table rows, don't kill accordion if it exists
        renderTableSmart();
    } catch (error) {
        console.error("Fetch error:", error);
        updateStatus(false);
    }
}

function updateStatus(isOnline) {
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('last-update');
    text.textContent = isOnline ? `Updated: ${new Date().toLocaleTimeString()}` : 'Connection Error';
    indicator.className = `indicator ${isOnline ? 'active' : ''}`;
}

// --- RENDERING ---
function renderTableSmart() {
    if (!tbody) return;

    // Filter
    const filtered = rawData.filter(item => {
        if (currentFilter.search && !item.symbol.includes(currentFilter.search)) return false;
        if (currentFilter.onlyFavorites && !favorites.includes(item.symbol)) return false;
        // Filter by opportunity existence if Exchange filter is active?
        // or just show if that exchange has data.
        return true;
    });

    // Sort by Real Spread Descending
    filtered.sort((a, b) => (b.realSpread || -999) - (a.realSpread || -999));

    if (tbody.children.length === 0 || tbody.children[0].innerText.includes("No pairs")) {
        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;">No pairs found.</td></tr>';
            return;
        }
    }

    // Map current DOM rows
    const existingRows = Array.from(tbody.querySelectorAll('tr[data-symbol]'));
    existingRows.forEach(row => {
        const sym = row.dataset.symbol;
        if (!filtered.find(f => f.symbol === sym)) {
            row.remove();
            const detail = document.getElementById(`detail-${sym}`);
            if (detail) detail.remove();
        }
    });

    filtered.forEach((item, index) => {
        let tr = tbody.querySelector(`tr[data-symbol="${item.symbol}"]`);
        const isFav = favorites.includes(item.symbol);
        const favClass = isFav ? 'active' : '';

        // Format helpers
        const fmtPrice = (p) => p > 0 ? (p < 5 ? p.toPrecision(5) : p.toFixed(2)) : '-';
        const hasVest = item.vest && item.vest.bid > 0;
        const hasLighter = item.lighter && item.lighter.bid > 0;
        const hasParadex = item.paradex && item.paradex.bid > 0;

        const vestCell = hasVest ? `${fmtPrice(item.vest.bid)} / ${fmtPrice(item.vest.ask)}` : '<span class="dim">N/A</span>';
        const lighterCell = hasLighter ? `${fmtPrice(item.lighter.bid)} / ${fmtPrice(item.lighter.ask)}` : '<span class="dim">N/A</span>';
        const paradexCell = hasParadex ? `${fmtPrice(item.paradex.bid)} / ${fmtPrice(item.paradex.ask)}` : '<span class="dim">N/A</span>';

        // Spread Color
        let spreadClass = 'spread-negative';
        let spreadLabel = '🔴';
        if (item.realSpread > 0.2) { spreadClass = 'spread-positive'; spreadLabel = '🟢'; }
        else if (item.realSpread >= 0) { spreadClass = 'spread-marginal'; spreadLabel = '🟡'; }

        // Strategy Text
        let strategyHTML = '<span class="dim">-</span>';
        if (item.realSpread > -10 && item.bestBidEx && item.bestAskEx && item.bestBidEx !== item.bestAskEx) {
            strategyHTML = `<div class="strat-box">
                <div class="strat-buy">BUY ${item.bestAskEx} @ ${fmtPrice(item.bestAsk)}</div>
                <div class="strat-sell">SELL ${item.bestBidEx} @ ${fmtPrice(item.bestBid)}</div>
             </div>`;
        }

        const profitVal = item.potentialProfit || 0;
        const profitClass = profitVal > 0 ? 'profit-pos' : 'profit-neg';

        const htmlContent = `
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                     <strong>${item.symbol}</strong>
                </div>
            </td>
            <td class="price-cell">${vestCell}</td>
            <td class="price-cell">${lighterCell}</td>
            <td class="price-cell">${paradexCell}</td>
            <td class="spread ${spreadClass}">
                <div class="spread-val">${item.realSpread > -900 ? item.realSpread.toFixed(2) + '%' : '-'} ${spreadLabel}</div>
            </td>
            <td class="strategy-cell">${strategyHTML}</td>
            <td class="${profitClass}">$${profitVal.toFixed(2)}</td>
            <td>
                <i data-lucide="star" class="fav-btn ${favClass}" onclick="toggleFav('${item.symbol}')"></i>
            </td>
        `;

        if (tr) {
            if (tr.innerHTML !== htmlContent) tr.innerHTML = htmlContent;
            tbody.appendChild(tr); // Re-order
            const detailRow = document.getElementById(`detail-${item.symbol}`);
            if (detailRow) tbody.appendChild(detailRow);
        } else {
            tr = document.createElement('tr');
            tr.dataset.symbol = item.symbol;
            tr.className = 'main-row';
            tr.onclick = (e) => {
                if (e.target.closest('.fav-btn')) return;
                toggleRow(item.symbol);
            };
            tr.innerHTML = htmlContent;
            tbody.appendChild(tr);
        }
    });

    if (window.lucide) lucide.createIcons();
}

// --- ACCORDION LOGIC ---
function closeAccordion() {
    if (expandedSymbol) {
        // Cleanup
        stopChartTimer();
        const detail = document.getElementById(`detail-${expandedSymbol}`);
        if (detail) detail.remove();
        expandedSymbol = null;
    }
}

function toggleRow(symbol) {
    if (expandedSymbol === symbol) {
        closeAccordion();
    } else {
        if (expandedSymbol) closeAccordion(); // Close prev
        expandedSymbol = symbol;

        // Find parent row
        const parentRow = tbody.querySelector(`tr[data-symbol="${symbol}"]`);
        if (!parentRow) return;

        // Insert Detail Row
        const trDetail = document.createElement('tr');
        trDetail.id = `detail-${symbol}`;
        trDetail.className = 'expanded-row';
        trDetail.innerHTML = `
            <td colspan="6" style="padding:0; border:none;">
                <div class="expanded-row-content" id="expanded-content-${symbol}">
                    <div style="display:flex; justify-content:center; padding:20px;">Loading data...</div>
                </div>
            </td>
        `;

        // Insert AFTER parent
        parentRow.insertAdjacentElement('afterend', trDetail);

        // Mount
        const item = rawData.find(i => i.symbol === symbol);
        setTimeout(() => mountExpandedView(item), 0);
    }
}

async function mountExpandedView(item) {
    const container = document.getElementById(`expanded-content-${item.symbol}`);
    if (!container) return;

    // Fetch History
    try {
        const res = await fetch(`${HISTORY_URL}?symbol=${item.symbol}&period=${currentPeriod}`);
        const json = await res.json();
        const history = json.history || [];

        renderAccordionContent(container, item, history);
        startChartTimer(); // Start 60s timer + countdown
    } catch (e) {
        container.innerHTML = `<div style="color:red; text-align:center;">Error loading history: ${e.message}</div>`;
    }
}

function renderAccordionContent(container, item, history) {
    // Stats & Strategy Calc (Same as before)
    const spreads = history.map(h => h.spread);
    const avg = spreads.reduce((a, b) => a + b, 0) / (spreads.length || 1);
    const min = spreads.length ? Math.min(...spreads) : 0;
    const max = spreads.length ? Math.max(...spreads) : 0;

    const sorted = [...spreads].sort((a, b) => a - b);
    let rank = 0; const currentSpread = item.spread || 0;
    for (let s of sorted) { if (s < currentSpread) rank++; }
    const percentile = spreads.length ? Math.round((rank / spreads.length) * 100) : 0;

    const prices = { Paradex: item.paradex, Vest: item.vest, Lighter: item.lighter };
    const validP = Object.entries(prices).filter(([k, v]) => v > 0);
    validP.sort((a, b) => b[1] - a[1]);
    const longEx = validP.length >= 2 ? validP[validP.length - 1] : ['N/A', 0];
    const shortEx = validP.length >= 2 ? validP[0] : ['N/A', 0];

    const units = longEx[1] > 0 ? 1000 / longEx[1] : 0;
    const netProfit = (item.spread * units) - (1000 * 0.002);

    // HTML with Controls
    container.innerHTML = `
        <div class="expanded-header">
            <div class="chart-title-group">
                <h3>${item.symbol} SPREAD Analysis</h3>
                <!-- Controls -->
                <div class="chart-controls">
                    <button class="refresh-btn" onclick="manualChartRefresh()" title="Refresh Chart">
                        <i data-lucide="refresh-cw"></i>
                    </button>
                    
                    <div class="control-group">
                        <label class="switch">
                          <input type="checkbox" id="auto-refresh-toggle" ${isAutoRefresh ? 'checked' : ''} onchange="toggleAutoRefresh(this.checked)">
                          <span class="slider"></span>
                        </label>
                        <span>Auto-refresh (1m)</span>
                    </div>

                    <span id="countdown-display" class="countdown-text" style="display:${isAutoRefresh ? 'inline' : 'none'}">
                        60s
                    </span>
                </div>
            </div>
            
            <div class="period-selector">
                ${['24H', '7D', '30D', 'ALL'].map(p =>
        `<button class="period-btn ${currentPeriod === p ? 'active' : ''}" onclick="changePeriod('${p}')">${p}</button>`
    ).join('')}
                <button class="close-chart" onclick="toggleRow('${item.symbol}')" style="margin-left:10px;">×</button>
            </div>
        </div>

        <div class="stats-bar">
             <div class="stat-item"><span class="stat-label">Current</span><span class="stat-value green">${item.spreadPct ? item.spreadPct.toFixed(3) : 0}%</span></div>
             <div class="stat-item"><span class="stat-label">Avg (${currentPeriod})</span><span class="stat-value">${((avg / (item.vest || 1)) * 100).toFixed(3)}%</span></div>
             <div class="stat-item"><span class="stat-label">Min</span><span class="stat-value red">${((min / (item.vest || 1)) * 100).toFixed(3)}%</span></div>
             <div class="stat-item"><span class="stat-label">Max</span><span class="stat-value green">${((max / (item.vest || 1)) * 100).toFixed(3)}%</span></div>
             <div class="stat-item"><span class="stat-label">Percentile</span><span class="stat-value">${percentile}%</span></div>
        </div>

        <div class="expanded-grid">
            <div class="strategy-card ${netProfit > 0 ? 'green-bg' : 'red-bg'}">
                <div class="strategy-row" style="color:#00e676"><i data-lucide="arrow-up-circle"></i> LONG ${longEx[0].toUpperCase()}</div>
                <div class="strategy-row" style="color:#ff5252"><i data-lucide="arrow-down-circle"></i> SHORT ${shortEx[0].toUpperCase()}</div>
                <div class="strategy-potential">
                    <span class="pot-label">Potential Profit (1k$)</span>
                    <span class="pot-value">$${netProfit > 0 ? netProfit.toFixed(2) : '0.00'}</span>
                    <div style="font-size:0.75rem; color:#888; margin-top:5px;">Incl. est. fees (0.2%)</div>
                </div>
            </div>
            <div class="accordion-chart-wrapper">
                <canvas id="chart-${item.symbol}"></canvas>
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
    drawAccordionChart(`chart-${item.symbol}`, history);
}

function drawAccordionChart(canvasId, history) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = history.map(h => new Date(h.timestamp).toLocaleString());
    const dataPoints = history.map(h => h.spread);
    const avg = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;
    const avgLine = new Array(dataPoints.length).fill(avg);

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Spread ($)',
                    data: dataPoints,
                    borderColor: '#3d5afe',
                    backgroundColor: 'rgba(61, 90, 254, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: 'Average',
                    data: avgLine,
                    borderColor: '#888',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, // Simplified opts
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
            scales: { x: { display: false }, y: { grid: { color: '#2a2d35' }, ticks: { color: '#888' } } }
        }
    });
}

// --- TIMER LOGIC ---
window.toggleAutoRefresh = (checked) => {
    isAutoRefresh = checked;
    const display = document.getElementById('countdown-display');
    if (display) display.style.display = checked ? 'inline' : 'none';

    if (checked) {
        startChartTimer();
    } else {
        stopChartTimer();
    }
};

window.manualChartRefresh = () => {
    updateChartData();
};

function startChartTimer() {
    stopChartTimer(); // clear existing
    if (!isAutoRefresh) return;

    nextUpdateTimestamp = Date.now() + CHART_REFRESH_INTERVAL;

    // Countdown Interval (1s)
    countdownTimer = setInterval(() => {
        const left = Math.ceil((nextUpdateTimestamp - Date.now()) / 1000);
        const display = document.getElementById('countdown-display');
        if (display) display.innerText = `${left}s`;

        if (left <= 0) {
            // Trigger update logic handled by chartTimer? 
            // Better to handle it here to stay in sync
        }
    }, 1000);

    // Fetch Interval (60s)
    chartTimer = setInterval(() => {
        updateChartData();
        nextUpdateTimestamp = Date.now() + CHART_REFRESH_INTERVAL;
    }, CHART_REFRESH_INTERVAL);
}

function stopChartTimer() {
    if (chartTimer) clearInterval(chartTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    chartTimer = null;
    countdownTimer = null;
}

async function updateChartData() {
    if (!expandedSymbol || !myChart) return;

    // Add loading indicator to button (rotate icon)
    const btnIcon = document.querySelector('.refresh-btn i');
    if (btnIcon) btnIcon.style.animation = 'spin 1s infinite linear';

    try {
        // Fetch last point (simplification: fetch small history)
        const res = await fetch(`${HISTORY_URL}?symbol=${expandedSymbol}&period=1H`); // Fetch just last hour
        const json = await res.json();
        const history = json.history || [];

        if (history.length > 0) {
            // Update Chart Data
            const labels = history.map(h => new Date(h.timestamp).toLocaleString());
            const dataPoints = history.map(h => h.spread);

            myChart.data.labels = labels;
            myChart.data.datasets[0].data = dataPoints;
            // Update Avg
            const avg = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;
            myChart.data.datasets[1].data = new Array(dataPoints.length).fill(avg);

            myChart.update('none'); // Update without full animation
        }
    } catch (e) {
        console.error("Chart auto-update error", e);
    } finally {
        if (btnIcon) btnIcon.style.animation = 'none';
        // Reset countdown visual immediately
        const display = document.getElementById('countdown-display');
        if (display) display.innerText = '60s';
    }
}

// Global actions
window.toggleFav = (symbol) => {
    if (favorites.includes(symbol)) {
        favorites = favorites.filter(s => s !== symbol);
    } else {
        favorites.push(symbol);
    }
    localStorage.setItem('arbi_favorites', JSON.stringify(favorites));
    renderTableSmart();
};

window.changePeriod = (p) => {
    currentPeriod = p;
    if (expandedSymbol) {
        const item = rawData.find(i => i.symbol === expandedSymbol);
        mountExpandedView(item); // Full rebuild
    }
};

init();

// Add spin keyframes dynamically
const style = document.createElement('style');
style.innerHTML = ` @keyframes spin { 100% { transform: rotate(360deg); } } `;
document.head.appendChild(style);
