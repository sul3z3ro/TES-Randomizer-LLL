let allQuests = [];
let availableDeck = [];
let discardPile = [];
let drawnCards = [null, null];
let activeQuests = [];
let activeQuestIndex = null;

function saveState() {
  sessionStorage.setItem("availableDeck_SQ", JSON.stringify(availableDeck));
  sessionStorage.setItem("discardPile_SQ", JSON.stringify(discardPile));
  sessionStorage.setItem("activeQuests_SQ", JSON.stringify(activeQuests));
  sessionStorage.setItem("drawnCards_SQ", JSON.stringify(drawnCards));
}

function loadState() {
  const savedAvailable = sessionStorage.getItem("availableDeck_SQ");
  const savedDiscard = sessionStorage.getItem("discardPile_SQ");
  const savedActive = sessionStorage.getItem("activeQuests_SQ");
  const savedDrawn = sessionStorage.getItem("drawnCards_SQ");

  availableDeck = savedAvailable ? JSON.parse(savedAvailable) : [...allQuests];
  discardPile = savedDiscard ? JSON.parse(savedDiscard) : [];
  activeQuests = savedActive ? JSON.parse(savedActive) : [];
  drawnCards = savedDrawn ? JSON.parse(savedDrawn) : [null, null];
}

function updateDeckCount() {
  const deckCount = document.getElementById("deckCount");
  if (deckCount) deckCount.textContent = availableDeck.length;
}

function renderActiveQuestLog() {
  const log = document.getElementById("activeQuestList");
  const count = document.getElementById("activeQuestCount");
  log.innerHTML = "";
  count.textContent = activeQuests.length;
  if (activeQuests.length === 0) {
    log.innerHTML = `<li class="text-gray-400">ยังไม่มีเควสรองที่กำลังทำอยู่</li>`;
  } else {
    activeQuests.forEach((quest, idx) => {
      const li = document.createElement("li");
      li.innerHTML = `<button class="underline text-blue-300 hover:text-blue-500" data-idx="${idx}">${quest.name}</button>`;
      li.querySelector('button').addEventListener("click", () => showQuestModal(idx));
      log.appendChild(li);
    });
  }
}

function showQuestModal(idx) {
  activeQuestIndex = idx;
  const modal = document.getElementById("questModal");
  const quest = activeQuests[idx];
  document.getElementById("modalQuestImage").src = "images/SideQuest/" + quest.front;
  document.getElementById("modalQuestName").textContent = quest.name;
  modal.classList.remove("hidden");
}

function closeQuestModal() {
  document.getElementById("questModal").classList.add("hidden");
  activeQuestIndex = null;
}

function completeOrFailQuest(isComplete) {
  if (activeQuestIndex === null) return;
  if (!confirm(isComplete ? "เควสสำเร็จ?" : "เควสนี้ล้มเหลว?")) return;
  activeQuests.splice(activeQuestIndex, 1);
  saveState();
  renderActiveQuestLog();
  closeQuestModal();
}

// จั่ว 2 ใบใหม่
function drawNewCard() {
  if (availableDeck.length === 0) return null;
  const i = Math.floor(Math.random() * availableDeck.length);
  return availableDeck.splice(i, 1)[0];
}

function renderState() {
  renderActiveQuestLog();
  const currentQuestText = document.getElementById("currentQuestText");
  const questImages = document.querySelectorAll(".quest-image");
  const drawButtons = document.querySelectorAll(".draw-btn");
  const initialDrawBtn = document.getElementById("initialDrawBtn");
  const questArea = document.getElementById("sideQuestArea");

  // ปุ่มรับเควส แสดงตลอดเวลา
  if (drawnCards.some(card => card !== null)) {
    initialDrawBtn?.classList.add("hidden");
    questArea?.classList.remove("hidden");
  } else {
    initialDrawBtn?.classList.remove("hidden");
    questArea?.classList.add("hidden");
  }

  // เปลี่ยนข้อความบน currentQuestText
  if (activeQuests.length >= 4) {
    currentQuestText.textContent = "คุณมีเควสรองครบ 4 ใบแล้ว กรุณาจบเควสบางใบก่อน";
  } else {
    currentQuestText.textContent = "เลือกเควสรอง 1 ใบจาก 2 ตัวเลือก (คลิกที่การ์ด)";
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
}

document.addEventListener("DOMContentLoaded", function() {
  fetch("thingamabob/Cards-side_quest.json")
    .then(res => res.json())
    .then(data => {
      allQuests = data;
      loadState();
      renderState();
    });

  // ปุ่มรับเควส (แสดงตลอดเวลา)
  document.getElementById("initialDrawBtn")?.addEventListener("click", () => {
    if (activeQuests.length >= 4) {
      alert("คุณมีเควสรองครบ 4 ใบแล้ว กรุณาจบเควสบางใบก่อน");
      return;
    }
    if (availableDeck.length < 2) return alert("การ์ดเควสรองหมดกองแล้ว");
    drawnCards = [drawNewCard(), drawNewCard()];
    saveState();
    renderState();
  });

  // ทิ้งและจั่วใหม่
  document.querySelectorAll(".draw-btn").forEach((btn, index) => {
    btn.addEventListener("click", () => {
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

  // เลือกเควสเข้าสู่ activeQuests
  document.querySelectorAll(".quest-image").forEach((img, index) => {
    img.addEventListener("click", () => {
      if (!drawnCards[index]) return;
      if (activeQuests.length >= 4) {
        alert("คุณมีเควสรองครบ 4 ใบแล้ว กรุณาจบเควสบางใบก่อน");
        return;
      }
      const quest = drawnCards[index];
      if (!confirm(`จะเลือก "${quest.name}" เป็นเควสรองใช่หรือไม่?`)) return;
      activeQuests.push(quest);
      // ใบที่ไม่ได้เลือกทิ้งเลย
      discardPile.push(...drawnCards.filter((_, i) => i !== index));
      drawnCards = [null, null];
      saveState();
      renderState();
  });
});
  // Hamburger Menu
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const menuDrawer = document.getElementById('menuDrawer');
  let menuOpen = false;

  if (hamburgerBtn && menuDrawer) {
    hamburgerBtn.addEventListener('click', function(e) {
      menuDrawer.classList.toggle('-translate-x-full');
      menuOpen = !menuOpen;
    });
    // ปิดเมนูถ้าคลิกข้างนอกเมนู
    document.addEventListener('click', function(e) {
      if (
        menuOpen &&
        !menuDrawer.contains(e.target) &&
        !hamburgerBtn.contains(e.target)
      ) {
        menuDrawer.classList.add('-translate-x-full');
        menuOpen = false;
      }
    });
  }

  // ปุ่มจบแคมเปญใน Burger Menu
  document.getElementById("endCampaignBtn")?.addEventListener("click", function () {
    if (!confirm("คุณต้องการจบแคมเปญหรือไม่? หลังจากกดตกลงข้อมูลจะถูกล้างทั้งหมด")) return;
    sessionStorage.clear();
    location.reload();
  });
});

  // Modal buttons
  document.getElementById("closeModalBtn").addEventListener("click", closeQuestModal);
  document.getElementById("modalCompleteBtn").addEventListener("click", () => completeOrFailQuest(true));
  document.getElementById("modalFailBtn").addEventListener("click", () => completeOrFailQuest(false));

  // Escape key ปิด popup
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeQuestModal();
  });

  // Overlay click = close popup (แต่ไม่ปิดถ้าคลิกในกล่อง)
  document.getElementById("questModal").addEventListener("click", function(e) {
    if (e.target === this) closeQuestModal();
  });
  document.getElementById("modalContent").addEventListener("click", function(e) {
    e.stopPropagation();
  });
// Mobile Hamburger Menu
const mobileHamburgerBtn = document.getElementById('mobileHamburgerBtn');
const mobileMenuDrawer = document.getElementById('mobileMenuDrawer');
let mobileMenuOpen = false;

if (mobileHamburgerBtn && mobileMenuDrawer) {
  mobileHamburgerBtn.addEventListener('click', function(e) {
    mobileMenuDrawer.classList.toggle('-translate-x-full');
    mobileMenuOpen = !mobileMenuOpen;
  });
  // ปิดเมนูถ้าคลิกข้างนอกเมนู
  document.addEventListener('click', function(e) {
    if (
      mobileMenuOpen &&
      !mobileMenuDrawer.contains(e.target) &&
      !mobileHamburgerBtn.contains(e.target)
    ) {
      mobileMenuDrawer.classList.add('-translate-x-full');
      mobileMenuOpen = false;
    }
  });
}

// ปุ่มจบแคมเปญใน Burger Menu (mobile)
document.getElementById("mobileEndCampaignBtn")?.addEventListener("click", function () {
  if (!confirm("คุณต้องการจบแคมเปญหรือไม่? หลังจากกดตกลงข้อมูลจะถูกล้างทั้งหมด")) return;
  sessionStorage.clear();
  location.reload();
});
