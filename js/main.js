/* ----------------- Menu Mobile ----------------- */
const btnMenu = document.getElementById("btnMenu");
const mobileNav = document.getElementById("mobileNav");

if (btnMenu) {
  btnMenu.addEventListener("click", () => {
    const open = mobileNav.getAttribute("aria-hidden") === "false";
    mobileNav.setAttribute("aria-hidden", open ? "true" : "false");
    btnMenu.setAttribute("aria-expanded", String(!open));
  });
}
function closeMenu() {
  if (mobileNav) {
    mobileNav.setAttribute("aria-hidden", "true");
    btnMenu.setAttribute("aria-expanded", "false");
  }
}

/* ----------------- Carousel ----------------- */
let currentSlide = 0;
const carousel = document.getElementById("carousel");
const items = document.querySelectorAll(".carousel-item");
const totalSlides = items.length;
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
function updateCarousel() {
  if (!carousel) return;
  carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
}
function nextSlide() {
  if (totalSlides === 0) return;
  currentSlide = (currentSlide + 1) % totalSlides;
  updateCarousel();
}
function prevSlide() {
  if (totalSlides === 0) return;
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateCarousel();
}
if (nextBtn) nextBtn.addEventListener("click", nextSlide);
if (prevBtn) prevBtn.addEventListener("click", prevSlide);
if (totalSlides > 0) setInterval(nextSlide, 5000);

/* ----------------- Chatbot UI & Integration ----------------- */
const openBtn = document.getElementById("chatbotButton");
const modal = document.getElementById("chatbotModal");
const closeBtn = document.getElementById("chatClose");
const messagesBox = document.getElementById("chatMessages");
const input = document.getElementById("chatInput");
const sendBtn = document.getElementById("chatSend");

function addMessage(sender, text) {
  if (!messagesBox) return;
  const d = document.createElement("div");
  d.className = "msg " + (sender === "user" ? "user" : "bot");
  d.innerText = text;
  messagesBox.appendChild(d);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

if (openBtn && modal) {
  openBtn.addEventListener("click", () => {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  });
}
if (closeBtn && modal) {
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
}
if (sendBtn && input) {
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

async function sendMessage() {
  if (!input) return;
  const txt = input.value.trim();
  if (!txt) return;
  addMessage("user", txt);
  input.value = "";
  addMessage("bot", "⏳ Processando...");
  try {
    const reply = await getAiReply(txt);
    // remove last "Processando..." message
    const bots = Array.from(messagesBox.querySelectorAll(".msg.bot"));
    const last = bots.pop();
    if (last && last.innerText.includes("Processando")) last.remove();
    addMessage("bot", reply);
  } catch (err) {
    console.error(err);
    addMessage("bot", "❌ Erro ao conectar com o servidor.");
  }
}

/* ----------------- Call serverless function (Netlify) ----------------- */
/* Endpoint: /.netlify/functions/chat */
async function getAiReply(userText) {
  try {
    const resp = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });
    if (!resp.ok) {
      // Try to parse error
      const txt = await resp.text();
      throw new Error("Server error: " + txt);
    }
    const json = await resp.json();
    if (json.reply) return json.reply;
    // fallback: convert returned choices
    if (json.choices && json.choices[0]) {
      return (
        json.choices[0].text ||
        json.choices[0].message?.content ||
        "Sem resposta."
      );
    }
    return "Sem resposta do servidor.";
  } catch (err) {
    console.warn("getAiReply error", err);
    return "🤖 Chat via servidor (não configurado). Implemente a função serverless e defina a variável GROQ_API_KEY.";
  }
}

/* ----------------- Small fixes ----------------- */
// Ensure video plays inline on iOS
const heroVideo = document.getElementById("heroVideo");
if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.playsInline = true;
  heroVideo.setAttribute("playsinline", "");
}

/* Close mobile nav on orientation change */
window.addEventListener("orientationchange", closeMenu);
