// Collects which works hang in which Prado room, from the Prado's own collection search.
//
// HOW TO RUN (in your own browser, so the Prado's bot check is already passed):
//   1. Open https://www.museodelprado.es/en/explore-artworks and wait for it to load.
//   2. Open DevTools (Cmd+Option+J), click the Console. If Chrome asks, type: allow pasting
//   3. Paste this whole file and press Enter. KEEP THIS TAB VISIBLE (browsers throttle background tabs).
//   4. It is RESUMABLE: progress is saved in this browser after every room. If it stops for any reason
//      (timeout, bot check, closed tab), reload the explore-artworks page and paste the file again; it continues.
//   5. When it says DONE, prado-rooms.json downloads. Move it into research/prado/.
// At any time, window.__pradoDownload() downloads what has been collected so far (a partial file is useful).
// To stop early: window.__pradoStop = true. To start over: localStorage.removeItem("pradoRooms")
//
// It loads each candidate room (Sala 001 ... 099, with optional letter suffixes A-D) the same way the
// website's own room links do, one at a time with a pause, and reads the result cards.

(async () => {
  const BASE = "https://www.museodelprado.es/en/explore-artworks?cidoc:p55_has_current_location=";
  const PAUSE_MS = 700; // between rooms; be gentle with the site
  const WAIT_MS = 7000; // how long to wait for results to render in a room
  const STORE = "pradoRooms";
  const MAX_FAILS = 3; // consecutive errors before stopping (usually the bot check expired)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__pradoStop = false;

  const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const cardsOf = (doc) =>
    [...doc.querySelectorAll("article.card-piece-gallery")].map((a) => {
      const link = a.querySelector("a.card-piece-title");
      const href = link ? link.href : "";
      return {
        url: href,
        uuid: (href.match(/([0-9a-f]{8}-[0-9a-f-]{27})\s*$/i) || [])[1] || "",
        title: text(link),
        detail: text(a.querySelector(".card-piece-detail > div")),
        author: text(a.querySelector(".card-piece-category a")),
        image: (a.querySelector("img.img") || {}).src || "",
      };
    });
  const announced = (doc) => {
    const m = text(doc.body).match(/([\d.,]+)\s+results/i);
    return m ? parseInt(m[1].replace(/[.,]/g, ""), 10) : null;
  };

  async function loadRoom(room, extra = "") {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;left:-9999px;width:1200px;height:900px;";
    frame.src = BASE + encodeURIComponent("Sala " + room) + extra;
    document.body.appendChild(frame);
    try {
      await new Promise((res, rej) => {
        frame.onload = res;
        setTimeout(() => rej(new Error("load timeout")), 20000);
      });
      const doc = frame.contentDocument;
      const start = Date.now();
      let cards = [];
      let n = null;
      while (Date.now() - start < WAIT_MS) {
        cards = cardsOf(doc);
        n = announced(doc);
        if (cards.length > 0 && n !== null) break; // rendered
        if (n === 0) break; // "0 results"
        await sleep(400);
      }
      return { cards, n };
    } finally {
      frame.remove();
    }
  }

  // Plain numbers first (most rooms), then letter suffixes (008B, 051A, 055B, ...).
  const rooms = [];
  for (let i = 1; i <= 99; i++) rooms.push(String(i).padStart(3, "0"));
  for (const sfx of ["A", "B", "C"]) for (let i = 1; i <= 99; i++) rooms.push(String(i).padStart(3, "0") + sfx);

  const out = JSON.parse(localStorage.getItem(STORE) || "null") || { collectedAt: new Date().toISOString(), rooms: {}, checked: [] };
  const checked = new Set(out.checked);
  const save = () => {
    out.checked = [...checked];
    localStorage.setItem(STORE, JSON.stringify(out));
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(out, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "prado-rooms.json";
    a.click();
  };
  window.__pradoDownload = download;
  if (checked.size) console.log(`Resuming: ${checked.size} candidates already checked, ${Object.keys(out.rooms).length} rooms found.`);

  let done = checked.size;
  let fails = 0;
  for (const room of rooms) {
    if (window.__pradoStop) break;
    if (checked.has(room)) continue;
    try {
      let { cards, n } = await loadRoom(room);
      // If the room has more results than one page shows, try the next pages.
      let page = 2;
      while (n && cards.length < n && page <= 40) {
        const more = (await loadRoom(room, "&pagina=" + page)).cards;
        const seen = new Set(cards.map((c) => c.url));
        const fresh = more.filter((c) => !seen.has(c.url));
        if (fresh.length === 0) break;
        cards = cards.concat(fresh);
        page++;
        await sleep(PAUSE_MS);
      }
      fails = 0;
      checked.add(room);
      if (cards.length > 0 || (n || 0) > 0) {
        out.rooms[room] = { announced: n, works: cards };
        console.log(`Sala ${room}: ${cards.length} works (site says ${n})` + (n && cards.length < n ? "  <-- INCOMPLETE" : ""));
      }
    } catch (e) {
      // Not marked as checked, so a re-run retries this room.
      console.warn(`Sala ${room}: ${e}`);
      if (++fails >= MAX_FAILS) {
        save();
        console.error(`Stopped after ${MAX_FAILS} errors in a row (usually the bot check expired). Progress is saved. Reload the explore-artworks page, let it load, and paste this file again.`);
        return;
      }
    }
    save();
    done++;
    if (done % 25 === 0) console.log(`...${done}/${rooms.length} candidates checked`);
    await sleep(PAUSE_MS);
  }

  window.__pradoRooms = out;
  save();
  const total = Object.values(out.rooms).reduce((n, r) => n + r.works.length, 0);
  download();
  console.log(`DONE: ${Object.keys(out.rooms).length} rooms, ${total} works. prado-rooms.json downloaded (also in window.__pradoRooms).`);
})();
