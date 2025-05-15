
window.addEventListener("DOMContentLoaded", () => {
  const currentQuestText = document.getElementById("currentQuestText");
  const drawButtons = document.querySelectorAll(".draw-btn");
  const questImages = document.querySelectorAll(".quest-image");
  const completeBtn = document.getElementById("completeQuest");
  const failBtn = document.getElementById("failQuest");
  const initialDrawBtn = document.getElementById("initialDrawBtn");
  const questArea = document.getElementById("sideQuestArea");
  const activeImage = document.getElementById("activeQuestImage");

  let allQuests = [];
  let availableDeck = [];
  let discardPile = [];
  let activeQuest = null;
  let drawnCards = [null, null];

  fetch("Cards-side_quest.json")
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
    if (availableDeck.length < 2) return alert("ไม่พอให้จั่ว");
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
      : "ยังไม่มีเควสรองที่เลือก";

    if (activeQuest && activeImage) {
      activeImage.src = "images/" + activeQuest.front;
      activeImage.classList.remove("hidden");
    } else if (activeImage) {
      activeImage.classList.add("hidden");
    }

    questImages.forEach((img, index) => {
      const card = drawnCards[index];
      if (card) {
        img.src = "images/" + card.front;
        img.classList.remove("hidden");
        const btn = document.getElementById(`drawBtn${index}`);
        btn.textContent = `ทิ้ง "${card.name}" แล้วจั่วใหม่`;
        btn.classList.remove("hidden");
      } else {
        img.classList.add("hidden");
        document.getElementById(`drawBtn${index}`).classList.add("hidden");
      }
    });

    completeBtn.classList.toggle("hidden", !activeQuest);
    failBtn.classList.toggle("hidden", !activeQuest);
  }
});
