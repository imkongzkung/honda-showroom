// Authentication and Bookings Dashboard script for Honda Showroom
// Enables user login, registration, and displays booking tickets from database

document.addEventListener('DOMContentLoaded', () => {
  injectAuthStyles();
  injectAuthModals();
  initAuthNavbar();
  prefillBookingForm();
});

// Get logged in user from localStorage
function getLoggedInUser() {
  const userJson = localStorage.getItem('honda_user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

// Save user session
function setLoggedInUser(user) {
  if (user) {
    localStorage.setItem('honda_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('honda_user');
  }
}

// Prefill detail.html booking form if logged in
function prefillBookingForm() {
  const user = getLoggedInUser();
  if (user) {
    const nameInput = document.getElementById('td-name');
    const phoneInput = document.getElementById('td-phone');
    if (nameInput) nameInput.value = user.fullname;
    if (phoneInput) phoneInput.value = user.phone;
  }
}

// Inject Modal Styles Dynamically into the page head
function injectAuthStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    /* Auth Modal Tabs styling */
    .auth-tabs {
      display: flex;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 20px;
    }
    .auth-tab {
      flex: 1;
      padding: 12px;
      text-align: center;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-family: var(--font-display);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      border-bottom: 2px solid transparent;
    }
    .auth-tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .auth-form-group {
      margin-bottom: 16px;
    }
    .auth-form-group label {
      display: block;
      font-size: 13px;
      color: var(--text-light);
      margin-bottom: 6px;
    }
    .auth-form-group input {
      width: 100%;
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      color: #fff;
      font-family: var(--font-body);
      font-size: 14px;
      transition: var(--transition);
    }
    .auth-form-group input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 8px rgba(204, 0, 0, 0.2);
    }
    
    /* User Dropdown Menu */
    .user-menu-btn {
      position: relative;
    }
    .user-dropdown-content {
      display: none;
      position: absolute;
      right: 0;
      top: 100%;
      background: var(--bg-card-solid);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      min-width: 180px;
      z-index: 1051;
      box-shadow: var(--shadow-lg);
      margin-top: 8px;
    }
    .user-dropdown-content.active {
      display: block;
    }
    .user-dropdown-content a {
      display: block;
      padding: 12px 16px;
      color: var(--text-light);
      text-decoration: none;
      font-size: 13px;
      border-bottom: 1px solid var(--border-color);
      transition: var(--transition);
    }
    .user-dropdown-content a:hover {
      background: rgba(255, 255, 255, 0.02);
      color: #fff;
    }
    .user-dropdown-content a:last-child {
      border-bottom: none;
      color: var(--primary);
    }
    .user-dropdown-content a:last-child:hover {
      background: rgba(204, 0, 0, 0.05);
      color: var(--primary-hover);
    }

    /* Bookings Tickets List layout */
    .bookings-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 8px;
    }
    .booking-ticket-card {
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 16px;
      transition: var(--transition);
      cursor: pointer;
    }
    .booking-ticket-card:hover {
      border-color: var(--primary);
      box-shadow: 0 0 10px rgba(204, 0, 0, 0.15);
    }
    .ticket-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      border-bottom: 1px dashed var(--border-color);
      padding-bottom: 8px;
    }
    .ticket-card-title {
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    .ticket-card-id {
      font-size: 11px;
      color: var(--text-muted);
      background: rgba(255,255,255,0.04);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .ticket-card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 12px;
      color: var(--text-light);
    }
    .ticket-card-grid div span {
      color: var(--text-muted);
      display: block;
      font-size: 10px;
      text-transform: uppercase;
    }
    .ticket-card-status {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-pending {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .status-confirmed {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
  `;
  document.head.appendChild(style);
}

// Inject Login/Register and Bookings Modals HTML to the document body
function injectAuthModals() {
  // 1. Auth Modal (Login/Register)
  const authModal = document.createElement('div');
  authModal.id = 'auth-modal';
  authModal.className = 'modal';
  authModal.innerHTML = `
    <div class="modal-overlay" onclick="closeAuthModal()"></div>
    <div class="modal-container" style="max-width: 420px;">
      <div class="modal-header" style="margin-bottom: 10px;">
        <h3 class="modal-title">🔐 เข้าใช้งานระบบสมาชิก</h3>
        <button class="modal-close-btn" onclick="closeAuthModal()">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="auth-tabs">
        <button class="auth-tab active" id="tab-login" onclick="switchAuthTab('login')">เข้าสู่ระบบ</button>
        <button class="auth-tab" id="tab-register" onclick="switchAuthTab('register')">สมัครสมาชิก</button>
      </div>

      <!-- LOGIN FORM -->
      <form id="form-login" onsubmit="handleLoginSubmit(event)">
        <div class="auth-form-group">
          <label>ชื่อผู้ใช้งาน (Username)</label>
          <input type="text" id="login-username" required placeholder="กรอกชื่อผู้ใช้ของคุณ">
        </div>
        <div class="auth-form-group">
          <label>รหัสผ่าน (Password)</label>
          <input type="password" id="login-password" required placeholder="กรอกรหัสผ่าน">
        </div>
        <div id="login-error-msg" style="color: var(--primary); font-size:12px; margin-bottom:12px; display:none;"></div>
        <button type="submit" class="btn btn-primary" style="width:100%; padding: 12px; font-weight:700;">เข้าสู่ระบบ</button>
      </form>

      <!-- REGISTER FORM -->
      <form id="form-register" onsubmit="handleRegisterSubmit(event)" style="display:none;">
        <div class="auth-form-group">
          <label>ชื่อผู้ใช้งาน (Username)</label>
          <input type="text" id="reg-username" required placeholder="ใช้ในการเข้าสู่ระบบ">
        </div>
        <div class="auth-form-group">
          <label>รหัสผ่าน (Password)</label>
          <input type="password" id="reg-password" required placeholder="ขั้นต่ำ 6 ตัวอักษร">
        </div>
        <div class="auth-form-group">
          <label>ชื่อ-นามสกุลจริง</label>
          <input type="text" id="reg-fullname" required placeholder="เพื่อใช้ในการจองทดลองขับ">
        </div>
        <div class="auth-form-group">
          <label>เบอร์โทรศัพท์มือถือ</label>
          <input type="tel" id="reg-phone" maxlength="10" required placeholder="กรอกเบอร์โทรศัพท์">
        </div>
        <div class="auth-form-group">
          <label>อีเมล (ไม่บังคับ)</label>
          <input type="email" id="reg-email" placeholder="example@email.com">
        </div>
        <div id="reg-error-msg" style="color: var(--primary); font-size:12px; margin-bottom:12px; display:none;"></div>
        <button type="submit" class="btn btn-primary" style="width:100%; padding: 12px; font-weight:700;">ลงทะเบียนสมัครสมาชิก</button>
      </form>
    </div>
  `;
  document.body.appendChild(authModal);

  // 2. My Bookings Modal (Ticket Lists Dashboard)
  const bookingsModal = document.createElement('div');
  bookingsModal.id = 'my-bookings-modal';
  bookingsModal.className = 'modal';
  bookingsModal.innerHTML = `
    <div class="modal-overlay" onclick="closeMyBookingsModal()"></div>
    <div class="modal-container" style="max-width: 580px;">
      <div class="modal-header">
        <h3 class="modal-title">🎫 คิวการจองทดลองขับของฉัน</h3>
        <button class="modal-close-btn" onclick="closeMyBookingsModal()">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="modal-body" style="padding-top: 10px;">
        <div id="bookings-loading" style="text-align:center; color:var(--text-muted); padding:30px 0;">
          กำลังโหลดประวัติการจองของคุณ...
        </div>
        <div id="bookings-empty-msg" style="text-align:center; color:var(--text-muted); padding:30px 0; display:none;">
          ยังไม่มีประวัติการจองทดลองขับในระบบสมาชิกของคุณ
        </div>
        <div class="bookings-list" id="bookings-container" style="display:none;">
          <!-- Loaded dynamically -->
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(bookingsModal);

  // 3. Success/View Ticket Modal
  const ticketModal = document.createElement('div');
  ticketModal.id = 'success-ticket-modal';
  ticketModal.className = 'modal';
  ticketModal.innerHTML = `
    <div class="modal-overlay" onclick="closeSuccessTicketModal()"></div>
    <div class="modal-container" style="max-width: 520px; padding: 20px;">
      <div class="modal-header" style="margin-bottom: 15px;">
        <h3 class="modal-title" style="color: #10b981;">🎫 รายละเอียดตั๋วการจองสิทธิ์</h3>
        <button class="modal-close-btn" onclick="closeSuccessTicketModal()">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="modal-body" id="success-ticket-body" style="margin-bottom: 15px;">
        <!-- Rendered dynamically -->
      </div>
      <div class="modal-footer" style="gap: 12px;">
        <button class="btn btn-secondary" onclick="closeSuccessTicketModal()">ปิด</button>
        <button class="btn btn-primary" onclick="window.print()" style="flex-grow:1;">พิมพ์ใบจองสิทธิ์</button>
      </div>
    </div>
  `;
  document.body.appendChild(ticketModal);
}

// Switch between Login and Register tabs inside Modal
window.switchAuthTab = function(tabName) {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  
  if (tabName === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
  } else {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    formLogin.style.display = 'none';
    formRegister.style.display = 'block';
  }
};

// Open / Close functions for Auth Modal
window.openAuthModal = function() {
  document.getElementById('auth-modal').classList.add('active');
  switchAuthTab('login');
  document.getElementById('login-error-msg').style.display = 'none';
  document.getElementById('reg-error-msg').style.display = 'none';
};

window.closeAuthModal = function() {
  document.getElementById('auth-modal').classList.remove('active');
};

// Handle Registration form submission
async function handleRegisterSubmit(e) {
  e.preventDefault();
  
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const fullname = document.getElementById('reg-fullname').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const errorMsg = document.getElementById('reg-error-msg');
  
  if (password.length < 6) {
    errorMsg.textContent = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, fullname, phone, email })
    });
    
    const result = await res.json();
    if (res.ok) {
      alert('สมัครสมาชิกสำเร็จเรียบร้อย! กรุณาเข้าสู่ระบบครับ');
      switchAuthTab('login');
    } else {
      errorMsg.textContent = result.error || 'การสมัครสมาชิกผิดพลาด';
      errorMsg.style.display = 'block';
    }
  } catch (error) {
    console.error('Register error:', error);
    errorMsg.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
    errorMsg.style.display = 'block';
  }
}

// Handle Login form submission
async function handleLoginSubmit(e) {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorMsg = document.getElementById('login-error-msg');
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const result = await res.json();
    if (res.ok && result.user) {
      setLoggedInUser(result.user);
      closeAuthModal();
      initAuthNavbar();
      prefillBookingForm();
      
      // Reload currentCar details dynamically to sync down calculations/booking status
      if (typeof loadCarDetails === 'function') {
        loadCarDetails();
      }
    } else {
      errorMsg.textContent = result.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      errorMsg.style.display = 'block';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMsg.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
    errorMsg.style.display = 'block';
  }
}

// Handle Logout
window.handleLogout = function() {
  setLoggedInUser(null);
  window.location.reload();
};

// Navbar logic integration
function initAuthNavbar() {
  const btnContainer = document.querySelector('.nav-btn-container');
  if (!btnContainer) return;

  // Clear previous wrapper if exists
  const oldWrapper = document.getElementById('auth-nav-wrapper');
  if (oldWrapper) oldWrapper.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'auth-nav-wrapper';
  wrapper.style.display = 'inline-block';
  wrapper.style.marginLeft = '12px';

  const user = getLoggedInUser();
  if (user) {
    // Logged In navbar look
    wrapper.innerHTML = `
      <div style="position: relative; display: inline-block;">
        <button class="btn btn-secondary" onclick="toggleUserDropdown()" style="display: flex; align-items: center; gap: 8px;">
          👤 ${user.fullname} ▾
        </button>
        <div id="user-dropdown-menu" class="user-dropdown-content">
          <a href="#" onclick="openMyBookingsModal(); return false;">🎫 คิวการจองของฉัน</a>
          <a href="#" onclick="handleLogout(); return false;">🚪 ออกจากระบบ</a>
        </div>
      </div>
    `;
  } else {
    // Logged Out navbar look
    wrapper.innerHTML = `
      <button class="btn btn-primary" onclick="openAuthModal()" style="display: flex; align-items: center; gap: 8px;">
        👤 เข้าสู่ระบบ
      </button>
    `;
  }

  btnContainer.appendChild(wrapper);
}

// User Menu Toggle Dropdown
window.toggleUserDropdown = function() {
  const dropdown = document.getElementById('user-dropdown-menu');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
};

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
  const wrapper = document.getElementById('auth-nav-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown) dropdown.classList.remove('active');
  }
});

// Open / Close Bookings List Modal
window.openMyBookingsModal = function() {
  const dropdown = document.getElementById('user-dropdown-menu');
  if (dropdown) dropdown.classList.remove('active');

  document.getElementById('my-bookings-modal').classList.add('active');
  loadMyBookings();
};

window.closeMyBookingsModal = function() {
  document.getElementById('my-bookings-modal').classList.remove('active');
};

// Fetch bookings from database and render
async function loadMyBookings() {
  const user = getLoggedInUser();
  if (!user) return;

  const loading = document.getElementById('bookings-loading');
  const emptyMsg = document.getElementById('bookings-empty-msg');
  const container = document.getElementById('bookings-container');

  loading.style.display = 'block';
  emptyMsg.style.display = 'none';
  container.style.display = 'none';

  try {
    const res = await fetch(`/api/my-bookings?user_id=${user.id}`);
    if (res.ok) {
      const bookings = await res.json();
      loading.style.display = 'none';

      if (!bookings || bookings.length === 0) {
        emptyMsg.style.display = 'block';
        return;
      }

      container.innerHTML = '';
      bookings.forEach(booking => {
        const statusClass = booking.status === 'confirmed' ? 'status-confirmed' : 'status-pending';
        const statusText = booking.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอการติดต่อกลับ';
        
        const card = document.createElement('div');
        card.className = 'booking-ticket-card';
        card.onclick = () => {
          closeMyBookingsModal();
          renderSuccessTicket(booking, false);
        };

        card.innerHTML = `
          <div class="ticket-card-header">
            <span class="ticket-card-title">${booking.car_name}</span>
            <span class="ticket-card-id">${booking.booking_id}</span>
          </div>
          <div class="ticket-card-grid">
            <div>
              <span>โชว์รูมสาขา</span>
              <strong>${booking.dealer}</strong>
            </div>
            <div>
              <span>วัน / เวลา นัดหมาย</span>
              <strong>${booking.date_string} @ ${booking.time_slot} น.</strong>
            </div>
            <div>
              <span>สีภายนอกรถ</span>
              <strong style="display:flex; align-items:center; gap:6px;">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${booking.color_code}; border:1px solid #444;"></span>
                สี${booking.color_name}
              </strong>
            </div>
            <div>
              <span>สถานะการจอง</span>
              <strong class="ticket-card-status ${statusClass}" style="display:inline-block; margin-top:2px;">${statusText}</strong>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '15px';
    } else {
      loading.textContent = 'ไม่สามารถดึงข้อมูลประวัติการจองได้';
    }
  } catch (error) {
    console.error('Fetch bookings error:', error);
    loading.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย';
  }
}

// Global state to track if we just completed booking
window.isBookingFlow = false;

window.closeSuccessTicketModal = function() {
  const modal = document.getElementById('success-ticket-modal');
  if (modal) modal.classList.remove('active');
  if (window.isBookingFlow) {
    window.location.href = 'index.html';
  }
};

window.renderSuccessTicket = function(booking, isBookingFlow = false) {
  window.isBookingFlow = isBookingFlow;
  
  const ticketBody = document.getElementById('success-ticket-body');
  if (!ticketBody) return;

  // Find car in database for image URL
  let carImg = '';
  if (window.CAR_DATABASE) {
    const dbCar = window.CAR_DATABASE.find(c => c.id == booking.car_id);
    if (dbCar) {
      carImg = dbCar.colors && dbCar.colors.length > 0 ? dbCar.colors[0].image_url : dbCar.image_url;
    }
  }
  
  if (!carImg) {
    carImg = 'https://honda-peringgit.com.my/wp-content/uploads/2023/08/honda-city-2023-Platinum-White-Pearl.png'; // default fallback
  }

  const bId = booking.id || booking.booking_id;

  ticketBody.innerHTML = `
    <div class="ticket-wrapper" style="box-shadow: none; border-color: rgba(255,255,255,0.06); max-width: 100%;">
      <div class="ticket-header" style="background: #11141b;">
        <div class="ticket-brand">
          <div class="ticket-brand-logo">HONDA<span>TEST DRIVE</span></div>
          <div class="ticket-id">${bId}</div>
        </div>
        <div class="ticket-car-details">
          <img src="${carImg}" class="ticket-car-img" alt="${booking.car_name}">
          <div class="ticket-car-info">
            <h4>${booking.car_name}</h4>
            <div class="ticket-color-badge">
              <span class="ticket-color-circle" style="background-color: ${booking.color_code};"></span>
              สี${booking.color_name}
            </div>
          </div>
        </div>
      </div>
      <div class="ticket-body">
        <div class="ticket-grid">
          <div class="ticket-field">
            <span class="ticket-field-label">ผู้จองทดลองขับ</span>
            <span class="ticket-field-value">${booking.fullname}</span>
          </div>
          <div class="ticket-field">
            <span class="ticket-field-label">เบอร์โทรศัพท์</span>
            <span class="ticket-field-value">${booking.phone}</span>
          </div>
          <div class="ticket-field">
            <span class="ticket-field-label">วันที่จอง</span>
            <span class="ticket-field-value highlight">${booking.date_string}</span>
          </div>
          <div class="ticket-field">
            <span class="ticket-field-label">เวลาทดลองขับ</span>
            <span class="ticket-field-value highlight">${booking.time_slot} น.</span>
          </div>
          <div class="ticket-field" style="grid-column: span 2;">
            <span class="ticket-field-label">โชว์รูม / ผู้จำหน่าย</span>
            <span class="ticket-field-value">${booking.dealer}</span>
          </div>
        </div>
        
        <div class="ticket-notes">
          <h5>คำแนะนำในการเข้ารับบริการ:</h5>
          <ul>
            <li>กรุณาเดินทางมาก่อนเวลานัดหมายอย่างน้อย 15 นาที</li>
            <li>แสดงใบขับขี่ที่ยังไม่หมดอายุต่อเจ้าหน้าที่ประจำสาขา</li>
            <li>กรุณาสวมใส่หน้ากากอนามัยและรักษาระยะห่างตามความเหมาะสม</li>
          </ul>
        </div>
        
        <div class="ticket-barcode-section">
          <div class="ticket-barcode"></div>
          <div class="ticket-barcode-num">${bId}</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('success-ticket-modal').classList.add('active');
};
