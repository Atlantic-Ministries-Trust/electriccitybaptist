/* Electric City Baptist Church — interactions */

/* ============================================================
   BREEZE FORMS: paste each form's share link between the quotes.
   Example: "https://ecbc.breezechms.com/form/abc123"
   Leave a link empty ("") to keep that form's built-in version,
   which opens the visitor's email app addressed to the pastor.
   See CHURCH-SETUP.md for step-by-step instructions.
   ============================================================ */
const BREEZE_FORMS = {
  contact: "",   // "Get in Touch" form (Location section)
  prayer: "",    // Prayer request pop-up
  visit: "",     // "Plan Your Visit" form
};

(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Assembled at runtime so scrapers don't harvest it from the HTML.
  const EMAIL = ["Anthony.Stafford", "hotmail.com"].join("@");
  const ADDRESS = "2350 Hamburg St, Schenectady, NY 12303";

  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  if ($("#year")) $("#year").textContent = new Date().getFullYear();
  $$("[data-email]").forEach((a) => { a.href = "mailto:" + EMAIL; });

  /* ---------- Header, menu, theme ---------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const menu = $("#mobileMenu");
  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", String(!open));
    $("#menuOpen").setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("#menuClose").focus();
  };
  $("#menuOpen").addEventListener("click", () => setMenu(true));
  $("#menuClose").addEventListener("click", () => setMenu(false));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false); });

  const themeBtn = $("#themeToggle");
  const applyThemeIcon = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    $("use", themeBtn).setAttribute("href", dark ? "#i-sun" : "#i-moon");
  };
  themeBtn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("ecbc-theme", next);
    applyThemeIcon();
  });
  applyThemeIcon();

  // Highlight the current page in the menus.
  const page = location.pathname.split("/").pop() || "index.html";
  $$(".nav-links a, .mobile-menu a").forEach((a) => {
    if (a.getAttribute("href") === page) { a.classList.add("active"); a.setAttribute("aria-current", "page"); }
  });

  /* ---------- Reveal + parallax ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); } });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el) => revealObs.observe(el));

  const heroBg = $("#heroBg");
  if (heroBg && !reduceMotion) {
    addEventListener("scroll", () => {
      if (scrollY < innerHeight) heroBg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.05)`;
    }, { passive: true });
  }

  /* ---------- Count-up stats ---------- */
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target, target = +el.dataset.count;
      countObs.unobserve(el);
      if (reduceMotion) { el.textContent = target.toLocaleString(); return; }
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ---------- Service countdown (America/New_York) ---------- */
  const TZ = "America/New_York";
  const nyParts = (d) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23", weekday: "short",
    }).formatToParts(d).map((x) => [x.type, x.value]));
    return p;
  };
  // Wall-clock "now" in New York, expressed as a UTC-based Date for easy math.
  const nyNow = () => {
    const p = nyParts(new Date());
    return new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second));
  };
  const nextService = (from = nyNow()) => {
    const d = new Date(from);
    const daysAhead = (7 - d.getUTCDay()) % 7;
    d.setUTCDate(d.getUTCDate() + daysAhead);
    d.setUTCHours(10, 30, 0, 0);
    // If this Sunday's service ended (after ~12:00), roll to next week.
    if (from.getTime() > d.getTime() + 90 * 60000) d.setUTCDate(d.getUTCDate() + 7);
    return d;
  };
  const fmtDate = (d, opts) => d.toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
  const pad = (n) => String(n).padStart(2, "0");
  const card = $("#countdown");
  const tickCountdown = () => {
    const now = nyNow(), svc = nextService(now);
    const diff = svc - now;
    card.classList.toggle("is-live", diff <= 0);
    $("#nextDate").textContent = fmtDate(svc, { weekday: "long", month: "long", day: "numeric" }) + " · 10:30 a.m.";
    const s = Math.max(0, Math.floor(diff / 1000));
    $("#cdD").textContent = Math.floor(s / 86400);
    $("#cdH").textContent = pad(Math.floor((s % 86400) / 3600));
    $("#cdM").textContent = pad(Math.floor((s % 3600) / 60));
    $("#cdS").textContent = pad(s % 60);
  };
  if (card) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  /* ---------- Calendar (.ics) ---------- */
  const icsStamp = (d) => d.toISOString().replace(/[-:]/g, "").slice(0, 15);
  const downloadICS = (date, weekly = true) => {
    const start = icsStamp(date).slice(0, 9) + "103000";
    const end = icsStamp(date).slice(0, 9) + "120000";
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Electric City Baptist Church//EN",
      "BEGIN:VEVENT",
      "UID:" + start + "-ecbc@electriccitybaptist.com",
      "DTSTAMP:" + icsStamp(new Date()) + "Z",
      "DTSTART;TZID=America/New_York:" + start,
      "DTEND;TZID=America/New_York:" + end,
      weekly ? "RRULE:FREQ=WEEKLY;BYDAY=SU" : "",
      "SUMMARY:Sunday Worship · Electric City Baptist Church",
      "LOCATION:" + ADDRESS.replace(/,/g, "\\,"),
      "DESCRIPTION:Everything for Christ\\, by Christ. https://electriccitybaptist.com",
      "END:VEVENT", "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines], { type: "text/calendar" }));
    a.download = "ecbc-sunday-worship.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Calendar invite downloaded 📅");
  };
  $("#addCal")?.addEventListener("click", () => downloadICS(nextService()));

  /* ---------- Plan a visit (multi-step) ---------- */
  if ($("#visitForm")) {
    const form = $("#visitForm");
    const steps = $$(".step", form);
    const bars = $$(".steps-bar i", form);
    let stepIdx = 0;
    const choices = $("#sundayChoices");
    let first = nextService();
    for (let i = 0; i < 4; i++) {
      const d = new Date(first); d.setUTCDate(d.getUTCDate() + i * 7);
      const id = "sun" + i;
      choices.insertAdjacentHTML("beforeend",
        `<div class="choice"><input type="radio" name="sunday" id="${id}" value="${d.toISOString()}" ${i === 0 ? "checked" : ""}>
         <label for="${id}">${fmtDate(d, { month: "short", day: "numeric" })}<small>${i === 0 ? "This coming Sunday" : "Sunday · 10:30 a.m."}</small></label></div>`);
    }
    const showStep = (i) => {
      stepIdx = i;
      steps.forEach((s, j) => s.classList.toggle("active", j === i));
      bars.forEach((b, j) => b.classList.toggle("on", j <= i));
    };
    $$("[data-next]", form).forEach((b) => b.addEventListener("click", () => showStep(stepIdx + 1)));
    $$("[data-prev]", form).forEach((b) => b.addEventListener("click", () => showStep(stepIdx - 1)));
    let chosenSunday = first;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#vName"), email = $("#vEmail");
      for (const f of [name, email]) {
        if (!f.checkValidity()) { f.focus(); f.reportValidity(); return; }
      }
      chosenSunday = new Date(form.sunday.value);
      const when = fmtDate(chosenSunday, { weekday: "long", month: "long", day: "numeric" });
      const party = form.party.value;
      const body = `Hi Pastor Stafford,\n\nI'm planning to visit Electric City Baptist Church on ${when} at 10:30 a.m.\nComing: ${party}\n\n${$("#vNote").value}\n\n${name.value}\n${email.value}`;
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Planning a visit · " + name.value)}&body=${encodeURIComponent(body)}`;
      $("#visitSummary").textContent = `See you ${when} at 10:30 a.m., ${name.value.split(" ")[0]}! Look for us at 2350 Hamburg St.`;
      steps.forEach((s) => s.classList.remove("active"));
      $('[data-step="done"]', form).classList.add("active");
      bars.forEach((b) => b.classList.add("on"));
    });
    $("#visitCal").addEventListener("click", () => downloadICS(chosenSunday, false));
  }

  /* ---------- Media tabs ---------- */
  const tabs = $$(".tab");
  const selectTab = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      const n = tabs[(i + dir + tabs.length) % tabs.length];
      n.focus(); selectTab(n);
    });
  });

  // Open a specific tab from the link, e.g. media.html#quarterly
  const fromHash = tabs.find((t) => t.id === "tab-" + location.hash.slice(1));
  if (fromHash) selectTab(fromHash);

  // Lite YouTube embed: load the iframe only on click.
  $("#videoPoster")?.addEventListener("click", () => {
    $("#videoFrame").innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/MotVsbWxx8M?autoplay=1&rel=0" title="Electric City Baptist Church video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  });

  /* ---------- Podcast ---------- */
  if ($("#epList")) {
    const UP = "https://wp.electriccitybaptist.com/wp-content/uploads/";
    const EPISODES = [
      ["S03E33", "Mysteries of God series finale: Mystery of Lawlessness & Mystery Babylon", "2026-06-21", "260616_s3_e33-post.mp3"],
      ["S03E32", "The Mysteries of God, part 3: The church as Christ's forever Bride", "2026-06-14", "260609_s3_e32-post.mp3"],
      ["S03E31", "The Mysteries of God, part 3: The Mystery of the Rapture and the Mystery of the Restoration of Israel, unlikely bedfellows?", "2026-06-08", "260602_s3_e31-post.mp3"],
      ["S03E30", "The Mysteries of God, part 2: The fullness of deity dwelling bodily in Christ", "2026-05-30", "260526_s3_ep30-post.mp3"],
      ["S03E29", "Mysteries of God Series Introduction: Once Hidden, Now Revealed", "2026-05-24", "260519_s3_e29-post-1.mp3"],
      ["S03E28", "“The Ologies”, Eschatology final installment: the Rapture and the Millennium", "2026-05-17", "260512_s3_ep28-post.mp3"],
      ["S03E27", "Eschatology: How do we know Christ's return is soon?", "2026-05-03", "260428_s3_ep27-post.mp3"],
      ["S03E26", "“The Ologies”, part 11: Eschatology, Are We There Yet?", "2026-04-26", "260421_s3_ep26-post.mp3"],
      ["S03E25", "Angelology: understanding the heavenly realms", "2026-04-19", "260408_s3_ep25-post.mp3"],
      ["S03E24", "“The Ologies”, part 9: Ecclesiology, Truth vs. Myths about the church", "2026-04-04", "260331_s3_ep24-post.mp3"],
    ].map(([code, title, date, file]) => ({ code, title, date, src: UP + file }));

    const audio = $("#audio");
    const list = $("#epList");
    let current = -1;
    // The mini player only appears once something is loaded and the main player is off screen.
    let miniActive = false, mainVisible = false;
    const syncMini = () => $("#miniPlayer").classList.toggle("show", miniActive && !mainVisible);
    new IntersectionObserver(([en]) => { mainVisible = en.isIntersecting; syncMini(); }, { threshold: 0.25 }).observe($("#nowCard"));
    const fmtTime = (s) => {
      if (!isFinite(s)) return "--:--";
      s = Math.floor(s);
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = pad(s % 60);
      return h ? `${h}:${pad(m)}:${sec}` : `${m}:${sec}`;
    };
    const renderList = (q = "") => {
      q = q.trim().toLowerCase();
      const items = EPISODES.map((ep, i) => ({ ep, i })).filter(({ ep }) => !q || (ep.title + " " + ep.code).toLowerCase().includes(q));
      list.innerHTML = items.length ? items.map(({ ep, i }) => `
        <li><button class="ep ${i === current ? "current" : ""}" data-i="${i}" aria-label="Play ${ep.code}: ${ep.title.replace(/"/g, "&quot;")}">
          <span class="ep-play"><svg><use href="#i-${i === current && !audio.paused ? "pause" : "play"}"/></svg></span>
          <span><b>${ep.title}</b><small>${new Date(ep.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</small></span>
          <span class="code">${ep.code}</span>
        </button></li>`).join("") : `<li class="empty">No episodes match “${q}”.</li>`;
    };
    const setPlayIcons = () => {
      const icon = audio.paused ? "#i-play" : "#i-pause";
      $("use", $("#playBtn")).setAttribute("href", icon);
      $("use", $("#miniPlay")).setAttribute("href", icon);
      $("#playBtn").setAttribute("aria-label", audio.paused ? "Play" : "Pause");
      $("#nowCard").classList.toggle("playing", !audio.paused);
      renderList($("#epSearch").value);
    };
    const load = (i, autoplay = true) => {
      const ep = EPISODES[i];
      current = i;
      audio.src = ep.src;
      $("#nowCode").textContent = ep.code + " · Now Playing";
      $("#nowTitle").textContent = ep.title;
      $("#nowDesc").textContent = "Old Lion / Young Lion with Sam Hazleton V and Anthony Stafford.";
      $("#miniTitle").textContent = `${ep.code} · ${ep.title}`;
      miniActive = true;
      syncMini();
      store.set("ecbc-episode", String(i));
      if (autoplay) audio.play().catch(() => toast("Tap play to start the episode"));
      renderList($("#epSearch").value);
    };
    const toggle = () => {
      if (current < 0) return load(0);
      audio.paused ? audio.play() : audio.pause();
    };
    list.addEventListener("click", (e) => {
      const b = e.target.closest(".ep"); if (!b) return;
      const i = +b.dataset.i;
      i === current ? toggle() : load(i);
    });
    $("#epSearch").addEventListener("input", (e) => renderList(e.target.value));
    $("#playBtn").addEventListener("click", toggle);
    $("#miniPlay").addEventListener("click", toggle);
    $("#back15").addEventListener("click", () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
    const fwd = () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 30); };
    $("#fwd30").addEventListener("click", fwd);
    $("#miniFwd").addEventListener("click", fwd);
    const speeds = [1, 1.25, 1.5, 2];
    $("#speedBtn").addEventListener("click", (e) => {
      const n = speeds[(speeds.indexOf(audio.playbackRate) + 1) % speeds.length];
      audio.playbackRate = n; e.currentTarget.textContent = n + "×";
    });
    $("#miniClose").addEventListener("click", () => { audio.pause(); miniActive = false; syncMini(); });
    audio.addEventListener("play", setPlayIcons);
    audio.addEventListener("pause", setPlayIcons);
    audio.addEventListener("ended", () => { if (current < EPISODES.length - 1) load(current + 1); });
    audio.addEventListener("loadedmetadata", () => { $("#tDur").textContent = fmtTime(audio.duration); });
    audio.addEventListener("timeupdate", () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      $("#fill").style.width = pct + "%";
      $("#miniFill").style.width = pct + "%";
      $("#progress").setAttribute("aria-valuenow", Math.round(pct));
      $("#tCur").textContent = fmtTime(audio.currentTime);
      $("#miniTime").textContent = `${fmtTime(audio.currentTime)} / ${fmtTime(audio.duration)}`;
    });
    const progress = $("#progress");
    const seekTo = (clientX) => {
      if (!audio.duration) return;
      const r = progress.getBoundingClientRect();
      audio.currentTime = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * audio.duration;
    };
    progress.addEventListener("pointerdown", (e) => {
      seekTo(e.clientX);
      const move = (ev) => seekTo(ev.clientX);
      addEventListener("pointermove", move);
      addEventListener("pointerup", () => removeEventListener("pointermove", move), { once: true });
    });
    progress.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") audio.currentTime += 10;
      if (e.key === "ArrowLeft") audio.currentTime -= 10;
    });
    renderList();
    const saved = store.get("ecbc-episode");
    if (saved !== null && EPISODES[+saved]) {
      current = +saved;
      audio.src = EPISODES[current].src;
      $("#nowCode").textContent = EPISODES[current].code + " · Pick up where you left off";
      $("#nowTitle").textContent = EPISODES[current].title;
      renderList();
    }
  }

  /* ---------- Beliefs ---------- */
  if ($("#beliefAccordion")) {
    const BELIEFS = [
      { title: "The Bible", text: "We believe the Bible to be the revealed Word of God, fully and verbally inspired of God. We believe the Scriptures to be the inerrant, infallible Word of God, as found within the 66 books from Genesis to Revelation. We believe that God not only inspired every word, but that He has preserved them through the ages.",
        refs: ["Psalm 12:6–7", "II Timothy 3:15–17", "I Peter 1:23–25", "II Peter 1:19–21"] },
      { title: "God", text: "We believe in one God, who is eternal, self-existent, infinite, and immutable. We believe He has one nature, one essence, and one substance; yet manifests Himself to man in three Persons: the Father, the Son, and the Holy Spirit.",
        refs: ["Deuteronomy 6:4", "I Timothy 1:17", "James 1:17", "I John 4:4"] },
      { title: "Jesus", text: "We believe Jesus Christ to be the one and only Saviour of mankind, eternally God and possessing all the attributes of Deity. We believe the Lord Jesus Christ was virgin-born, that He was God incarnate, and that the purposes of the incarnation were to reveal God, to redeem men, and to rule over God's kingdom. He lived a perfect, sinless life, at the end of which He was offered for all mankind as a substitutionary sacrifice for man's sin, a just payment to God for the forgiveness of sin. It was activated by His death through the shedding of His blood on the cross and was accepted by God upon His resurrection. He ascended into Heaven to be seated at the right hand of the Father, and is now waiting for the time of receiving His church at the rapture, which is followed by His return seven years later to earth to rule and reign as King for 1,000 years.",
        refs: ["Psalm 2:7–9", "Isaiah 7:14; 9:6; 43:11", "Micah 5:2", "Matthew 1:25", "Luke 1:26–35", "John 1:1, 3, 14, 18, 29", "Romans 3:19–25", "Romans 5:6–15", "Philippians 2:5–11", "I Thessalonians 4:13–18", "I Timothy 2:5; 3:16", "Titus 2:10–15", "Hebrews 7:26; 9:24–28", "I Peter 1:19; 2:2", "I John 1:3", "Revelation 20:1–6"] },
      { title: "Sin", text: "We believe all men were born with an inherited sin nature received from our common ancestor, Adam. Because of this nature, man is a sinner by choice, and he is totally incapable of reforming himself or ceasing from his sin by his own power. The only hope of deliverance for man is a total change of mind concerning his sinful condition and inability to change it, and a turning to Jesus Christ as the only Saviour. Only through the substitutionary sacrifice of Christ on the cross can a man be delivered from his sin. All those who reject Jesus Christ as their Saviour are already condemned to an eternity in the lake of fire.",
        refs: ["Genesis 5:1–5", "Acts 4:19", "Acts 16:31", "Romans 3:10–23", "Romans 5:6–12", "Romans 6:23", "Romans 10:9–10", "Ephesians 2:8–9", "Titus 3:5–6", "Revelation 20:11–14"] },
      { title: "The Church", text: "We believe that the church began with the calling out of the twelve apostles by Jesus Christ and was empowered on the day of Pentecost. The local church is composed of members who have been saved and baptized according to the command of Christ, and have voluntarily united together for the purposes of worship, fellowship, service, and observance of the ordinances of baptism and communion. We believe all true believers will be taken up at the rapture, just prior to the tribulation.",
        refs: ["Matthew 16:16–18", "Acts 1:15", "Acts 2:41–43", "Acts 11:15", "Acts 20:28", "I Corinthians 15:51–58", "Ephesians 1:12–14", "Ephesians 5:25–30", "I Thessalonians 4:13–18", "I Timothy 3:4–15"] },
    ];
    const acc = $("#beliefAccordion");
    acc.innerHTML = BELIEFS.map((b, i) => `
      <div class="acc ${i === 0 ? "open" : ""}" id="belief-${i}">
        <button class="acc-head" aria-expanded="${i === 0}" aria-controls="belief-body-${i}">
          <span class="n">${pad(i + 1)}</span><h3>${b.title}</h3><span class="plus" aria-hidden="true"></span>
        </button>
        <div class="acc-body" id="belief-body-${i}" role="region"><div><div class="inner">
          <p style="margin-top:0">${b.text}</p>
          <div class="refs">${b.refs.map((r) => `<span>${r}</span>`).join("")}</div>
          <button class="copy-refs" data-i="${i}"><svg><use href="#i-copy"/></svg> Copy references</button>
        </div></div></div>
      </div>`).join("");
    const chips = $("#beliefChips");
    chips.innerHTML = BELIEFS.map((b, i) => `<button class="chip ${i === 0 ? "on" : ""}" data-i="${i}">${b.title}</button>`).join("");
    const openBelief = (i, scroll) => {
      $$(".acc", acc).forEach((a, j) => {
        const on = j === i && !(a.classList.contains("open") && !scroll);
        a.classList.toggle("open", on);
        $(".acc-head", a).setAttribute("aria-expanded", on);
      });
      $$(".chip", chips).forEach((c, j) => c.classList.toggle("on", j === i));
      if (scroll && innerWidth < 1020) document.getElementById("belief-" + i).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    };
    acc.addEventListener("click", (e) => {
      const copy = e.target.closest(".copy-refs");
      if (copy) {
        const b = BELIEFS[+copy.dataset.i];
        navigator.clipboard?.writeText(`${b.title}: ${b.refs.join("; ")}`).then(() => toast("References copied ✓"), () => toast("Couldn't copy, sorry"));
        return;
      }
      const head = e.target.closest(".acc-head");
      if (head) openBelief($$(".acc-head", acc).indexOf(head), false);
    });
    chips.addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) openBelief(+c.dataset.i, true); });
  }

  /* ---------- Contact form ---------- */
  if ($("#contactForm")) {
    const contactForm = $("#contactForm");
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      for (const f of [$("#cName"), $("#cEmail"), $("#cMsg")]) {
        if (!f.value.trim() || !f.checkValidity()) { f.focus(); f.reportValidity(); return; }
      }
      const { name, email, phone, topic, message } = contactForm.elements;
      const body = `${message.value}\n\n${name.value}\n${email.value}${phone.value ? "\n" + phone.value : ""}`;
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Website message: ${topic.value} (${name.value})`)}&body=${encodeURIComponent(body)}`;
      $(".contact-fields", contactForm).hidden = true;
      $("#contactSuccess").hidden = false;
    });
    $("#contactAgain").addEventListener("click", () => {
      contactForm.reset();
      $("#contactSuccess").hidden = true;
      $(".contact-fields", contactForm).hidden = false;
      $("#cName").focus();
    });
  }

  /* ---------- Prayer dialog ---------- */
  if ($("#prayerDialog")) {
    const dlg = $("#prayerDialog");
    $$('[data-open="prayerDialog"]').forEach((b) => b.addEventListener("click", () => dlg.showModal()));
    $("[data-close]", dlg).addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    $("#prayerForm").addEventListener("submit", (e) => {
      const text = $("#prText");
      if (!text.value.trim()) { e.preventDefault(); text.reportValidity(); return; }
      const name = $("#prName").value.trim() || "A friend";
      const priv = $("#prPrivate").checked ? " (PRIVATE: pastor only)" : "";
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Prayer request" + priv)}&body=${encodeURIComponent(text.value + "\n\n— " + name)}`;
      toast("Thank you. We'll be praying 🙏");
      e.target.reset();
    });
  }

  /* ---------- Newsletter ---------- */
  $("#newsletter")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#nlEmail");
    if (!email.checkValidity()) { email.reportValidity(); return; }
    window.open("https://thejesusplace.substack.com/subscribe?email=" + encodeURIComponent(email.value), "_blank", "noopener");
    email.value = "";
  });

  /* ---------- Breeze forms ---------- */
  // Swap a built-in form for the church's Breeze form when a link is set above.
  const breezeUrl = (raw) => {
    try {
      const u = new URL(String(raw).trim());
      return u.protocol === "https:" && u.hostname.endsWith(".breezechms.com") ? u.href : null;
    } catch (e) { return null; }
  };
  const embedBreeze = (container, raw, title) => {
    const url = breezeUrl(raw);
    if (!url) {
      if (String(raw).trim()) console.warn(`BREEZE_FORMS: "${raw}" isn't a Breeze form link; keeping the built-in form.`);
      return;
    }
    container.classList.add("breeze-card");
    container.innerHTML = `
      <iframe class="breeze-frame" src="${url}" title="${title}" loading="lazy"></iframe>
      <p class="form-note">Form not loading? <a href="${url}" target="_blank" rel="noopener">Open it in a new tab</a>.</p>`;
  };
  if ($("#contactForm")) embedBreeze($("#contactForm").parentElement, BREEZE_FORMS.contact, "Contact Electric City Baptist Church");
  if ($("#visitForm")) embedBreeze($("#visitForm").parentElement, BREEZE_FORMS.visit, "Plan your visit");
  if ($("#prayerForm") && breezeUrl(BREEZE_FORMS.prayer)) {
    const holder = document.createElement("div");
    holder.className = "dialog-inner";
    $("#prayerForm").replaceWith(holder);
    embedBreeze(holder, BREEZE_FORMS.prayer, "Prayer request");
    holder.insertAdjacentHTML("afterbegin", '<h3 id="prayerTitle">Prayer Request</h3>');
  }
})();
