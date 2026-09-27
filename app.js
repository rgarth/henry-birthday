const sealButton = document.getElementById("break-seal");
const rollButton = document.getElementById("roll-btn");
const diceImage = document.getElementById("dice-img");
const diceFace = document.getElementById("dice-face");
const diceStatus = document.getElementById("dice-status");
const journalEntry = document.getElementById("journal-entry");
const rollTitle = document.getElementById("roll-title");
const rollBody = document.getElementById("roll-body");
const aftermath = document.getElementById("aftermath");
const oathForm = document.getElementById("oath-form");
const oathSubmit = document.getElementById("oath-submit");
const oathStatus = document.getElementById("oath-status");
const vow = document.getElementById("vow");
const embers = document.getElementById("embers");
const diceOverlay = document.getElementById("dice-overlay");
const diceBoxEl = document.getElementById("dice-box");

function applyPartyDetails() {
  const dateText = `${PARTY.dateLabel}, ${PARTY.year}`;
  document.getElementById("quest-date").textContent = dateText;
  document.getElementById("detail-date").textContent = dateText;
  document.getElementById("detail-time").textContent = PARTY.time;
  document.getElementById("chosen-name").textContent = PARTY.honoree;
  document.getElementById("chosen-age").textContent = numberToWinters(PARTY.age);

  const place = [PARTY.locationName, PARTY.address].filter(Boolean).join(" — ");
  document.getElementById("detail-place").textContent = place;

  const hostBits = [];
  if (PARTY.hostName) {
    hostBits.push(`The host is ${PARTY.hostName}.`);
  }
  if (PARTY.rsvpEmail) {
    hostBits.push(`Send word to ${PARTY.rsvpEmail}.`);
  }
  if (PARTY.rsvpPhone) {
    hostBits.push(`Or speak it aloud to ${PARTY.rsvpPhone}.`);
  }
  const hostLine = document.getElementById("host-line");
  if (hostBits.length) {
    hostLine.hidden = false;
    hostLine.textContent = hostBits.join(" ");
  }
}

function numberToWinters(age) {
  const words = {
    19: "Nineteen",
    18: "Eighteen",
    20: "Twenty",
    21: "Twenty-one",
  };
  return words[age] ?? String(age);
}

function investigationResult(roll) {
  if (roll === 20) {
    return {
      title: `Natural 20 — Investigation`,
      body: `The house cannot lie to you. You see the whole board: the graves, the green window, the night already circled in red. ${PARTY.honoree} stands at the center of it. The undead are coming on ${PARTY.dateLabel}. You were never a guest. You are a companion.`,
    };
  }
  if (roll === 1) {
    return {
      title: `Critical miss — Investigation`,
      body: `The dark laughs and takes your lantern. Still, a name is pressed into your palm like a brand: ${PARTY.honoree}. Nineteen winters. Friday the 13th. Vanquish what will not stay buried — or be counted among them.`,
    };
  }
  if (roll >= 15) {
    return {
      title: `Investigation ${roll}`,
      body: `Dust lifts from a ledger no living hand should have opened. A quest is written in bone. On ${PARTY.dateLabel}, the veil thins and the dead take the floor. ${PARTY.honoree} has been chosen to bear the burden. The page waits for your name.`,
    };
  }
  if (roll >= 10) {
    return {
      title: `Investigation ${roll}`,
      body: `You find footprints leading to a cellar door that should not exist. Behind it: a date, a name, a hunt. ${PARTY.dateLabel}. ${PARTY.honoree}. The undead will rise. Someone must stand with him.`,
    };
  }
  return {
    title: `Investigation ${roll}`,
    body: `You almost miss it — a whisper in the wallpaper, a heartbeat under the floor. The house wants a party. The dead want a king. ${PARTY.honoree} has been named to stop them on ${PARTY.dateLabel}. Will you come?`,
  };
}

function unlockAftermath() {
  aftermath.hidden = false;
  document.querySelectorAll(".journal a[data-locked]").forEach((link) => {
    link.removeAttribute("data-locked");
  });
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function configureTableDice() {
  if (!window.DICE?.vars) {
    return;
  }
  window.DICE.vars.dice_color = PARTY.diceColor || "#202020";
  window.DICE.vars.label_color = PARTY.diceLabelColor || "#c4a15a";
  if (window.DICE.vars.desk_color !== undefined) {
    window.DICE.vars.desk_color = "#070504";
  }
  if (window.DICE.vars.desk_opacity !== undefined) {
    window.DICE.vars.desk_opacity = 0;
  }
  window.DICE.clearMaterialCache?.();
}

function openDiceOverlay() {
  diceBoxEl.replaceChildren();
  diceOverlay.classList.remove("is-fading");
  diceOverlay.classList.add("is-open");
  diceOverlay.setAttribute("aria-hidden", "false");
}

function closeDiceOverlay() {
  diceOverlay.classList.add("is-fading");
  window.setTimeout(() => {
    diceOverlay.classList.remove("is-open", "is-fading");
    diceOverlay.setAttribute("aria-hidden", "true");
    diceBoxEl.replaceChildren();
  }, 450);
}

function finishRoll(roll) {
  diceImage.classList.add("is-hidden");
  diceFace.hidden = false;
  diceFace.textContent = String(roll);
  const result = investigationResult(roll);
  rollTitle.textContent = result.title;
  rollBody.textContent = result.body;
  journalEntry.hidden = false;
  diceStatus.textContent = "The check is made. The story will not wait.";
  unlockAftermath();
  window.localStorage.setItem("henry-investigation", String(roll));
  window.setTimeout(() => {
    document.getElementById("quest").scrollIntoView({ behavior: "smooth" });
  }, 400);
}

const FORCED_ROLL = 19;

function fallbackRoll() {
  finishRoll(FORCED_ROLL);
}

function throwPhysicalD20() {
  configureTableDice();
  openDiceOverlay();

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (!diceBoxEl.clientWidth || !diceBoxEl.clientHeight || !window.DICE) {
        closeDiceOverlay();
        fallbackRoll();
        return;
      }

      try {
        const box = new window.DICE.dice_box(diceBoxEl);
        box.setDice("1d20");
        box.start_throw(() => [FORCED_ROLL], (notation) => {
          const roll = Number(notation?.resultTotal ?? notation?.result?.[0]);
          if (!Number.isFinite(roll) || roll <= 0) {
            closeDiceOverlay();
            fallbackRoll();
            return;
          }
          window.setTimeout(() => {
            closeDiceOverlay();
            finishRoll(roll);
          }, 1800);
        });
      } catch (error) {
        console.warn("The die refused the table:", error);
        closeDiceOverlay();
        fallbackRoll();
      }
    });
  });
}

function rollDie() {
  if (rollButton.disabled) {
    return;
  }

  rollButton.disabled = true;
  diceFace.hidden = true;
  journalEntry.hidden = true;
  diceImage.classList.remove("is-hidden");
  diceStatus.textContent = "The die is turning…";

  if (prefersReducedMotion() || !window.DICE?.dice_box) {
    fallbackRoll();
    return;
  }

  throwPhysicalD20();
}

function currentChapter() {
  const sections = [
    "missive",
    "house",
    "investigation",
    "quest",
    "chosen",
    "oath",
  ];
  const marker = window.innerHeight * 0.35;
  let active = "missive";
  for (const id of sections) {
    const node = document.getElementById(id);
    if (!node || node.closest(".aftermath")?.hidden) {
      continue;
    }
    const top = node.getBoundingClientRect().top;
    if (top <= marker) {
      active = id;
    }
  }
  return active;
}

function syncJournal() {
  const active = currentChapter();
  document.querySelectorAll(".journal a").forEach((link) => {
    const isCurrent = link.getAttribute("href") === `#${active}`;
    if (isCurrent) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function answerLabel(answer) {
  switch (answer) {
    case "yes":
      return "I will stand with Henry";
    case "maybe":
      return "I am still reading the omens";
    case "no":
      return "The shadows keep me";
    default: {
      const _exhaustive = answer;
      return String(_exhaustive);
    }
  }
}

function answerCopy(answer, name, klass) {
  switch (answer) {
    case "yes":
      return `${name} has sworn to stand with ${PARTY.honoree} as ${klass}. The house has taken the oath.`;
    case "maybe":
      return `${name} is still reading the omens, walking as ${klass}. The night will ask again.`;
    case "no":
      return `${name} remains in the shadows. ${PARTY.honoree} will bear the night without them.`;
    default: {
      const _exhaustive = answer;
      return String(_exhaustive);
    }
  }
}

function rsvpDestination() {
  if (PARTY.formEndpoint) {
    return PARTY.formEndpoint;
  }
  if (PARTY.rsvpEmail) {
    return `https://formsubmit.co/ajax/${encodeURIComponent(PARTY.rsvpEmail)}`;
  }
  return "";
}

function showOathStatus(message, isError) {
  oathStatus.hidden = false;
  oathStatus.textContent = message;
  oathStatus.classList.toggle("is-error", Boolean(isError));
}

function mailtoFallback(name, email, phone, klass, answer) {
  if (!PARTY.rsvpEmail) {
    return;
  }
  const subject = encodeURIComponent(`RSVP for ${PARTY.honoree} — ${name}`);
  const body = encodeURIComponent(
    `${name}\nEmail: ${email}\nPhone: ${phone}\nClass: ${klass}\nAnswer: ${answerLabel(answer)}\n\n${PARTY.dateLabel}, ${PARTY.year}`
  );
  window.location.href = `mailto:${PARTY.rsvpEmail}?subject=${subject}&body=${body}`;
}

async function postRsvp(destination, payload) {
  const response = await fetch(destination, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`The raven was turned back (${response.status})`);
  }
}

async function submitOath(event) {
  event.preventDefault();
  const name = document.getElementById("guest-name").value.trim();
  const email = document.getElementById("guest-email").value.trim();
  const phone = document.getElementById("guest-phone").value.trim();
  const klass = document.getElementById("guest-class").value;
  const trap = document.getElementById("guest-trap").value.trim();
  const selected = oathForm.elements.namedItem("answer");
  const answer = selected instanceof RadioNodeList ? selected.value : "";
  const record = { name, email, phone, klass, answer, at: new Date().toISOString() };
  window.localStorage.setItem("henry-oath", JSON.stringify(record));

  if (trap) {
    vow.hidden = false;
    vow.textContent = answerCopy(answer, name, klass);
    return;
  }

  const destination = rsvpDestination();
  const payload = {
    name,
    email,
    phone,
    class: klass,
    answer: answerLabel(answer),
    night: `${PARTY.dateLabel}, ${PARTY.year}`,
    _replyto: email,
    _subject: `RSVP for ${PARTY.honoree} — ${name}`,
    message: `${name} (${klass}): ${answerLabel(answer)}\nEmail: ${email}\nPhone: ${phone}`,
  };

  oathSubmit.disabled = true;
  showOathStatus("A raven is carrying your word…", false);

  try {
    if (!destination) {
      throw new Error("No raven is bound.");
    }
    await postRsvp(destination, payload);
    vow.hidden = false;
    vow.textContent = `${answerCopy(answer, name, klass)} A raven has taken word to the host.`;
    showOathStatus(
      "The host has received your oath. The hour and the door will follow by raven.",
      false
    );
    oathForm.querySelectorAll("input, select, button").forEach((node) => {
      node.disabled = true;
    });
  } catch (error) {
    console.warn("RSVP delivery failed:", error);
    oathSubmit.disabled = false;
    if (PARTY.rsvpEmail) {
      showOathStatus(
        "The raven faltered. Your mail app will open so you can send the oath yourself.",
        true
      );
      mailtoFallback(name, email, phone, klass, answer);
    } else {
      showOathStatus(
        "The oath is spoken here, but the host has not bound a raven yet. Tell them by other means.",
        true
      );
    }
    vow.hidden = false;
    vow.textContent = answerCopy(answer, name, klass);
  }
}

function startEmbers() {
  if (!embers || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const context = embers.getContext("2d");
  if (!context) {
    return;
  }

  const sparks = Array.from({ length: 42 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.4 + Math.random() * 1.4,
    s: 0.15 + Math.random() * 0.45,
    a: 0.15 + Math.random() * 0.45,
  }));

  function resize() {
    embers.width = window.innerWidth;
    embers.height = window.innerHeight;
  }

  function tick() {
    context.clearRect(0, 0, embers.width, embers.height);
    for (const spark of sparks) {
      spark.y -= spark.s / 180;
      if (spark.y < 0) {
        spark.y = 1;
        spark.x = Math.random();
      }
      context.beginPath();
      context.fillStyle = `rgba(196, 161, 90, ${spark.a})`;
      context.arc(spark.x * embers.width, spark.y * embers.height, spark.r, 0, Math.PI * 2);
      context.fill();
    }
    window.requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize);
  tick();
}

sealButton.addEventListener("click", () => {
  sealButton.classList.add("is-broken");
  document.getElementById("parchment").scrollIntoView({ behavior: "smooth" });
});

rollButton.addEventListener("click", rollDie);
oathForm.addEventListener("submit", submitOath);
window.addEventListener("scroll", syncJournal, { passive: true });

applyPartyDetails();
startEmbers();
syncJournal();

if (window.localStorage.getItem("henry-investigation")) {
  unlockAftermath();
}
