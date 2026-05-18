const screens = {
  start: document.getElementById("startScreen"),
  game: document.getElementById("gameScreen"),
  gameOver: document.getElementById("gameOverScreen"),
  leaderboard: document.getElementById("leaderboardScreen"),
  teacher: document.getElementById("teacherScreen")
};

const ui = {
  runner: document.getElementById("runner"),
  entities: document.getElementById("entities"),
  particles: document.getElementById("particles"),
  gameWorld: document.getElementById("gameWorld"),
  scoreText: document.getElementById("scoreText"),
  playerBadge: document.getElementById("playerBadge"),
  coinsText: document.getElementById("coinsText"),
  levelText: document.getElementById("levelText"),
  livesText: document.getElementById("livesText"),
  timeText: document.getElementById("timeText"),
  playerName: document.getElementById("playerName"),
  nameHint: document.getElementById("nameHint"),
  countdown: document.getElementById("countdown"),
  pauseMenu: document.getElementById("pauseMenu"),
  questionModal: document.getElementById("questionModal"),
  deviceImage: document.getElementById("deviceImage"),
  answerButtons: document.getElementById("answerButtons"),
  questionFeedback: document.getElementById("questionFeedback"),
  finalStats: document.getElementById("finalStats"),
  leaderboardList: document.getElementById("leaderboardList"),
  teacherForm: document.getElementById("teacherForm"),
  customQuestionList: document.getElementById("customQuestionList")
};

const STORAGE = {
  scores: "cyberRunnerScores",
  questions: "cyberRunnerCustomQuestions",
  playerName: "cyberRunnerPlayerName"
};

const internetDeviceImages = {
  Keyboard: "https://commons.wikimedia.org/wiki/Special:FilePath/Computer_keyboard.jpg?width=420",
  Mouse: "https://commons.wikimedia.org/wiki/Special:FilePath/Wireless_computer_mouse.jpg?width=420",
  Monitor: "https://commons.wikimedia.org/wiki/Special:FilePath/Computer_monitor.jpg?width=420",
  Printer: "https://commons.wikimedia.org/wiki/Special:FilePath/Printer.jpg?width=420",
  CPU: "https://commons.wikimedia.org/wiki/Special:FilePath/Intel_CPU_Core_i7_6700K_Skylake_perspective.jpg?width=420",
  USB: "https://commons.wikimedia.org/wiki/Special:FilePath/USBFlashDrive.JPG?width=420",
  Webcam: "https://commons.wikimedia.org/wiki/Special:FilePath/Webcam_01.jpg?width=420",
  Router: "https://commons.wikimedia.org/wiki/Special:FilePath/Wireless_Router.jpg?width=420",
  Speaker: "https://commons.wikimedia.org/wiki/Special:FilePath/Computer_speakers.jpg?width=420",
  Microphone: "https://commons.wikimedia.org/wiki/Special:FilePath/Shure_mikrofon_55S.jpg?width=420",
  Scanner: "https://commons.wikimedia.org/wiki/Special:FilePath/Flatbed_scanner.jpg?width=420",
  Laptop: "https://commons.wikimedia.org/wiki/Special:FilePath/Laptop_PC.jpg?width=420",
  "Hard Drive": "https://commons.wikimedia.org/wiki/Special:FilePath/Hard_disk_drive.jpg?width=420",
  Projector: "https://commons.wikimedia.org/wiki/Special:FilePath/Video_projector.jpg?width=420",
  Tablet: "https://commons.wikimedia.org/wiki/Special:FilePath/IPad_Pro_11%22.jpg?width=420",
  Headphones: "https://commons.wikimedia.org/wiki/Special:FilePath/AKG_K240_headphones.jpg?width=420"
};

const baseQuestions = [
  device("لوحة المفاتيح", ["الفأرة", "الشاشة"], "Keyboard"),
  device("الفأرة", ["الطابعة", "الراوتر"], "Mouse"),
  device("الشاشة", ["المعالج", "ذاكرة USB"], "Monitor"),
  device("الطابعة", ["كاميرا الويب", "السماعات"], "Printer"),
  device("المعالج", ["لوحة المفاتيح", "الميكروفون"], "CPU"),
  device("ذاكرة USB", ["الراوتر", "الشاشة"], "USB"),
  device("كاميرا الويب", ["الطابعة", "المعالج"], "Webcam"),
  device("الراوتر", ["الفأرة", "السماعات"], "Router")
];

let state = {};
let animationId = 0;
let lastTime = 0;
let nextSpawn = 0;
let nextBarrier = 0;
let currentBarrier = null;
let activeQuestion = null;
let touchStart = null;
let gameTimerId = 0;
let musicTimerId = 0;
let musicStep = 0;

function device(answer, wrong, iconName = answer) {
  return {
    answer,
    imageKey: iconName,
    choices: shuffle([answer, ...wrong]),
    image: internetDeviceImages[iconName]
  };
}

function resetState() {
  state = {
    running: false,
    paused: false,
    ended: false,
    lane: 1,
    jumping: false,
    sliding: false,
    score: 0,
    displayScore: 0,
    coins: 0,
    level: 1,
    lives: 3,
    timeLeft: 240,
    endTime: 0,
    answeredQuestions: 0,
    totalQuestions: 0,
    remainingQuestions: [],
    playerName: getPlayerName(),
    speed: 255,
    distance: 0,
    entities: [],
    poweredUntil: 0,
    gameStartedAt: performance.now()
  };
  state.remainingQuestions = shuffle([...getQuestionPool()]);
  state.totalQuestions = state.remainingQuestions.length;
  currentBarrier = null;
  activeQuestion = null;
  ui.entities.innerHTML = "";
  ui.playerBadge.textContent = state.playerName || "---";
  updateHud(true);
  setRunnerClass();
}

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("screen-active"));
  screens[name].classList.add("screen-active");
}

function startGame() {
  const name = getPlayerName();
  if (!name) {
    ui.nameHint.textContent = "اكتب اسمك أولاً حتى نحفظ نتيجتك";
    ui.nameHint.classList.add("error");
    ui.playerName.focus();
    return;
  }
  localStorage.setItem(STORAGE.playerName, name);
  ui.nameHint.textContent = "جاهز للركض";
  ui.nameHint.classList.remove("error");
  resetState();
  showScreen("game");
  runCountdown();
}

function runCountdown() {
  let count = 3;
  ui.countdown.textContent = count;
  ui.countdown.classList.remove("hidden");
  const timer = setInterval(() => {
    count -= 1;
    ui.countdown.textContent = count > 0 ? count : "انطلق";
    playTone(520 + count * 90, 0.08, "triangle");
    if (count < 0) {
      clearInterval(timer);
      ui.countdown.classList.add("hidden");
      state.running = true;
      state.gameStartedAt = performance.now();
      state.endTime = performance.now() + 240000;
      lastTime = performance.now();
      nextSpawn = 350;
      nextBarrier = 900;
      startGameTimer();
      startMusic();
      animationId = requestAnimationFrame(gameLoop);
    }
  }, 760);
}

function gameLoop(time) {
  if (!state.running || state.paused) return;

  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  state.distance += state.speed * dt;
  updateTimeLeft();
  state.speed += dt * 7.5;
  state.level = Math.max(1, Math.floor(state.distance / 1000) + 1);
  state.score += dt * (10 + state.level * 2);

  nextSpawn -= dt * 1000;
  nextBarrier -= dt * 1000;
  if (nextSpawn <= 0) spawnCollectible();
  if (nextBarrier <= 0) spawnBarrier();

  updateEntities(dt);
  updateHud();
  animationId = requestAnimationFrame(gameLoop);
}

function spawnCollectible() {
  const type = Math.random() < 0.82 ? "coin" : "power";
  addEntity(type, randomLane(), -90);
  nextSpawn = Math.max(320, 820 - state.level * 34) + Math.random() * 340;
}

function spawnBarrier() {
  if (state.remainingQuestions.length === 0) return;
  addEntity("barrier", state.lane, -130);
  nextBarrier = Math.max(2600, 4200 - state.level * 120) + Math.random() * 900;
}

function addEntity(type, lane, y) {
  const el = document.createElement("div");
  el.className = `entity ${type}`;
  el.style.setProperty("--lane", lane);
  el.style.setProperty("--y", `${y}px`);
  const entity = { type, lane, y, el, hit: false };
  state.entities.push(entity);
  ui.entities.appendChild(el);
}

function updateEntities(dt) {
  const height = window.innerHeight;
  const collisionY = height - 180;
  state.entities.forEach(entity => {
    entity.y += state.speed * dt;
    entity.el.style.setProperty("--y", `${entity.y}px`);

    const inCollisionBand = entity.y > collisionY - 42 && entity.y < collisionY + 48;
    if (!entity.hit && entity.lane === state.lane && inCollisionBand) {
      handleCollision(entity);
    }
  });

  state.entities = state.entities.filter(entity => {
    const keep = entity.y < height + 120 && !entity.remove;
    if (!keep) entity.el.remove();
    return keep;
  });
}

function handleCollision(entity) {
  entity.hit = true;
  if (entity.type === "coin") {
    state.coins += 1;
    state.score += 15;
    playTone(880, 0.07, "sine");
    entity.remove = true;
    return;
  }

  if (entity.type === "power") {
    state.poweredUntil = performance.now() + 5000;
    state.score += 35;
    state.speed += 30;
    playTone(660, 0.12, "square");
    entity.remove = true;
    return;
  }

  if (entity.type === "barrier") {
    currentBarrier = entity;
    openQuestion();
  }
}

function openQuestion() {
  pauseGame(false);
  activeQuestion = pickQuestion();
  if (!activeQuestion) {
    endGame("فزت! حللت كل الأسئلة", true);
    return;
  }
  ui.deviceImage.innerHTML = "";
  const image = document.createElement("img");
  image.src = activeQuestion.image;
  image.alt = activeQuestion.answer;
  image.onerror = () => {
    ui.deviceImage.innerHTML = "";
    const errorText = document.createElement("span");
    errorText.className = "image-error";
    errorText.textContent = "تعذر تحميل صورة هذا الجهاز";
    ui.deviceImage.appendChild(errorText);
  };
  ui.deviceImage.appendChild(image);
  ui.questionFeedback.textContent = "";
  ui.answerButtons.innerHTML = "";
  shuffle([...activeQuestion.choices]).forEach(choice => {
    const button = document.createElement("button");
    button.className = "answer-btn";
    button.textContent = choice;
    button.addEventListener("click", () => answerQuestion(choice));
    ui.answerButtons.appendChild(button);
  });
  ui.questionModal.classList.remove("hidden");
}

function answerQuestion(choice) {
  if (!activeQuestion) return;
  const correct = choice === activeQuestion.answer;
  if (correct) {
    state.answeredQuestions += 1;
    state.remainingQuestions = state.remainingQuestions.filter(question => question !== activeQuestion);
    ui.questionFeedback.textContent = "إجابة صحيحة! تقدمت في الأسئلة";
    state.score += 150;
    state.speed += 18;
    if (currentBarrier) {
      currentBarrier.el.classList.add("opening");
      currentBarrier.remove = true;
    }
    playTone(920, 0.11, "sine");
    setTimeout(() => {
      ui.questionModal.classList.add("hidden");
      if (state.answeredQuestions >= state.totalQuestions) {
        endGame("فزت! حللت كل الأسئلة", true);
      } else {
        resumeGame();
      }
    }, 760);
  } else {
    ui.questionFeedback.textContent = "إجابة خاطئة! نقصت الطاقة والسرعة";
    ui.questionModal.querySelector(".dialog").classList.add("wrong-flash");
    state.lives -= 1;
    state.score = Math.max(0, state.score - 80);
    state.speed = Math.max(210, state.speed - 45);
    playTone(140, 0.18, "sawtooth");
    setTimeout(() => ui.questionModal.querySelector(".dialog").classList.remove("wrong-flash"), 380);
    if (state.lives <= 0) {
      ui.questionFeedback.textContent = "انتهت الطاقة! الجولة تنتهي...";
      setTimeout(() => {
        ui.questionModal.classList.add("hidden");
        endGame();
      }, 760);
    }
  }
  updateHud(true);
}

function pauseGame(showMenu = true) {
  if (!state.running) return;
  state.paused = true;
  cancelAnimationFrame(animationId);
  stopMusic();
  if (showMenu) ui.pauseMenu.classList.remove("hidden");
}

function resumeGame() {
  if (!state.running) return;
  ui.pauseMenu.classList.add("hidden");
  state.paused = false;
  startMusic();
  lastTime = performance.now();
  animationId = requestAnimationFrame(gameLoop);
}

function endGame(reason = "انتهت الجولة", won = false) {
  if (state.ended) return;
  state.ended = true;
  state.running = false;
  cancelAnimationFrame(animationId);
  clearInterval(gameTimerId);
  stopMusic();
  ui.questionModal.classList.add("hidden");
  ui.pauseMenu.classList.add("hidden");
  saveScore(Math.floor(state.score), state.coins, state.level, state.playerName, won, state.answeredQuestions, state.totalQuestions);
  ui.finalStats.textContent = `${reason} | ${state.playerName} | النقاط: ${Math.floor(state.score)} | الأسئلة: ${state.answeredQuestions}/${state.totalQuestions}`;
  showScreen("gameOver");
}

function moveLane(direction) {
  if (!state.running || state.paused) return;
  state.lane = Math.max(0, Math.min(2, state.lane + direction));
  setRunnerClass();
}

function jump() {
  if (!state.running || state.paused || state.jumping) return;
  state.jumping = true;
  setRunnerClass();
  playTone(420, 0.08, "triangle");
  setTimeout(() => {
    state.jumping = false;
    setRunnerClass();
  }, 620);
}

function slide() {
  if (!state.running || state.paused || state.sliding) return;
  state.sliding = true;
  setRunnerClass();
  setTimeout(() => {
    state.sliding = false;
    setRunnerClass();
  }, 560);
}

function setRunnerClass() {
  ui.runner.className = `runner lane-${state.lane}${state.jumping ? " jumping" : ""}${state.sliding ? " sliding" : ""}`;
}

function updateHud(force = false) {
  updateTimeLeft();
  state.displayScore += (state.score - state.displayScore) * (force ? 1 : 0.18);
  ui.scoreText.textContent = Math.floor(state.displayScore);
  ui.coinsText.textContent = state.coins;
  ui.levelText.textContent = `${state.answeredQuestions}/${state.totalQuestions}`;
  ui.livesText.textContent = state.lives;
  ui.timeText.textContent = formatTime(state.timeLeft);
}

function pickQuestion() {
  return state.remainingQuestions[Math.floor(Math.random() * state.remainingQuestions.length)];
}

function getQuestionPool() {
  return [...baseQuestions, ...loadCustomQuestions()];
}

function updateTimeLeft() {
  if (state.endTime) {
    state.timeLeft = Math.max(0, (state.endTime - performance.now()) / 1000);
  }
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function startGameTimer() {
  clearInterval(gameTimerId);
  gameTimerId = setInterval(() => {
    if (!state.running) return;
    updateHud(true);
    if (state.timeLeft <= 0 && state.answeredQuestions < state.totalQuestions) {
      endGame("انتهى الوقت قبل حل كل الأسئلة");
    }
  }, 250);
}

function randomLane() {
  return Math.floor(Math.random() * 3);
}

function shuffle(items) {
  return items
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(item => item.value);
}

function getPlayerName() {
  return ui.playerName.value.trim();
}

function saveScore(score, coins, level, name, won, answered, total) {
  const scores = loadScores();
  scores.push({ name: name || "لاعب", score, coins, level, won, answered, total, date: new Date().toLocaleDateString("ar") });
  scores.sort((a, b) => Number(b.won) - Number(a.won) || b.score - a.score);
  localStorage.setItem(STORAGE.scores, JSON.stringify(scores.slice(0, 8)));
}

function loadScores() {
  return JSON.parse(localStorage.getItem(STORAGE.scores) || "[]");
}

function renderLeaderboard() {
  const scores = loadScores();
  ui.leaderboardList.innerHTML = "";
  if (!scores.length) {
    const empty = document.createElement("li");
    empty.textContent = "لا توجد نتائج بعد. ابدأ جولة وسجل أول رقم.";
    ui.leaderboardList.appendChild(empty);
    return;
  }
  scores.forEach(item => {
    const row = document.createElement("li");
    const status = item.won ? "فاز وحل كل الأسئلة" : "لم يحل كل الأسئلة";
    row.textContent = `${item.name || "لاعب"} | ${status} | ${item.answered || 0}/${item.total || "؟"} أسئلة | ${item.score} نقطة | ${item.date}`;
    ui.leaderboardList.appendChild(row);
  });
}

function loadCustomQuestions() {
  return JSON.parse(localStorage.getItem(STORAGE.questions) || "[]");
}

function saveCustomQuestions(questions) {
  localStorage.setItem(STORAGE.questions, JSON.stringify(questions));
}

function renderCustomQuestions() {
  const questions = loadCustomQuestions();
  ui.customQuestionList.innerHTML = "";
  if (!questions.length) {
    const empty = document.createElement("div");
    empty.className = "custom-item";
    const title = document.createElement("strong");
    const status = document.createElement("span");
    title.textContent = "لا توجد أسئلة مخصصة بعد";
    status.textContent = "جاهز";
    empty.append(title, status);
    ui.customQuestionList.appendChild(empty);
    return;
  }
  questions.forEach(question => {
    const row = document.createElement("div");
    const title = document.createElement("strong");
    const count = document.createElement("span");
    row.className = "custom-item";
    title.textContent = question.answer;
    count.textContent = `${question.choices.length} اختيارات`;
    row.append(title, count);
    ui.customQuestionList.appendChild(row);
  });
}

function makeDeviceIcon(name) {
  const icon = getIconMarkup(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#24f2ff"/>
          <stop offset="1" stop-color="#ff3df2"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="220" height="220" rx="24" fill="#090d1d"/>
      <circle cx="110" cy="110" r="88" fill="none" stroke="#24f2ff" stroke-width="3" opacity=".25"/>
      <g filter="url(#glow)" fill="none" stroke="url(#g)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getIconMarkup(name) {
  const icons = {
    Keyboard: `<rect x="42" y="78" width="136" height="76" rx="10"/><path d="M58 98h12M86 98h12M114 98h12M142 98h12M58 122h12M86 122h12M114 122h12M142 122h12M72 144h76"/>`,
    Mouse: `<rect x="78" y="42" width="64" height="136" rx="32"/><path d="M110 44v42M84 94h52"/>`,
    Monitor: `<rect x="42" y="54" width="136" height="90" rx="8"/><path d="M110 144v28M78 174h64"/>`,
    Printer: `<path d="M70 74V48h80v26M58 122H42V84h136v38h-16M66 118h88v48H66zM70 96h4"/>`,
    CPU: `<rect x="60" y="44" width="100" height="132" rx="10"/><path d="M84 68h52M84 94h52M84 120h52M88 148h8M122 148h10"/>`,
    USB: `<path d="M110 44v86M86 82l24-24 24 24M90 130h40v36H90zM110 130v36"/>`,
    Webcam: `<circle cx="110" cy="94" r="48"/><circle cx="110" cy="94" r="16"/><path d="M86 152h48M70 176h80"/>`,
    Router: `<rect x="52" y="104" width="116" height="54" rx="10"/><path d="M78 104 58 58M142 104l20-46M82 130h8M108 130h8M134 130h8"/>`,
    Speaker: `<path d="M54 124h32l42 34V62L86 96H54zM148 92c12 12 12 42 0 54M166 74c24 28 24 62 0 90"/>`,
    Microphone: `<rect x="82" y="38" width="56" height="98" rx="28"/><path d="M58 104c0 36 104 36 104 0M110 140v34M82 176h56"/>`,
    Scanner: `<rect x="48" y="92" width="124" height="62" rx="10"/><path d="M66 92l18-36h72l16 36M76 124h68M152 124h4"/>`,
    Laptop: `<rect x="56" y="54" width="108" height="76" rx="8"/><path d="M42 162h136l-18-32H60zM90 146h40"/>`,
    "Hard Drive": `<rect x="62" y="42" width="96" height="136" rx="16"/><circle cx="110" cy="96" r="28"/><circle cx="110" cy="96" r="7"/><path d="M86 148h48"/>`,
    Projector: `<rect x="52" y="78" width="116" height="66" rx="12"/><circle cx="88" cy="112" r="20"/><path d="M126 104h28M126 124h18M74 144v24M146 144v24"/>`,
    Tablet: `<rect x="70" y="36" width="80" height="148" rx="16"/><path d="M92 58h36M106 164h8"/>`,
    Headphones: `<path d="M62 116v-8c0-36 96-36 96 0v8M62 116v38h28v-48H62zM158 116v38h-28v-48h28z"/>`
  };
  return icons[name] || `<rect x="58" y="58" width="104" height="104" rx="18"/><path d="M82 110h56M110 82v56"/>`;
}

let audioContext;
function playTone(frequency, duration, type) {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn("Audio unavailable", error);
  }
}

function startMusic() {
  if (musicTimerId) return;
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const melody = [392, 494, 587, 659, 587, 494, 440, 494, 523, 659, 784, 659, 587, 523, 494, 440];
    const bass = [98, 98, 131, 131, 147, 147, 131, 131];
    musicTimerId = setInterval(() => {
      if (!state.running || state.paused) return;
      const note = melody[musicStep % melody.length];
      const bassNote = bass[musicStep % bass.length];
      playSongTone(note, 0.12, "triangle", 0.035);
      if (musicStep % 2 === 0) playSongTone(bassNote, 0.16, "sine", 0.03);
      if (musicStep % 4 === 1) playSongTone(note * 1.5, 0.05, "square", 0.018);
      if (musicStep % 2 === 1) playSongTone(1200, 0.025, "triangle", 0.012);
      musicStep += 1;
    }, 185);
  } catch (error) {
    console.warn("Music unavailable", error);
  }
}

function stopMusic() {
  clearInterval(musicTimerId);
  musicTimerId = 0;
}

function playSongTone(frequency, duration, type, volume) {
  try {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn("Song unavailable", error);
  }
}

function createParticles() {
  ui.particles.innerHTML = "";
  for (let i = 0; i < 58; i += 1) {
    const dot = document.createElement("span");
    dot.className = "particle";
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.animationDuration = `${4 + Math.random() * 5}s`;
    dot.style.animationDelay = `${Math.random() * 5}s`;
    dot.style.opacity = `${0.35 + Math.random() * 0.65}`;
    ui.particles.appendChild(dot);
  }
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("playAgainBtn").addEventListener("click", startGame);
document.getElementById("mainMenuBtn").addEventListener("click", () => showScreen("start"));
document.getElementById("pauseBtn").addEventListener("click", () => pauseGame(true));
document.getElementById("resumeBtn").addEventListener("click", resumeGame);
document.getElementById("restartFromPauseBtn").addEventListener("click", () => {
  ui.pauseMenu.classList.add("hidden");
  startGame();
});
document.getElementById("quitFromPauseBtn").addEventListener("click", () => {
  state.running = false;
  ui.pauseMenu.classList.add("hidden");
  showScreen("start");
});
document.getElementById("leaderboardBtn").addEventListener("click", () => {
  renderLeaderboard();
  showScreen("leaderboard");
});
document.getElementById("gameOverLeaderboardBtn").addEventListener("click", () => {
  renderLeaderboard();
  showScreen("leaderboard");
});
document.getElementById("leaderboardBackBtn").addEventListener("click", () => showScreen("start"));
document.getElementById("clearScoresBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE.scores);
  renderLeaderboard();
});
document.getElementById("teacherBtn").addEventListener("click", () => {
  renderCustomQuestions();
  showScreen("teacher");
});
document.getElementById("teacherBackBtn").addEventListener("click", () => showScreen("start"));
document.getElementById("resetQuestionsBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE.questions);
  renderCustomQuestions();
});

ui.teacherForm.addEventListener("submit", event => {
  event.preventDefault();
  const answer = document.getElementById("teacherAnswer").value.trim();
  const image = document.getElementById("teacherImage").value.trim();
  const wrong1 = document.getElementById("teacherWrong1").value.trim();
  const wrong2 = document.getElementById("teacherWrong2").value.trim();
  const questions = loadCustomQuestions();
  questions.push({ answer, image, choices: shuffle([answer, wrong1, wrong2]) });
  saveCustomQuestions(questions);
  ui.teacherForm.reset();
  renderCustomQuestions();
});

ui.playerName.value = localStorage.getItem(STORAGE.playerName) || "";

window.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") moveLane(-1);
  if (event.key === "ArrowRight") moveLane(1);
  if (event.key === "ArrowUp") jump();
  if (event.key === "ArrowDown") slide();
  if (event.key.toLowerCase() === "p") state.paused ? resumeGame() : pauseGame(true);
  if (event.key === "Escape" && state.running) pauseGame(true);
});

ui.gameWorld.addEventListener("touchstart", event => {
  touchStart = event.changedTouches[0];
}, { passive: true });

ui.gameWorld.addEventListener("touchend", event => {
  if (!touchStart) return;
  const touchEnd = event.changedTouches[0];
  const dx = touchEnd.clientX - touchStart.clientX;
  const dy = touchEnd.clientY - touchStart.clientY;
  if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
  else if (dy < -25) jump();
  else if (dy > 25) slide();
  touchStart = null;
}, { passive: true });

createParticles();
resetState();
