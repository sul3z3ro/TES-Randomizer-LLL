// ✅ ระบบ Encounter - script.js ปรับให้จำสถานะเกมและ log การ์ดได้ข้ามแท็บ/รีโหลด

let allCards = [];
let deck = { peaceful: [], conflict: [] };
let cardsLoaded = false;
let lastDrawn = null;
let showingFront = true;
let roomCount = 0;

// ✅ โหลดการ์ด + restore deck และ log
fetch('cards.json')
  .then(res => res.json())
  .then(data => {
    allCards = data;
    cardsLoaded = true;
    restoreDeck();
    restoreLog();
  });

const startBtn = document.getElementById('startBtn');
const provinceSelect = document.getElementById('province');
const drawPeaceful = document.getElementById('drawPeaceful');
const drawConflict = document.getElementById('drawConflict');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');

const cardDisplay = document.getElementById('cardDisplay');
const frontImage = document.getElementById('frontImage');
const backImage = document.getElementById('backImage');
const cardFlip = document.getElementById('cardFlip');

const provinceSection = document.getElementById('provinceSection');
const provinceDisplay = document.getElementById('provinceDisplay');
const provinceName = document.getElementById('provinceName');

const cardCountPeaceful = document.getElementById('cardCountPeaceful');
const cardCountConflict = document.getElementById('cardCountConflict');
const drawLog = document.getElementById('drawLog');

// ✅ ปุ่มเริ่มเกม
startBtn.addEventListener('click', () => {
  if (!cardsLoaded) return alert("รอโหลดการ์ดก่อนนะครับ...");
  const province = provinceSelect.value;
  if (!confirm(`เริ่มเกมที่ ${province} ใช่ไหม?`)) return;
  startGame(province);
});

// ✅ ปุ่มจั่ว
if (drawPeaceful) drawPeaceful.addEventListener('click', () => drawCard('peaceful'));
if (drawConflict) drawConflict.addEventListener('click', () => drawCard('conflict'));

// ✅ ปุ่ม reset
resetBtn?.addEventListener('click', () => {
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตเกม?')) return;
  sessionStorage.clear();
  deck = { peaceful: [], conflict: [] };
  roomCount = 0;
  cardDisplay.classList.add('hidden');
  provinceSection.classList.remove('hidden');
  provinceDisplay.classList.add('hidden');
  startBtn.classList.remove('hidden');
  resetBtn.classList.add('hidden');
  undoBtn.classList.add('hidden');
  updateCardCount();
  if (drawLog) drawLog.innerHTML = '';
});

// ✅ ปุ่ม undo
undoBtn?.addEventListener('click', () => {
  if (!lastDrawn) return alert('ไม่มีการ์ดล่าสุดให้ย้อนกลับ');
  if (!confirm('คุณแน่ใจว่าต้องการย้อนกลับการจั่วล่าสุด?')) return;
  const type = lastDrawn.type.toLowerCase();
  deck[type] = deck[type].filter(c => c.id !== lastDrawn.id);
  lastDrawn = null;
  saveDeck();
  updateCardCount();
  cardDisplay.classList.add('hidden');
  undoBtn.classList.add('hidden');
});

function pickRandom(array, n) {
  const copy = [...array];
  const result = [];
  while (result.length < n && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

function startGame(province) {
  const peaceful = pickRandom(
    allCards.filter(c => c.type === 'Peaceful' && (c.province === province || c.category === 'General')),
    12
  );
  const conflict = pickRandom(
    allCards.filter(c => c.type === 'Conflict' && (c.province === province || c.category === 'General')),
    12
  );
  deck = {
    peaceful: peaceful.map(c => ({ ...c, drawn: false })),
    conflict: conflict.map(c => ({ ...c, drawn: false }))
  };
  sessionStorage.setItem('deckEncounter', JSON.stringify(deck));
  sessionStorage.setItem('hasStartedEncounter', 'true');
  sessionStorage.setItem('startedProvinceEncounter', province);
  provinceSection.classList.add('hidden');
  provinceDisplay.classList.remove('hidden');
  provinceName.textContent = province;
  startBtn.classList.add('hidden');
  resetBtn.classList.remove('hidden');
  undoBtn.classList.add('hidden');
  updateCardCount();
  if (drawLog) drawLog.innerHTML = '';
  roomCount = 0;
  saveLog();
}

function drawCard(type) {
  const pile = deck[type];
  if (!pile) return;
  const next = pile.find(c => !c.drawn);
  if (!next) return alert('การ์ดในกองนี้หมดแล้ว');
  next.drawn = true;
  lastDrawn = next;
  saveDeck();
  updateCardCount();
  showCard(next);
  undoBtn.classList.remove('hidden');

  roomCount++;
  const entry = document.createElement('li');
  entry.textContent = `ใบที่ ${roomCount}: ${next.id}`;
  entry.className = 'cursor-pointer underline text-blue-300 hover:text-blue-100';
  entry.addEventListener('click', () => showCard(next));
  drawLog?.prepend(entry);  // log ล่าสุดอยู่ด้านบน
  saveLog();
}

function showCard(card) {
  showingFront = true;
  frontImage.src = 'images/' + card.frontImage;
  backImage.src = 'images/' + card.backImage;
  cardFlip.classList.remove('flipped');
  cardDisplay.classList.remove('hidden');
}

cardFlip?.addEventListener('click', () => cardFlip.classList.toggle('flipped'));

function updateCardCount() {
  const p = deck.peaceful?.filter(c => !c.drawn).length || 0;
  const c = deck.conflict?.filter(c => !c.drawn).length || 0;
  cardCountPeaceful.textContent = `เหตุการณ์แบบสันติเหลือ: ${p}`;
  cardCountConflict.textContent = `เหตุการณ์แบบต่อสู้เหลือ: ${c}`;
}

function saveDeck() {
  sessionStorage.setItem('deckEncounter', JSON.stringify(deck));
}

function restoreDeck() {
  const saved = sessionStorage.getItem('deckEncounter');
  if (saved) deck = JSON.parse(saved);
  updateCardCount();
  const started = sessionStorage.getItem('hasStartedEncounter');
  const province = sessionStorage.getItem('startedProvinceEncounter');
  if (started && province) {
    provinceSection.classList.add('hidden');
    provinceDisplay.classList.remove('hidden');
    provinceName.textContent = province;
    startBtn.classList.add('hidden');
    resetBtn.classList.remove('hidden');
    undoBtn.classList.add('hidden');
  }
}

function saveLog() {
  if (!drawLog) return;
  const items = Array.from(drawLog.children).map(li => li.textContent);
  sessionStorage.setItem('logEncounter', JSON.stringify(items));
  sessionStorage.setItem('roomCountEncounter', roomCount.toString());
}

function restoreLog() {
  const savedLog = sessionStorage.getItem('logEncounter');
  const savedCount = sessionStorage.getItem('roomCountEncounter');
  const logList = document.getElementById('drawLog');
  if (savedLog && logList) {
    const items = JSON.parse(savedLog);
    logList.innerHTML = '';
    // 🔄 เรียงจากรายการล่าสุดไปเก่าสุด
    items.reverse().forEach(text => {
      const entry = document.createElement('li');
      entry.textContent = text;
      entry.className = 'cursor-pointer underline text-blue-300 hover:text-blue-100';
      const cardId = text.split(': ')[1];
      const card = [...deck.peaceful, ...deck.conflict].find(c => c.id === cardId);
      if (card) {
        entry.addEventListener('click', () => showCard(card));
      }
      logList.prepend(entry); // ใส่ด้านบนสุดเพื่อให้ log ล่าสุดอยู่บน
    });
  }
  if (savedCount) roomCount = parseInt(savedCount);

// ✅ ปุ่มจบแคมเปญ
const endCampaignBtn = document.getElementById('endCampaignBtn');
endCampaignBtn?.addEventListener('click', () => {
  if (!confirm('คุณต้องการจบแคมเปญทั้งหมดหรือไม่? หลังจากกดตกลงข้อมูลจะถูกล้างทั้งหมด')) return;
  sessionStorage.clear();
  location.reload();
});

}
