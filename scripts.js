lucide.createIcons();

const tradeListEl = document.getElementById('trade-list');
const adminTradeListEl = document.getElementById('admin-trade-list');
const postForm = document.getElementById('post-form');
const adminLoginForm = document.getElementById('admin-login-form');
const darkModeToggle = document.getElementById('dark-mode-toggle');

let trades = JSON.parse(localStorage.getItem('gagnex_trades') || '[]');
let isAdmin = false;

// Tracks open chats keyed by username
const openChats = new Map();

/**
 * Saves trades array to localStorage
 */
function saveTrades() {
  localStorage.setItem('gagnex_trades', JSON.stringify(trades));
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

/**
 * Renders the list of trades in trades tab
 */
function renderTrades() {
  tradeListEl.innerHTML = '';
  trades.forEach(trade => {
    const card = document.createElement('div');
    card.className = 'trade-card';

    const details = document.createElement('div');
    details.className = 'trade-details';
    details.innerHTML = `
      <h2>${escapeHtml(trade.title)}</h2>
      <p><strong>Offer:</strong> ${escapeHtml(trade.offering)}</p>
      <p><strong>Want:</strong> ${escapeHtml(trade.wanting)}</p>
      <p><strong>Posted by:</strong> ${escapeHtml(trade.username)}</p>
    `;

    const actions = document.createElement('div');
    actions.className = 'trade-actions';

    const chatBtn = document.createElement('button');
    chatBtn.innerHTML = '<i data-lucide="message-circle"></i> Chat';
    chatBtn.onclick = () => openChat(trade.username);
    actions.appendChild(chatBtn);

    card.appendChild(details);
    card.appendChild(actions);
    tradeListEl.appendChild(card);
  });
  lucide.createIcons();
}

/**
 * Renders trades in admin panel with delete buttons
 */
function renderAdminTrades() {
  if (!isAdmin) return;
  adminTradeListEl.innerHTML = '';
  trades.forEach(trade => {
    const card = document.createElement('div');
    card.className = 'trade-card';

    const details = document.createElement('div');
    details.className = 'trade-details';
    details.innerHTML = `
      <h2>${escapeHtml(trade.title)}</h2>
      <p><strong>Offer:</strong> ${escapeHtml(trade.offering)}</p>
      <p><strong>Want:</strong> ${escapeHtml(trade.wanting)}</p>
      <p><strong>Posted by:</strong> ${escapeHtml(trade.username)}</p>
    `;

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

/**
 * Handles new trade post form submission
 */
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

/**
 * Admin login form handler
 */
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

/**
 * Switch visible tab by ID
 * @param {string} id
 */
function switchTab(id) {
  document.querySelectorAll('.tab-section').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

/**
 * ChatWindow Class to manage each chat UI instance
 */
class ChatWindow {
  constructor(username) {
    this.username = username;
    this.chatKey = `chat_with_${username}`;
    this.messages = JSON.parse(localStorage.getItem(this.chatKey) || '[]');
    this.init();
  }

  init() {
    this.createElements();
    this.loadMessages();
    this.attachEvents();
    this.renderMessages();
    document.body.appendChild(this.container);
    this.positionWindow();
  }

  createElements() {
    this.container = document.createElement('div');
    this.container.className = 'chat-window';
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '10px',
      width: '320px',
      height: '400px',
      background: 'var(--card-light)',
      border: '1px solid #ccc',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: '1000',
      userSelect: 'none',
      color: 'var(--text-light)'
    });

    // Header
    this.header = document.createElement('div');
    this.header.className = 'chat-header';
    Object.assign(this.header.style, {
      background: 'var(--primary)',
      color: 'white',
      padding: '0.5rem',
      fontWeight: 'bold',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'move'
    });
    this.header.textContent = `Chat with ${this.username}`;

    this.closeBtn = document.createElement('button');
    this.closeBtn.textContent = '✖';
    Object.assign(this.closeBtn.style, {
      background: 'transparent',
      border: 'none',
      color: 'white',
      fontSize: '1.2rem',
      cursor: 'pointer',
      padding: '0',
      margin: '0'
    });
    this.header.appendChild(this.closeBtn);

    this.container.appendChild(this.header);

    // Messages container
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'chat-messages';
    Object.assign(this.messagesContainer.style, {
      flex: '1',
      padding: '0.5rem',
      overflowY: 'auto',
      background: 'white',
      color: 'black'
    });
    this.container.appendChild(this.messagesContainer);

    // Input container
    this.inputContainer = document.createElement('div');
    Object.assign(this.inputContainer.style, {
      display: 'flex',
      padding: '0.5rem',
      borderTop: '1px solid #ccc',
      background: 'var(--card-light)'
    });

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Type a message...';
    Object.assign(this.input.style, {
      flex: '1',
      padding: '0.5rem',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontFamily: 'inherit'
    });

    this.sendBtn = document.createElement('button');
    this.sendBtn.textContent = 'Send';
    Object.assign(this.sendBtn.style, {
      marginLeft: '0.5rem',
      padding: '0.5rem 1rem',
      border: 'none',
      background: 'var(--primary)',
      color: 'white',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold'
    });

    this.inputContainer.appendChild(this.input);
    this.inputContainer.appendChild(this.sendBtn);
    this.container.appendChild(this.inputContainer);
  }

  loadMessages() {
    this.messages = JSON.parse(localStorage.getItem(this.chatKey) || '[]');
  }

  saveMessages() {
    localStorage.setItem(this.chatKey, JSON.stringify(this.messages));
  }

  renderMessages() {
    this.messagesContainer.innerHTML = '';
    this.messages.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.style.marginBottom = '0.5rem';
      msgDiv.style.padding = '0.3rem 0.5rem';
      msgDiv.style.borderRadius = '6px';
      msgDiv.style.maxWidth = '80%';
      msgDiv.style.wordWrap = 'break-word';
      msgDiv.style.whiteSpace = 'pre-wrap';
      if (msg.from === 'me') {
        msgDiv.style.backgroundColor = 'var(--primary)';
        msgDiv.style.color = 'white';
        msgDiv.style.marginLeft = 'auto';
      } else {
        msgDiv.style.backgroundColor = '#e0e0e0';
        msgDiv.style.color = '#333';
        msgDiv.style.marginRight = 'auto';
      }

      // Timestamp + text
      const timeSpan = document.createElement('span');
      timeSpan.style.fontSize = '0.7rem';
      timeSpan.style.opacity = '0.7';
      timeSpan.style.display = 'block';
      timeSpan.style.marginBottom = '0.2rem';
      timeSpan.textContent = new Date(msg.time).toLocaleTimeString();

      msgDiv.appendChild(timeSpan);
      msgDiv.appendChild(document.createTextNode(msg.text));

      this.messagesContainer.appendChild(msgDiv);
    });
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  attachEvents() {
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.closeBtn.addEventListener('click', () => this.closeChat());

    // Dragging logic
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;

    this.header.addEventListener('mousedown', e => {
      this.dragging = true;
      const rect = this.container.getBoundingClientRect();
      this.offsetX = e.clientX - rect.left;
      this.offsetY = e.clientY - rect.top;
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', e => {
      if (!this.dragging) return;
      let x = e.clientX - this.offsetX;
      let y = e.clientY - this.offsetY;
      // Boundaries
      const maxX = window.innerWidth - this.container.offsetWidth;
      const maxY = window.innerHeight - this.container.offsetHeight;
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x > maxX) x = maxX;
      if (y > maxY) y = maxY;

      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
      this.container.style.bottom = 'auto';
      this.container.style.right = 'auto';
      this.container.style.position = 'fixed';
    });

    window.addEventListener('mouseup', () => {
      if (this.dragging) {
        this.dragging = false;
        document.body.style.userSelect = '';
      }
    });
  }

  sendMessage() {
    const text = this.input.value.trim();
    if (!text) return;
    const msgObj = {
      from: 'me',
      text,
      time: Date.now()
    };
    this.messages.push(msgObj);
    this.saveMessages();
    this.renderMessages();
    this.input.value = '';

    // Simulate message arrival from the user (for demo you can remove this)
    setTimeout(() => {
      this.receiveMessage(`Hi! Got your message: "${text}"`);
    }, 1000);
  }

  receiveMessage(text) {
    const msgObj = {
      from: this.username,
      text,
      time: Date.now()
    };
    this.messages.push(msgObj);
    this.saveMessages();
    this.renderMessages();
  }

  closeChat() {
    this.container.remove();
    openChats.delete(this.username);
    repositionChats();
  }

  /**
   * Positions chat windows stacked horizontally at bottom right with 10px gap
   */
  positionWindow() {
    const baseRight = 10;
    const baseBottom = 10;
    const chatWidth = this.container.offsetWidth || 320;

    // Position based on current open chats order
    const keys = Array.from(openChats.keys());
    const idx = keys.indexOf(this.username);
    if (idx === -1) return;

    this.container.style.right = `${baseRight + idx * (chatWidth + 10)}px`;
    this.container.style.bottom = `${baseBottom}px`;
    this.container.style.position = 'fixed';
    this.container.style.left = 'auto';
    this.container.style.top = 'auto';
  }
}

/**
 * Opens a chat window with given username or focuses it if already open
 * @param {string} username
 */
function openChat(username) {
  if (openChats.has(username)) {
    // Focus existing window
    const chatWindow = openChats.get(username);
    chatWindow.container.style.zIndex = Date.now(); // Bring to front
    return;
  }

  const chatWindow = new ChatWindow(username);
  openChats.set(username, chatWindow);
  repositionChats();
}

/**
 * Repositions all open chat windows side by side
 */
function repositionChats() {
  let idx = 0;
  openChats.forEach(chatWindow => {
    const baseRight = 10;
    const chatWidth = chatWindow.container.offsetWidth || 320;
    chatWindow.container.style.right = `${baseRight + idx * (chatWidth + 10)}px`;
    chatWindow.container.style.bottom = `10px`;
    chatWindow.container.style.position = 'fixed';
    chatWindow.container.style.left = 'auto';
    chatWindow.container.style.top = 'auto';
    idx++;
  });
}

// Dark mode toggle
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
