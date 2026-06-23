// Main App Javascript for Honda Showroom Homepage with live Clever Cloud API fetch & fallback

let currentSlide = 0;
let slideInterval;

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initVisitorCounter();
  initBanners();
  initNews();
  loadData();
});

// Navbar sticky effect
function initNavbar() {
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Visitor Counter (Unique IP based)
async function initVisitorCounter() {
  const countEl = document.getElementById('visit-count');
  if (!countEl) return;
  
  try {
    const res = await fetch('/api/visit');
    if (res.ok) {
      const data = await res.json();
      if (data && data.visits) {
        countEl.textContent = data.visits.toLocaleString();
        return;
      }
    }
  } catch (error) {
    console.log('Unable to fetch live unique visitor count, falling back to local counter.', error);
  }

  // Fallback to local storage counter if offline/file://
  let visits = parseInt(localStorage.getItem('honda_total_visits') || '0');
  visits += 1;
  localStorage.setItem('honda_total_visits', visits);
  countEl.textContent = visits.toLocaleString();
}

// Banner slideshow logic
function initBanners() {
  const slider = document.getElementById('hero-slider');
  if (!slider) return;

  const banners = [
    {
      title: "Honda e:N1",
      subtitle: "ยนตรกรรมไฟฟ้า 100% ก้าวล้ำไปอีกขั้นกับขุมพลังสะอาดแห่งอนาคต",
      image: "assets/honda_en1.jpg"
    },
    {
      title: "Honda Civic Type R",
      subtitle: "ที่สุดแห่งความเร้าใจสายพันธุ์สปอร์ต ขุมพลัง VTEC Turbo 320 แรงม้า",
      image: "assets/civic_typer.jpg"
    },
    {
      title: "Honda e:HEV Family",
      subtitle: "เทคโนโลยีไฮบริดอัจฉริยะ e:HEV ขับเคลื่อนชีวิตด้วยพลังที่สมบูรณ์แบบ",
      image: "assets/crv.jpg"
    }
  ];

  slider.innerHTML = '';
  banners.forEach((banner, index) => {
    const slide = document.createElement('div');
    slide.className = `slide ${index === 0 ? 'active' : ''}`;
    slide.style.backgroundImage = `linear-gradient(to bottom, rgba(7, 9, 14, 0.4) 0%, rgba(7, 9, 14, 0.8) 100%), url('${banner.image}')`;
    slide.innerHTML = `
      <div class="slide-content">
        <h2 class="slide-title">${banner.title}</h2>
        <p class="slide-subtitle">${banner.subtitle}</p>
        <button class="btn btn-primary" onclick="navigateToBooking('${banner.title.includes('Type R') ? 10 : (banner.title.includes('e:N1') ? 7 : 3)}')">จองทดลองขับคันนี้</button>
      </div>
    `;
    slider.appendChild(slide);
  });

  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(() => {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 5000);
}

function navigateToBooking(carId) {
  window.location.href = `detail.html?id=${carId}&book=true`;
}

// News
function initNews() {
  const container = document.getElementById('news-container');
  if (!container) return;

  const mockNews = [
    {
      title: "โปรโมชั่นดับเบิ้ลดีลส่งท้ายปี! ดอกเบี้ยเริ่มต้น 0% หรือดาวน์น้อยผ่อนสบายเพียงเดือนละ 5,900 บาท",
      link: "https://www.honda.co.th/promotions",
      image: "https://www.checkraka.com/uploaded/logo/f1/f120e5846ddca1206d9d39206895a869.webp"
    },
    {
      title: "ฮอนด้าเปิดตัวยนตรกรรมไฟฟ้า 100% 'Honda e:N1' สัมผัสอัตราเร่งและระบบความปลอดภัยอัจฉริยะ Honda SENSING",
      link: "https://www.honda.co.th/technology/en1",
      image: "https://www.hondaaccess.co.th/public/img/frontback/en1/front.png?v=2"
    },
    {
      title: "สัมผัสจิตวิญญาณสปอร์ตเต็มเปี่ยม: รถรุ่นพิเศษ Honda Civic Type R พร้อมให้จองสิทธิ์สัมผัสตัวจริงแล้วที่โชว์รูมสาธร",
      link: "https://www.honda.co.th/civic-typer",
      image: "assets/civic_typer.jpg"
    }
  ];

  container.innerHTML = '';
  mockNews.forEach(item => {
    container.innerHTML += `
      <div class="thump-news-picture" onclick="window.open('${item.link}', '_blank')">
        <img src="${item.image}" alt="${item.title}">
        <div class="title-news">
          <h3>${item.title}</h3>
          <a href="${item.link}" target="_blank">อ่านเพิ่มเติม &rarr;</a>
        </div>
      </div>
    `;
  });
}

// Fetch Cars from Clever Cloud MySQL Database, fallback to database.js
async function loadData() {
  try {
    const res = await fetch('/api/cars');
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        window.CAR_DATABASE = data;
      }
    }
  } catch (error) {
    console.log('Unable to reach server database API, using database.js static fallback.', error);
  }

  if (window.CAR_DATABASE) {
    displayCars(window.CAR_DATABASE);
    populateCompareDropdowns(window.CAR_DATABASE);
  }
}

// Dynamically Render Car Cards inside Showroom
function displayCars(cars) {
  const container = document.getElementById('car-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (cars.length === 0) {
    container.innerHTML = '<p class="no-cars-msg">ไม่พบรุ่นรถยนต์ตามเงื่อนไขที่ค้นหา</p>';
    return;
  }

  cars.forEach(car => {
    let colorHtml = '<div class="color-options" style="height:25px;"></div>';
    let defaultImg = car.image_url;
    
    if (car.colors && car.colors.length > 0) {
      defaultImg = car.colors[0].image_url;
      colorHtml = `<div class="color-options">`;
      car.colors.forEach((c, i) => {
        colorHtml += `<div class="color-dot ${i === 0 ? 'active' : ''}" style="background:${c.color_hex}" onclick="changeCarColor(this, 'img-${car.id}', '${c.image_url}')"></div>`;
      });
      colorHtml += `</div>`;
    }

    let engineClass = car.engine_system === 'e:HEV' ? 'ehev' : (car.engine_system === 'EV' ? 'ev' : 'turbo');
    let formattedPrice = new Intl.NumberFormat('th-TH').format(parseFloat(car.price));

    console.log(`[DEBUG] Car card generated: ${car.model_name} (ID: ${car.id}) -> detail.html?id=${car.id}`);

    container.innerHTML += `
      <div class="car-card">
        <div class="car-image-container">
          <img id="img-${car.id}" src="${defaultImg}" alt="${car.model_name}">
        </div>
        <div class="car-info">
          <div class="badges">
            <span class="badge body">${car.body_type}</span>
            <span class="badge ${engineClass}">${car.engine_system}</span>
          </div>
          
          <h2 class="car-model">${car.model_name}</h2>
          
          ${colorHtml}
          
          <div class="car-price">${formattedPrice} <span>บาท</span></div>
        </div>
        
        <div class="action-buttons">
          <a href="detail.html?id=${car.id}" class="btn btn-detail">รายละเอียด</a>
          <a href="detail.html?id=${car.id}&book=true" class="btn btn-order">จอง Test Drive</a>
        </div>
      </div>`;
  });
}

// Color Selector inside card
window.changeCarColor = function(dot, imgId, url) {
  const img = document.getElementById(imgId);
  if (!img) return;
  img.style.opacity = 0.5;
  img.style.transform = 'scale(0.97)';
  setTimeout(() => { 
    img.src = url; 
    img.style.opacity = 1; 
    img.style.transform = 'scale(1)';
  }, 200);
  
  dot.parentElement.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
};

// Filter Showroom Cars
window.applyFilters = function() {
  const bodyVal = document.getElementById('filter-body').value;
  const engineVal = document.getElementById('filter-engine').value;

  const filtered = window.CAR_DATABASE.filter(car => {
    const matchBody = (bodyVal === 'all') || (car.body_type === bodyVal);
    const matchEngine = (engineVal === 'all') || (car.engine_system === engineVal);
    return matchBody && matchEngine;
  });

  displayCars(filtered);
};

window.resetFilters = function() {
  document.getElementById('filter-body').value = 'all';
  document.getElementById('filter-engine').value = 'all';
  displayCars(window.CAR_DATABASE);
};

// Compare Modal System
function populateCompareDropdowns(cars) {
  const select1 = document.getElementById('select-car-1');
  const select2 = document.getElementById('select-car-2');
  if (!select1 || !select2) return;
  
  select1.innerHTML = '<option value="">-- เลือกรุ่นรถ --</option>';
  select2.innerHTML = '<option value="">-- เลือกรุ่นรถ --</option>';

  cars.forEach(car => {
    const option1 = `<option value="${car.id}">${car.model_name} (${car.engine_system})</option>`;
    const option2 = `<option value="${car.id}">${car.model_name} (${car.engine_system})</option>`;
    select1.innerHTML += option1;
    select2.innerHTML += option2;
  });
}

window.openCompareModal = function() {
  const modal = document.getElementById('compare-modal');
  if (modal) modal.classList.add('active');
};

window.closeCompareModal = function() {
  const modal = document.getElementById('compare-modal');
  if (modal) modal.classList.remove('active');
};

window.confirmCompare = function() {
  const id1 = document.getElementById('select-car-1').value;
  const id2 = document.getElementById('select-car-2').value;

  if (!id1 || !id2) {
    alert('กรุณาเลือกรถให้ครบทั้ง 2 รุ่นครับ');
    return;
  }
  if (id1 === id2) {
    alert('กรุณาเลือกรุ่นรถที่แตกต่างกันครับ');
    return;
  }
  window.location.href = `compare.html?ids=${id1},${id2}`;
};

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  const modal = document.getElementById('compare-modal');
  if (event.target === modal || event.target.className === 'modal-overlay') {
    closeCompareModal();
  }
});
