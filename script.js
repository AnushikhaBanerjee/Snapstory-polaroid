document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const art = $("#artboard");
  const slotEls = $$(".photo-slot");
  const layer = $("#decorationLayer");
  const fileInput = $("#photoUpload");

  const LAYOUTS = {
    classic: { count: 1, cls: "classic", name: "CLASSIC POLAROID" },
    duo: { count: 2, cls: "duo", name: "LITTLE DUO" },
    strip: { count: 3, cls: "strip", name: "PHOTO STRIP" },
    collage: { count: 3, cls: "collage", name: "SCRAPBOOK" },
    grid: { count: 4, cls: "minigrid", name: "MINI GRID" },
    film: { count: 3, cls: "film", name: "FILM ROLL" },
  };

  const FILTERS = {
    none: "",
    sepia: "sepia(1)",
    grayscale: "grayscale(1)",
    warm: "sepia(.4) saturate(1.5) brightness(1.05)",
    fade: "contrast(.85) brightness(1.1) saturate(.75)",
    rose: "sepia(.3) hue-rotate(-20deg) saturate(1.3) brightness(1.05)",
  };

  const FONTS = {
    hand: '"Patrick Hand", cursive',
    serif: '"Playfair Display", serif',
    sans: '"DM Sans", sans-serif',
  };

  // ---------- state ----------
  const photoStore = {}; // id -> dataURL
  let photoList = []; // ids in upload order
  let uid = 0;

  const defaultState = () => ({
    layout: "classic",
    paper: "#fffdf8",
    caption: "little moments, big memories",
    date: "made with love · 2026",
    showDate: true,
    shadow: true,
    grain: false,
    round: true,
    slots: [null, null, null, null],
    filters: ["none", "none", "none", "none"],
    decos: [],
  });

  let state = defaultState();
  let selectedSlot = 0;
  let selectedDeco = null;
  let targetSlot = null;

  // ---------- history ----------
  let history = [];
  let hIndex = -1;

  function pushHistory() {
    history = history.slice(0, hIndex + 1);
    history.push(JSON.stringify(state));
    if (history.length > 60) history.shift();
    hIndex = history.length - 1;
  }

  function undo() {
    if (hIndex <= 0) return toast("Nothing to undo");
    hIndex--;
    state = JSON.parse(history[hIndex]);
    selectedDeco = null;
    render();
  }

  function redo() {
    if (hIndex >= history.length - 1) return toast("Nothing to redo");
    hIndex++;
    state = JSON.parse(history[hIndex]);
    selectedDeco = null;
    render();
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  // ---------- photos ----------
  function addPhoto(dataURL) {
    const id = "p" + ++uid;
    photoStore[id] = dataURL;
    photoList.push(id);
    return id;
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const max = 1400;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.88));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function placePhoto(id) {
    const count = LAYOUTS[state.layout].count;
    if (targetSlot !== null && targetSlot < count) {
      state.slots[targetSlot] = id;
      selectedSlot = targetSlot;
      targetSlot = null;
      return;
    }
    for (let i = 0; i < count; i++) {
      if (!state.slots[i]) {
        state.slots[i] = id;
        selectedSlot = i;
        return;
      }
    }
    // all full: replace the selected slot
    state.slots[Math.min(selectedSlot, count - 1)] = id;
  }

  async function handleFiles(files) {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return toast("Please choose an image file.");
    for (const f of list) {
      try {
        const data = await readFile(f);
        placePhoto(addPhoto(data));
      } catch {
        toast("Couldn't read " + f.name);
      }
    }
    pushHistory();
    render();
    toast(list.length > 1 ? "Photos added 📸" : "Photo added 📸");
  }

  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  });
  $(".upload-box").addEventListener("click", () => (targetSlot = null));

  // sample photo (generated, no external file needed)
  function makeSample() {
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 800;
    const g = c.getContext("2d");
    const hue = Math.floor(Math.random() * 360);
    const sky = g.createLinearGradient(0, 0, 0, 800);
    sky.addColorStop(0, `hsl(${hue},70%,75%)`);
    sky.addColorStop(0.6, `hsl(${(hue + 40) % 360},80%,82%)`);
    sky.addColorStop(1, `hsl(${(hue + 70) % 360},70%,88%)`);
    g.fillStyle = sky;
    g.fillRect(0, 0, 800, 800);
    g.fillStyle = "rgba(255,255,255,.9)";
    g.beginPath();
    g.arc(540, 330, 90, 0, Math.PI * 2);
    g.fill();
    [["0.55", 560], ["0.8", 640], ["1", 710]].forEach(([a, y], i) => {
      g.fillStyle = `hsla(${(hue + 200 + i * 20) % 360},35%,${40 - i * 8}%,${a})`;
      g.beginPath();
      g.moveTo(0, 800);
      g.lineTo(0, y);
      for (let x = 0; x <= 800; x += 40)
        g.lineTo(x, y - 40 * Math.sin(x / 120 + i * 2) - 20 * i);
      g.lineTo(800, 800);
      g.fill();
    });
    return c.toDataURL("image/jpeg", 0.9);
  }

  $("#sampleBtn").addEventListener("click", () => {
    targetSlot = null;
    placePhoto(addPhoto(makeSample()));
    pushHistory();
    render();
    toast("Sample photo added ✧");
  });

  // camera
  let stream = null;
  const camModal = $("#cameraModal");
  const video = $("#cameraVideo");

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia)
      return toast("Camera needs HTTPS or localhost (try Live Server).");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      video.srcObject = stream;
      camModal.classList.add("open");
    } catch {
      toast("Please allow camera permission and try again.");
    }
  }

  function closeCamera() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
    camModal.classList.remove("open");
  }

  $("#cameraBtn").addEventListener("click", () => {
    targetSlot = null;
    openCamera();
  });
  $("#closeCameraBtn").addEventListener("click", closeCamera);
  camModal.addEventListener("click", (e) => {
    if (e.target === camModal) closeCamera();
  });
  $("#captureBtn").addEventListener("click", () => {
    if (!video.videoWidth) return toast("Camera isn't ready yet.");
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0);
    placePhoto(addPhoto(c.toDataURL("image/jpeg", 0.9)));
    closeCamera();
    pushHistory();
    render();
    toast("Captured! 📸");
  });

  // slots
  slotEls.forEach((el, i) => {
    el.addEventListener("click", () => {
      selectedSlot = i;
      if (!state.slots[i]) {
        targetSlot = i;
        fileInput.click();
      }
      render();
    });
  });

  // ---------- tabs ----------
  $$(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      $$(".tab-content").forEach((c) =>
        c.classList.toggle("active", c.id === tab.dataset.tab + "Tab")
      );
    })
  );

  // ---------- filters ----------
  $$(".filter").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (!state.slots[selectedSlot])
        return toast("Select a slot that has a photo first.");
      state.filters[selectedSlot] = btn.dataset.filter;
      pushHistory();
      render();
    })
  );

  // ---------- layouts / paper / theme ----------
  $$(".layout-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.layout = btn.dataset.layout;
      selectedSlot = Math.min(selectedSlot, LAYOUTS[state.layout].count - 1);
      pushHistory();
      render();
    })
  );

  $$(".paper").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.paper = btn.dataset.paper;
      pushHistory();
      render();
    })
  );

  $$(".theme-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.body.dataset.theme = btn.dataset.theme;
      $$(".theme-btn").forEach((b) => b.classList.toggle("active", b === btn));
    })
  );

  // ---------- decorations ----------
  function addDeco(d) {
    const deco = Object.assign(
      { id: "d" + ++uid + Date.now(), x: 30 + Math.random() * 40, y: 25 + Math.random() * 40, size: 42, rot: 0 },
      d
    );
    state.decos.push(deco);
    selectedDeco = deco.id;
    pushHistory();
    render();
  }

  $$(".sticker").forEach((btn) =>
    btn.addEventListener("click", () =>
      addDeco({ type: "sticker", content: btn.dataset.sticker })
    )
  );

  $$(".tape").forEach((btn) =>
    btn.addEventListener("click", () =>
      addDeco({ type: "tape", color: btn.dataset.color, size: 36, rot: -12 + Math.random() * 24 })
    )
  );

  function getDeco() {
    return state.decos.find((d) => d.id === selectedDeco);
  }

  function syncSliders() {
    const d = getDeco();
    if (d) {
      $("#stickerSize").value = d.size;
      $("#stickerRotation").value = d.rot;
    }
  }

  $("#stickerSize").addEventListener("input", (e) => {
    const d = getDeco();
    if (!d) return;
    d.size = +e.target.value;
    styleDeco(layer.querySelector(`[data-id="${d.id}"]`), d);
  });
  $("#stickerRotation").addEventListener("input", (e) => {
    const d = getDeco();
    if (!d) return;
    d.rot = +e.target.value;
    styleDeco(layer.querySelector(`[data-id="${d.id}"]`), d);
  });
  ["#stickerSize", "#stickerRotation"].forEach((s) =>
    $(s).addEventListener("change", () => getDeco() && pushHistory())
  );

  $("#deleteStickerBtn").addEventListener("click", removeSelected);

  function removeSelected() {
    if (!getDeco()) return toast("Select a decoration first.");
    state.decos = state.decos.filter((d) => d.id !== selectedDeco);
    selectedDeco = null;
    pushHistory();
    render();
  }

  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (typing) return;
    if ((e.key === "Delete" || e.key === "Backspace") && selectedDeco) {
      e.preventDefault();
      removeSelected();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.shiftKey ? redo() : undo();
    }
  });

  function styleDeco(el, d) {
    if (!el) return;
    el.style.left = d.x + "%";
    el.style.top = d.y + "%";
    el.style.transform = `translate(-50%,-50%) rotate(${d.rot}deg)`;
    if (d.type === "tape") {
      el.style.width = d.size * 2 + "px";
      el.style.height = d.size * 0.55 + "px";
      el.style.background = d.color;
    } else {
      el.style.fontSize = d.size + "px";
      if (d.type === "text") {
        el.style.color = d.color;
        el.style.fontFamily = FONTS[d.font] || FONTS.hand;
      }
    }
  }

  function selectDeco(id) {
    selectedDeco = id;
    $$(".decoration").forEach((el) =>
      el.classList.toggle("selected", el.dataset.id === id)
    );
    syncSliders();
  }

  function buildDeco(d) {
    const el = document.createElement("div");
    el.className =
      "decoration " +
      (d.type === "text" ? "text-decoration" : d.type === "tape" ? "tape-decoration" : "");
    el.dataset.id = d.id;
    if (d.type !== "tape") el.textContent = d.content;
    if (d.id === selectedDeco) el.classList.add("selected");
    styleDeco(el, d);

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectDeco(d.id);
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
      const rect = art.getBoundingClientRect();
      let moved = false;

      const move = (ev) => {
        moved = true;
        d.x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
        d.y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100));
        styleDeco(el, d);
      };
      const up = () => {
        el.style.cursor = "grab";
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        if (moved) pushHistory();
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
    return el;
  }

  // click empty space deselects
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".decoration, .tools-panel, .btn")) {
      if (selectedDeco) selectDeco(null);
    }
  });

  // ---------- text ----------
  function applyCaption() {
    const c = $("#captionInput").value.trim();
    const dt = $("#dateInput").value.trim();
    if (c) state.caption = c;
    if (dt) state.date = dt;
    pushHistory();
    render();
    toast("Caption updated ✦");
  }

  $("#updateCaptionBtn").addEventListener("click", applyCaption);
  ["#captionInput", "#dateInput"].forEach((s) =>
    $(s).addEventListener("keydown", (e) => e.key === "Enter" && applyCaption())
  );

  $("#addTextBtn").addEventListener("click", () => {
    const input = $("#stickerTextInput");
    const text = input.value.trim();
    if (!text) return toast("Type some text first.");
    addDeco({
      type: "text",
      content: text,
      size: 24,
      color: $("#textColor").value,
      font: $("#fontSelect").value,
    });
    input.value = "";
  });
  $("#stickerTextInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#addTextBtn").click();
  });

  // changing font/color applies to selected text
  $("#fontSelect").addEventListener("change", (e) => {
    const d = getDeco();
    if (d && d.type === "text") {
      d.font = e.target.value;
      pushHistory();
      render();
    }
  });
  $("#textColor").addEventListener("change", (e) => {
    const d = getDeco();
    if (d && d.type === "text") {
      d.color = e.target.value;
      pushHistory();
      render();
    }
  });

  $$(".quick-captions button").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.caption = btn.textContent;
      $("#captionInput").value = btn.textContent;
      pushHistory();
      render();
    })
  );

  // ---------- toggles ----------
  const toggles = {
    "#shadowToggle": "shadow",
    "#grainToggle": "grain",
    "#roundToggle": "round",
    "#showDateToggle": "showDate",
  };
  Object.entries(toggles).forEach(([sel, key]) =>
    $(sel).addEventListener("change", (e) => {
      state[key] = e.target.checked;
      pushHistory();
      render();
    })
  );

  // ---------- undo / redo / clear ----------
  $("#undoBtn").addEventListener("click", undo);
  $("#redoBtn").addEventListener("click", redo);
  $("#clearBtn").addEventListener("click", () => {
    state.slots = [null, null, null, null];
    state.filters = ["none", "none", "none", "none"];
    state.decos = [];
    selectedDeco = null;
    pushHistory();
    render();
    toast("Canvas cleared (undo available)");
  });

  // ---------- surprise ----------
  $("#surpriseBtn").addEventListener("click", () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    state.layout = pick(Object.keys(LAYOUTS));
    state.paper = pick($$(".paper").map((p) => p.dataset.paper));
    state.caption = pick(["core memory ♡", "just us things", "stay a little", "the good days ✷"]);
    const count = LAYOUTS[state.layout].count;
    for (let i = 0; i < count; i++)
      if (!state.slots[i] && photoList.length)
        state.slots[i] = pick(photoList);
    for (let i = 0; i < count; i++)
      if (state.slots[i]) state.filters[i] = pick(Object.keys(FILTERS));
    state.decos = [];
    const emojis = $$(".sticker").map((s) => s.dataset.sticker);
    for (let i = 0; i < 3; i++)
      state.decos.push({
        id: "d" + ++uid + Date.now(),
        type: "sticker",
        content: pick(emojis),
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 30 + Math.random() * 30,
        rot: -25 + Math.random() * 50,
      });
    selectedDeco = null;
    pushHistory();
    render();
    toast("Surprise! ✦");
  });

  // ---------- save / restore ----------
  $("#saveBtn").addEventListener("click", () => {
    try {
      const used = {};
      state.slots.forEach((id) => id && (used[id] = photoStore[id]));
      localStorage.setItem(
        "snapstory-draft",
        JSON.stringify({ state, photos: used })
      );
      toast("Draft saved in this browser ♡");
    } catch {
      toast("Couldn't save: photos are too large for browser storage.");
    }
  });

  $("#restoreBtn").addEventListener("click", () => {
    try {
      const raw = localStorage.getItem("snapstory-draft");
      if (!raw) return toast("No saved draft found.");
      const data = JSON.parse(raw);
      Object.entries(data.photos || {}).forEach(([id, url]) => {
        photoStore[id] = url;
        if (!photoList.includes(id)) photoList.push(id);
      });
      state = Object.assign(defaultState(), data.state);
      selectedDeco = null;
      pushHistory();
      render();
      toast("Draft restored ↻");
    } catch {
      toast("Couldn't restore the draft.");
    }
  });

  // ---------- export ----------
  $("#downloadBtn").addEventListener("click", async () => {
    if (typeof html2canvas === "undefined")
      return toast("Export library didn't load. Check your internet.");
    toast("Preparing PNG…");
    try {
      const canvas = await html2canvas(art, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        onclone: (doc) => {
          const a = doc.getElementById("artboard");
          a.style.transform = "none";
          doc.querySelectorAll(".selected").forEach((e) => e.classList.remove("selected"));
          doc.querySelectorAll(".placeholder").forEach((e) => (e.style.display = "none"));
        },
      });
      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "my-snapstory.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast("Exported! 💗");
      }, "image/png");
    } catch {
      toast("Export failed. Try again.");
    }
  });

  // ---------- render ----------
  function isDark(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return 0.299 * r + 0.587 * g + 0.114 * b < 110;
  }

  function render() {
    const L = LAYOUTS[state.layout];

    art.className =
      `artboard layout-${L.cls}` +
      (state.round ? " rounded" : "") +
      (state.shadow ? "" : " no-shadow") +
      (state.grain ? " grain" : "") +
      (isDark(state.paper) ? " dark" : "");
    art.style.setProperty("--paper", state.paper);

    slotEls.forEach((el, i) => {
      const id = state.slots[i];
      const img = el.querySelector("img");
      const ph = el.querySelector(".placeholder");
      el.hidden = i >= L.count;
      el.classList.toggle("selected", i === selectedSlot && i < L.count);
      if (id && photoStore[id]) {
        img.src = photoStore[id];
        img.hidden = false;
        img.style.display = "block";
        img.style.filter = FILTERS[state.filters[i]] || "";
        ph.style.display = "none";
      } else {
        img.removeAttribute("src");
        img.style.display = "none";
        ph.style.display = "flex";
      }
    });

    $("#mainCaption").textContent = state.caption;
    $("#dateCaption").textContent = state.date;
    $("#dateCaption").classList.toggle("hidden", !state.showDate);
    $("#layoutName").textContent = L.name;
    $("#decorationCount").textContent = state.decos.length;

    $$(".layout-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.layout === state.layout)
    );
    $$(".paper").forEach((b) =>
      b.classList.toggle("active", b.dataset.paper === state.paper)
    );
    $$(".filter").forEach((b) =>
      b.classList.toggle("active", b.dataset.filter === (state.filters[selectedSlot] || "none"))
    );

    $("#shadowToggle").checked = state.shadow;
    $("#grainToggle").checked = state.grain;
    $("#roundToggle").checked = state.round;
    $("#showDateToggle").checked = state.showDate;

    // decorations
    layer.innerHTML = "";
    state.decos.forEach((d) => layer.appendChild(buildDeco(d)));
    syncSliders();

    // thumbnails
    $("#photoCount").textContent = photoList.length;
    const thumbs = $("#thumbnails");
    thumbs.innerHTML = "";
    photoList.forEach((id) => {
      const t = document.createElement("img");
      t.className = "thumb" + (state.slots[selectedSlot] === id ? " active" : "");
      t.src = photoStore[id];
      t.alt = "Your photo";
      t.title = "Click to place in the selected slot";
      t.addEventListener("click", () => {
        const slot = Math.min(selectedSlot, LAYOUTS[state.layout].count - 1);
        state.slots[slot] = id;
        pushHistory();
        render();
      });
      thumbs.appendChild(t);
    });

    // mini preview
    const first = state.slots.find((id) => id && photoStore[id]);
    const mp = $("#miniPreview");
    if (first) {
      const idx = state.slots.indexOf(first);
      mp.innerHTML = `<img src="${photoStore[first]}" alt="Preview" style="width:100%;height:100%;object-fit:cover;filter:${FILTERS[state.filters[idx]] || "none"}">`;
    } else {
      mp.innerHTML =
        "<span>✳</span><b>Your story starts here</b><small>Upload a photo to begin</small>";
    }
  }

  // init
  pushHistory();
  render();
});