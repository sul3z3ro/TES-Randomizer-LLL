// ---------- Utilities (ใช้ร่วมกันทุกหน้า) ----------
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
function pickRandom(array, n) {
  const copy = [...array];
  const result = [];
  while (result.length < n && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

// ---------- Encounter Mode (index.html) ----------
if (document.getElementById('provinceSection')) {
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

  fetch('thingamabob/cards.json')
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
    const index = pile.findIndex(c => c.id === lastDrawn.id);
    if (index === -1) return;

    const isGeneral = allCards.find(c => c.id === lastDrawn.id)?.category === 'General';

    if (isGeneral) {
      pile.splice(index, 1);
      const currentIds = pile.filter(c => !c.drawn).map(c => c.id);
      const unusedGeneral = allCards.filter(c =>
        c.type.toLowerCase() === type &&
        c.category === 'General' &&
        !currentIds.includes(c.id)
      );
      if (unusedGeneral.length > 0) {
        const replacement = pickRandom(unusedGeneral, 1)[0];
        const insertIndex = Math.floor(Math.random() * (pile.length + 1));
        pile.splice(insertIndex, 0, { ...replacement, drawn: false });
      }
    } else {
      pile[index].drawn = false;
      const [card] = pile.splice(index, 1);
      const insertIndex = Math.floor(Math.random() * (pile.length + 1));
      pile.splice(insertIndex, 0, card);
    }

    if (drawLog.firstChild) drawLog.removeChild(drawLog.firstChild);

    roomCount = Math.max(0, roomCount - 1);
    lastDrawn = null;
    cardDisplay.classList.add('hidden');
    undoBtn.classList.add('hidden');
    updateCardCount();
    saveDeck();
    saveLog();
  });

  function startGame(province) {
    const generalPeaceful = pickRandom(
      allCards.filter(c => c.type === 'Peaceful' && c.category === 'General'),
      4
    );
    const provincePeaceful = allCards.filter(c => c.type === 'Peaceful' && c.province === province);
    const peacefulFull = [...provincePeaceful, ...generalPeaceful];
    const peaceful = pickRandom(peacefulFull, peacefulFull.length);

    const generalConflict = pickRandom(
      allCards.filter(c => c.type === 'Conflict' && c.category === 'General'),
      4
    );
    const provinceConflict = allCards.filter(c => c.type === 'Conflict' && c.province === province);
    const conflictFull = [...provinceConflict, ...generalConflict];
    const conflict = pickRandom(conflictFull, conflictFull.length);

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
    frontImage.src = 'images/Encounter/' + card.frontImage;
    backImage.src = 'images/Encounter/' + card.backImage;
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
      const logNumber = index + 1;
      entry.textContent = `ใบที่ ${logNumber}: ${card.id}`;
      entry.className = 'cursor-pointer underline text-blue-300 hover:text-blue-100';
      entry.addEventListener('click', () => showCard(card));
      drawLog.prepend(entry);
    });
  }

  document.getElementById('endCampaignBtn')?.addEventListener('click', () => {
    if (!confirm('คุณต้องการจบแคมเปญทั้งหมดหรือไม่? หลังจากกดตกลงข้อมูลจะถูกล้างทั้งหมด')) return;
    sessionStorage.clear();
    location.reload();
  });
}

// ---------- Delve Mode (index2.html) ----------
if (document.getElementById('delveSetup')) {
  let allCards = [];
  let mainDeck = [];
  let spCards = [];
  let drawnCards = [];
  let roomCount = 0;
  let currentProvince = '';
  let spInserted = false;

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

  fetch('thingamabob/cards.json')
    .then(res => res.json())
    .then(data => {
      allCards = data;
      loadState();
      restoreLog();
    });

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

  drawDelveCard.addEventListener('click', () => {
    if (mainDeck.length === 0) return alert('ไม่มีการ์ดให้จั่วแล้ว');

    const card = mainDeck.pop();
    drawnCards.push(card);
    roomCount++;

    delveCardImage.src = 'images/Delve/' + card.frontImage;
    cardArea.classList.remove('hidden');

    const entry = document.createElement('li');
    entry.textContent = `ห้องที่ ${roomCount}: ${card.id}`;
    entry.className = 'cursor-pointer underline text-blue-300 hover:text-blue-100';
    entry.addEventListener('click', () => {
      delveCardImage.src = 'images/Delve/' + card.frontImage;
      cardArea.classList.remove('hidden');
    });
    drawLog.prepend(entry);

    updateDeckCount();
    saveState();
    saveLog();
  });

  addSPBtn.addEventListener('click', () => {
    if (spInserted) return;
    if (!confirm('ต้องการเพิ่มการ์ด SP ลงในกองหรือไม่?')) return;

    mainDeck = shuffle([...mainDeck, ...spCards]);
    spInserted = true;
    addSPBtn.classList.add('hidden');
    updateDeckCount();
    saveState();
  });

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

  endCampaignBtn.addEventListener('click', () => {
    if (!confirm('คุณต้องการจบแคมเปญทั้งหมดหรือไม่? หลังจากกดตกลงข้อมูลจะถูกล้างทั้งหมด')) return;
    sessionStorage.clear();
    location.reload();
  });

  hideCardBtn.addEventListener('click', () => {
    cardArea.classList.add('hidden');
  });

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
          delveCardImage.src = 'images/Delve/' + card.frontImage;
          cardArea.classList.remove('hidden');
        });
      }
      drawLog.prepend(entry);
    });
  }
}

// ---------- Side Quest Mode (index3.html) ----------
if (document.getElementById('currentQuestText')) {
  const currentQuestText = document.getElementById("currentQuestText");
  const drawButtons = document.querySelectorAll(".draw-btn");
  const questImages = document.querySelectorAll(".quest-image");
  const completeBtn = document.getElementById("completeQuest");
  const failBtn = document.getElementById("failQuest");
  const initialDrawBtn = document.getElementById("initialDrawBtn");
  const questArea = document.getElementById("sideQuestArea");
  const activeImage = document.getElementById("activeQuestImage");
  const deckCount = document.getElementById("deckCount");

  let allQuests = [];
  let availableDeck = [];
  let discardPile = [];
  let activeQuest = null;
  let drawnCards = [null, null];

  fetch("thingamabob/Cards-side_quest.json")
    .then(res => res.json())
    .then(data => {
      allQuests = data;
      loadState();
      renderState();
    });

  function drawNewCard() {
    if (availableDeck.length === 0) return null;
    const i = Math.floor(Math.random() * availableDeck.length);
    return availableDeck.splice(i, 1)[0];
  }

  initialDrawBtn?.addEventListener("click", () => {
    if (availableDeck.length < 2) return alert("การ์ดเควสรองหมดกองแล้ว");
    drawnCards = [drawNewCard(), drawNewCard()];
    initialDrawBtn.classList.add("hidden");
    questArea.classList.remove("hidden");
    saveState();
    renderState();
  });

  drawButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      if (activeQuest) return;
      if (availableDeck.length === 0) {
        alert("กองจั่วหมดแล้ว! คุณต้องเลือก 1 ใน 2 เควสที่เหลือ");
        return;
      }
      if (drawnCards[index]) discardPile.push(drawnCards[index]);
      drawnCards[index] = drawNewCard();
      saveState();
      renderState();
    });
  });

  questImages.forEach((img, index) => {
    img.addEventListener("click", () => {
      if (activeQuest || !drawnCards[index]) return;
      const quest = drawnCards[index];
      if (!confirm(`จะเลือก "${quest.name}" เป็นเควสรองใช่หรือไม่?`)) return;
      activeQuest = quest;
      discardPile.push(...drawnCards.filter((_, i) => i !== index));
      drawnCards = [null, null];
      saveState();
      renderState();
    });
  });

  [completeBtn, failBtn].forEach(btn => {
    btn.addEventListener("click", () => {
      if (!activeQuest) return;
      if (!confirm("คุณแน่ใจหรือไม่?")) return;
      discardPile.push(activeQuest);
      activeQuest = null;
      saveState();
      location.reload();
    });
  });

  document.getElementById("endCampaignBtn").addEventListener("click", () => {
    if (!confirm("คุณต้องการจบแคมเปญหรือไม่?")) return;
    sessionStorage.clear();
    location.reload();
  });

  function saveState() {
    sessionStorage.setItem("availableDeck_SQ", JSON.stringify(availableDeck));
    sessionStorage.setItem("discardPile_SQ", JSON.stringify(discardPile));
    sessionStorage.setItem("activeQuest_SQ", JSON.stringify(activeQuest));
    sessionStorage.setItem("drawnCards_SQ", JSON.stringify(drawnCards));
  }

  function loadState() {
    const savedAvailable = sessionStorage.getItem("availableDeck_SQ");
    const savedDiscard = sessionStorage.getItem("discardPile_SQ");
    const savedActive = sessionStorage.getItem("activeQuest_SQ");
    const savedDrawn = sessionStorage.getItem("drawnCards_SQ");

    availableDeck = savedAvailable ? JSON.parse(savedAvailable) : [...allQuests];
    discardPile = savedDiscard ? JSON.parse(savedDiscard) : [];
    activeQuest = savedActive ? JSON.parse(savedActive) : null;
    drawnCards = savedDrawn ? JSON.parse(savedDrawn) : [null, null];
  }

  function renderState() {
    const hasDrawn = drawnCards.some(card => card !== null);
    if (hasDrawn || activeQuest) {
      initialDrawBtn?.classList.add("hidden");
      questArea?.classList.remove("hidden");
    }

    currentQuestText.textContent = activeQuest
      ? `เควสรองที่ทำอยู่: ${activeQuest.name}`
      : "ยังไม่มีเควสรองที่เลือก (คลิกที่รูปเพื่อรับเควส)";

    if (activeQuest && activeImage) {
      activeImage.src = "images/SideQuest/" + activeQuest.front;
      activeImage.classList.remove("hidden");
    } else if (activeImage) {
      activeImage.classList.add("hidden");
    }

    questImages.forEach((img, index) => {
      const card = drawnCards[index];
      if (card) {
        img.src = "images/SideQuest/" + card.front;
        img.classList.remove("hidden");
        const btn = document.getElementById(`drawBtn${index}`);
        btn.textContent = `ทิ้ง "${card.name}" แล้วจั่วใหม่`;
        btn.classList.remove("hidden");
      } else {
        img.classList.add("hidden");
        document.getElementById(`drawBtn${index}`).classList.add("hidden");
      }
      updateDeckCount();
    });

    completeBtn.classList.toggle("hidden", !activeQuest);
    failBtn.classList.toggle("hidden", !activeQuest);
  }
  function updateDeckCount() {
    deckCount.textContent = availableDeck.length;
  }
}
