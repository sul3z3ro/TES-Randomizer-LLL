
// ✅ Encounter System Script - Fixed Undo + Log Numbering

let allCards = [];
let deck = { peaceful: [], conflict: [] };
let cardsLoaded = false;
let lastDrawn = null;
let showingFront = true;
let roomCount = 0;

const startBtn = document.getElementById('startBtn');
const provinceSelect = document.getElementById('province');
const drawPeaceful = document.getElementById('drawPeaceful');
const drawConflict = document.getElementById('drawConflict');
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

fetch('cards.json')
  .then(res => res.json())
  .then(data => {
    allCards = data;
    cardsLoaded = true;
    restoreDeck();
    restoreLog();
  });

startBtn.addEventListener('click', () => {
  if (!cardsLoaded) return alert("รอโหลดการ์ดก่อนนะครับ...");
  const province = provinceSelect.value;
  if (!confirm(`เริ่มเกมที่ ${province} ใช่ไหม?`)) return;
  startGame(province);
});

drawPeaceful?.addEventListener('click', () => drawCard('peaceful'));
drawConflict?.addEventListener('click', () => drawCard('conflict'));

undoBtn?.addEventListener('click', () => {
  if (!lastDrawn) return alert('ไม่มีการ์ดล่าสุดให้ย้อนกลับ');
  if (!confirm('คุณแน่ใจว่าต้องการย้อนกลับการจั่วล่าสุด?')) return;

  const type = lastDrawn.type.toLowerCase();
  const pile = deck[type];
  const cardIndex = pile.findIndex(c => c.id === lastDrawn.id);
  if (cardIndex !== -1) pile[cardIndex].drawn = false;

  if (drawLog.firstChild) drawLog.removeChild(drawLog.firstChild);

  roomCount = Math.max(0, roomCount - 1);
  lastDrawn = null;
  cardDisplay.classList.add('hidden');
  undoBtn.classList.add('hidden');
  updateCardCount();
  saveDeck();
  saveLog();
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
  const peaceful = pickRandom(allCards.filter(c => c.type === 'Peaceful' && (c.province === province || c.category === 'General')), 12);
  const conflict = pickRandom(allCards.filter(c => c.type === 'Conflict' && (c.province === province || c.category === 'General')), 12);
  deck = {
    peaceful: peaceful.map(c => ({ ...c, drawn: false })),
    conflict: conflict.map(c => ({ ...c, drawn: false }))
  };
  roomCount = 0;
  lastDrawn = null;
  sessionStorage.setItem('hasStartedEncounter', 'true');
  sessionStorage.setItem('startedProvinceEncounter', province);
  provinceSection.classList.add('hidden');
  provinceDisplay.classList.remove('hidden');
  provinceName.textContent = province;
  startBtn.classList.add('hidden');
  undoBtn.classList.add('hidden');
  updateCardCount();
  drawLog.innerHTML = '';
  saveDeck();
  saveLog();
}

function drawCard(type) {
  const pile = deck[type];
  if (!pile) return;
  const next = pile.find(c => !c.drawn);
  if (!next) return alert('การ์ดในกองนี้หมดแล้ว');

  next.drawn = true;
  lastDrawn = next;
  roomCount++;
  saveDeck();
  updateCardCount();
  showCard(next);
  undoBtn.classList.remove('hidden');

  const entry = document.createElement('li');
  entry.textContent = `ใบที่ ${roomCount}: ${next.id}`;
  entry.className = 'cursor-pointer underline text-blue-300 hover:text-blue-100';
  entry.addEventListener('click', () => showCard(next));
  drawLog.prepend(entry);
  saveLog();
}

cardFlip?.addEventListener('click', () => cardFlip.classList.toggle('flipped'));

function showCard(card) {
  showingFront = true;
  frontImage.src = 'images/' + card.frontImage;
  backImage.src = 'images/' + card.backImage;
  cardFlip.classList.remove('flipped');
  cardDisplay.classList.remove('hidden');
}

function updateCardCount() {
  const p = deck.peaceful?.filter(c => !c.drawn).length || 0;
  const c = deck.conflict?.filter(c => !c.drawn).length || 0;
  cardCountPeaceful.textContent = `เหตุการณ์แบบสันติเหลือ: ${p}`;
  cardCountConflict.textContent = `เหตุการณ์แบบต่อสู้เหลือ: ${c}`;
}

function saveDeck() {
  sessionStorage.setItem('deckEncounter', JSON.stringify(deck));
}

function saveLog() {
  const drawnLogs = [...deck.peaceful, ...deck.conflict].filter(c => c.drawn).map(c => ({ id: c.id, type: c.type }));
  sessionStorage.setItem('logEncounter', JSON.stringify(drawnLogs));
  sessionStorage.setItem('roomCountEncounter', roomCount.toString());
}

function restoreDeck() {
  const saved = sessionStorage.getItem('deckEncounter');
  if (saved) deck = JSON.parse(saved);
  const started = sessionStorage.getItem('hasStartedEncounter');
  const province = sessionStorage.getItem('startedProvinceEncounter');
  if (started && province) {
    provinceSection.classList.add('hidden');
    provinceDisplay.classList.remove('hidden');
    provinceName.textContent = province;
    startBtn.classList.add('hidden');
    undoBtn.classList.add('hidden');
  }
  updateCardCount();
}

function restoreLog() {
  const savedLog = sessionStorage.getItem('logEncounter');
  const savedCount = sessionStorage.getItem('roomCountEncounter');
  if (savedCount) roomCount = parseInt(savedCount) || 0;

  drawLog.innerHTML = '';
  if (!savedLog) return;
  const logs = JSON.parse(savedLog);
  logs.forEach((logItem, index) => {
  const card = [...deck.peaceful, ...deck.conflict].find(c => c.id === logItem.id);
  if (!card) return;
  const entry = document.createElement('li');
  const logNumber = index + 1; // ใบที่ 1, 2, ..., n
  entry.textContent = `ใบที่ ${logNumber}: ${card.id}`;
  entry.className = 'cursor-pointer underline text-blue-300 hover:text-blue-100';
  entry.addEventListener('click', () => showCard(card));
  drawLog.prepend(entry); // ใบที่มากกว่าขึ้นก่อน
});

}

document.getElementById('endCampaignBtn')?.addEventListener('click', () => {
  if (!confirm('คุณต้องการจบแคมเปญทั้งหมดหรือไม่? หลังจากกดตกลงข้อมูลจะถูกล้างทั้งหมด')) return;
  sessionStorage.clear();
  location.reload();
});
