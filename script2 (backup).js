// script2.js — สำหรับหน้า index2.html (โหมด Delve)

window.addEventListener('DOMContentLoaded', () => {
  // ================== STATE ==================
  let allCards = [];
  let mainDeck = [];
  let spCards = [];
  let drawnCards = [];
  let roomCount = 0;
  let currentProvince = '';
  let spInserted = false;

  // ================== ELEMENTS ==================
  const delveProvince = document.getElementById('delveProvince');
  const startDelve = document.getElementById('startDelve');
  const endCampaignBtn = document.getElementById('endCampaignBtn');
  const delveSetup = document.getElementById('delveSetup');
  const delveDisplay = document.getElementById('delveDisplay');
  const delveProvinceName = document.getElementById('delveProvinceName');
  const drawDelveCard = document.getElementById('drawDelveCard');
  const addSPBtn = document.getElementById('addSPBtn');
  const endEncounterBtn = document.getElementById('endEncounterBtn');
  const drawLog = document.getElementById('drawLog');
  const deckCount = document.getElementById('deckCount');
  const cardArea = document.getElementById('cardArea');
  const delveCardImage = document.getElementById('delveCardImage');
  const hideCardBtn = document.getElementById('hideCardBtn');

  // ================== INITIAL ==================
  fetch('cards.json')
    .then(res => res.json())
    .then(data => {
      allCards = data;
      loadState();
      restoreLog();
    });

  // ================== START GAME ==================
  startDelve.addEventListener('click', () => {
    if (!confirm('เริ่มเกมในเขตนี้ใช่หรือไม่?')) return;

    currentProvince = delveProvince.value;
    const general = allCards.filter(c => c.category === 'Delve' && c.province === 'General' && !c.isSP);
    const local = allCards.filter(c => c.category === 'Delve' && c.province === currentProvince && !c.isSP);
    const special = allCards.filter(c => c.category === 'Delve' && c.province === currentProvince && c.isSP);

    mainDeck = shuffle([...general, ...local]);
    spCards = [...special];
    drawnCards = [];
    roomCount = 0;
    spInserted = false;

    delveSetup.classList.add('hidden');
    delveDisplay.classList.remove('hidden');
    delveProvinceName.textContent = currentProvince;
    addSPBtn.classList.remove('hidden');

    updateDeckCount();
    saveState();
    saveLog();
  });

  // ================== DRAW CARD ==================
  drawDelveCard.addEventListener('click', () => {
    if (mainDeck.length === 0) return alert('ไม่มีการ์ดให้จั่วแล้ว');

    const card = mainDeck.pop();
    drawnCards.push(card);
    roomCount++;

    delveCardImage.src = 'images/' + card.frontImage;
    cardArea.classList.remove('hidden');

    const entry = document.createElement('li');
    entry.textContent = `ห้องที่ ${roomCount}: ${card.id}`;
    entry.className = 'cursor-pointer underline text-blue-300 hover:text-blue-100';
    entry.addEventListener('click', () => {
      delveCardImage.src = 'images/' + card.frontImage;
      cardArea.classList.remove('hidden');
    });
    drawLog.prepend(entry);

    updateDeckCount();
    saveState();
    saveLog();
  });

  // ================== ADD SP CARDS ==================
  addSPBtn.addEventListener('click', () => {
    if (spInserted) return;
    if (!confirm('ต้องการเพิ่มการ์ด SP ลงในกองหรือไม่?')) return;

    mainDeck = shuffle([...mainDeck, ...spCards]);
    spInserted = true;
    addSPBtn.classList.add('hidden');
    updateDeckCount();
    saveState();
  });

  // ================== END ENCOUNTER ==================
  endEncounterBtn.addEventListener('click', () => {
    if (!confirm('คุณต้องการจบเหตุการณ์นี้หรือไม่?')) return;
    mainDeck = shuffle([...mainDeck, ...drawnCards]);
    drawnCards = [];
    roomCount = 0;
    drawLog.innerHTML = '';
    cardArea.classList.add('hidden');

    if (spInserted) {
      spCards = mainDeck.filter(c => c.isSP);
      mainDeck = mainDeck.filter(c => !c.isSP);
      spInserted = false;
      addSPBtn.classList.remove('hidden');
    }
    updateDeckCount();
    saveState();
    saveLog();
  });

  // ================== END CAMPAIGN ==================
  endCampaignBtn.addEventListener('click', () => {
    if (!confirm('คุณต้องการจบแคมเปญทั้งหมดหรือไม่? หลังจากกดตกลงข้อมูลจะถูกล้างทั้งหมด')) return;
    sessionStorage.clear();
    location.reload();
  });

  // ================== HIDE CARD ==================
  hideCardBtn.addEventListener('click', () => {
    cardArea.classList.add('hidden');
  });

  // ================== UTILS ==================
  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function updateDeckCount() {
    deckCount.textContent = mainDeck.length;
  }

  function saveState() {
    sessionStorage.setItem('mainDeckDelve', JSON.stringify(mainDeck));
    sessionStorage.setItem('drawnCardsDelve', JSON.stringify(drawnCards));
    sessionStorage.setItem('spCardsDelve', JSON.stringify(spCards));
    sessionStorage.setItem('spInsertedDelve', JSON.stringify(spInserted));
    sessionStorage.setItem('currentProvinceDelve', currentProvince);
    sessionStorage.setItem('roomCountDelve', roomCount);
  }

  function loadState() {
    const savedMain = sessionStorage.getItem('mainDeckDelve');
    const savedDrawn = sessionStorage.getItem('drawnCardsDelve');
    const savedSP = sessionStorage.getItem('spCardsDelve');
    const savedInserted = sessionStorage.getItem('spInsertedDelve');
    const savedProvince = sessionStorage.getItem('currentProvinceDelve');
    const savedCount = sessionStorage.getItem('roomCountDelve');

    if (savedMain && savedDrawn && savedSP && savedInserted && savedProvince) {
      mainDeck = JSON.parse(savedMain);
      drawnCards = JSON.parse(savedDrawn);
      spCards = JSON.parse(savedSP);
      spInserted = JSON.parse(savedInserted);
      currentProvince = savedProvince;
      roomCount = parseInt(savedCount || '0');

      delveSetup.classList.add('hidden');
      delveDisplay.classList.remove('hidden');
      delveProvince.style.display = 'none';
      startDelve.style.display = 'none';
      delveProvinceName.textContent = currentProvince;
      addSPBtn.classList.toggle('hidden', spInserted);

      updateDeckCount();
    }
  }

  function saveLog() {
    const logItems = Array.from(drawLog.children).map(li => li.textContent);
    sessionStorage.setItem('logDelve', JSON.stringify(logItems));
  }

  function restoreLog() {
    const savedLog = sessionStorage.getItem('logDelve');
    const savedDrawn = sessionStorage.getItem('drawnCardsDelve');
    if (!savedLog || !savedDrawn) return;

    const items = JSON.parse(savedLog);
    const parsedDrawn = JSON.parse(savedDrawn);
    drawLog.innerHTML = '';
    items.reverse().forEach(text => {
      const entry = document.createElement('li');
      entry.textContent = text;
      entry.className = 'cursor-pointer underline text-blue-300 hover:text-blue-100';
      const cardId = text.split(': ')[1];
      const card = parsedDrawn.find(c => c.id === cardId);
      if (card) {
        entry.addEventListener('click', () => {
          delveCardImage.src = 'images/' + card.frontImage;
          cardArea.classList.remove('hidden');
        });
      }
      drawLog.prepend(entry);
    });
  }
});
