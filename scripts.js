lucide.createIcons();

const tradeListEl = document.getElementById('trade-list');
const adminTradeListEl = document.getElementById('admin-trade-list');
const postForm = document.getElementById('post-form');
const adminLoginForm = document.getElementById('admin-login-form');
const darkModeToggle = document.getElementById('dark-mode-toggle');

let trades = JSON.parse(localStorage.getItem('gagnex_trades') || '[]');
let isAdmin = false;

function saveTrades() {
  localStorage.setItem('gagnex_trades', JSON.stringify(trades));
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function(m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

function renderTrades() {
  tradeListEl.innerHTML = '';
  trades.forEach(trade => {
    const card = document.createElement('div');
    card.className = 'trade-card';

    const details = document.createElement('div');
    details.className = 'trade-details';
    details.innerHTML = `<h2>${escapeHtml(trade.title)}</h2>
                         <p><strong>Offer:</strong> ${escapeHtml(trade.offering)}</p>
                         <p><strong>Want:</strong> ${escapeHtml(trade.wanting)}</p>
                         <p><strong>Posted by:</strong> ${escapeHtml(trade.username)}</p>`;

    const actions = document.createElement('div');
    actions.className = 'trade-actions';

    const chatBtn = document.createElement('button');
    chatBtn.innerHTML = '<i data-lucide="message-circle"></i> Chat';
    chatBtn.onclick = () => alert(`💬 Chat with ${trade.username} (feature coming soon!)`);
    actions.appendChild(chatBtn);

    card.appendChild(details);
    card.appendChild(actions);
    tradeListEl.appendChild(card);
  });

  lucide.createIcons();
}

function renderAdminTrades() {
  if (!isAdmin) return;
  adminTradeListEl.innerHTML = '';
  trades.forEach(trade => {
    const card = document.createElement('div');
    card.className = 'trade-card';

    const details = document.createElement('div');
    details.className = 'trade-details';
    details.innerHTML = `<h2>${escapeHtml(trade.title)}</h2>
                         <p><strong>Offer:</strong> ${escapeHtml(trade.offering)}</p>
                         <p><strong>Want:</strong> ${escapeHtml(trade.wanting)}</p>
                         <p><strong>Posted by:</strong> ${escapeHtml(trade.username)}</p>`;

    const actions = document.createElement('div');
    actions.className = 'trade-actions';

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i data-lucide="trash-2"></i> Delete';
    delBtn.style.backgroundColor = '#d32f2f';
    delBtn.onclick = () => {
      if (confirm('Delete this trade?')) {
        trades = trades.filter(t => t.id !== trade.id);
        saveTrades();
        renderTrades();
        renderAdminTrades();
      }
    };
    actions.appendChild(delBtn);

    card.appendChild(details);
    card.appendChild(actions);
    adminTradeListEl.appendChild(card);
  });
  lucide.createIcons();
}

postForm.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const offering = document.getElementById('offering').value.trim();
  const wanting = document.getElementById('wanting').value.trim();
  const username = document.getElementById('username').value.trim();

  if (!title || !offering || !wanting || !username) {
    alert('Please fill in all fields.');
    return;
  }

  trades.unshift({
    id: Date.now(),
    title,
    offering,
    wanting,
    username
  });

  saveTrades();
  renderTrades();
  postForm.reset();
  switchTab('trades');
});

adminLoginForm.addEventListener('submit', e => {
  e.preventDefault();
  const pwd = document.getElementById('admin-password').value;
  if (pwd === 'admin123') {
    isAdmin = true;
    alert('Admin login successful!');
    adminLoginForm.style.display = 'none';
    document.getElementById('admin-controls').style.display = 'block';
    renderAdminTrades();
  } else {
    alert('Wrong password!');
  }
});

function switchTab(id) {
  document.querySelectorAll('.tab-section').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

darkModeToggle.onclick = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('gagnex_dark_mode', document.body.classList.contains('dark'));
};

window.onload = () => {
  if (localStorage.getItem('gagnex_dark_mode') === 'true') {
    document.body.classList.add('dark');
  }
  renderTrades();
};
