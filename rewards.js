/* =========================================================
   REWARD CENTER  (shared by the notebook and every review game)
   Coins, trophies, prizes and free plays, saved on this device for this
   notebook only.
     - A game with 20+ answers: 90% = gold, 80% = silver, 70% = bronze.
       It gives one coin of that kind and counts toward that game's trophy
       (the best trophy is kept).
     - 3 bronze coins turn into 1 silver, 2 silver into 1 gold.
     - 1 gold coin buys a free play: no questions, up to 10 minutes or
       until all 3 lives are gone. It pauses when the app is closed.
     - A gold trophy in a game unlocks that game's prize.
   ========================================================= */
(function(){
  var KEY = "essNotebook.rewards";
  var MIN_Q = 20, FREE_SECS = 600, FREE_LIVES = 3;
  var GAMES = ["hoops", "derby", "paint", "snake", "blasteroids", "zombie"];
  var GAME_NAMES = {
    hoops: ["Basketball", "Baloncesto"], derby: ["Home Run Derby", "Derby de jonrones"], paint: ["Restore the Masters", "Restaura las obras maestras"],
    snake: ["Snake", "La serpiente"], blasteroids: ["Blasteroids", "Blasteroids"], zombie: ["Zombie Horde", "La horda zombi"]
  };
  var PRIZES = {
    hoops: { name: ["Air Jordann's", "Air Jordann's"],
      about: ["Red high tops. Basketball moves up to the cloud court, where you jump higher and get a triple jump.", "Tenis altos rojos. El baloncesto sube a la cancha de nubes, donde saltas más alto y tienes triple salto."] },
    derby: { name: ["Golden Bat", "Bate dorado"], about: ["Your bat shines gold at the plate.", "Tu bate brilla dorado en el plato."] },
    paint: { name: ["Golden Brush", "Pincel dorado"], about: ["Gold sparkles fly off every brush stroke.", "Chispas doradas salen de cada pincelada."] },
    snake: { name: ["Rainbow Snake", "Serpiente arcoíris"], about: ["Your snake glows in rainbow colors.", "Tu serpiente brilla con los colores del arcoíris."] },
    blasteroids: { name: ["Gold Star Fighter", "Nave estrella dorada"], about: ["Your ship turns gold with a golden trail.", "Tu nave se vuelve dorada con una estela dorada."] },
    zombie: { name: ["Laser Squad", "Escuadrón láser"], about: ["Your soldiers glow and fire bright laser shots.", "Tus soldados brillan y disparan rayos láser."] }
  };
  var MEDAL = { g: ["gold", "oro"], s: ["silver", "plata"], b: ["bronze", "bronce"] };
  var RANK = { g: 3, s: 2, b: 1 };

  function tx(lang, pair){ return pair[lang === "es" ? 1 : 0]; }
  function read(){
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    d = d && typeof d === "object" ? d : {};
    return { g: d.g | 0, s: d.s | 0, b: d.b | 0, tr: d.tr || {}, won: d.won || {}, wear: d.wear || {}, free: d.free || null };
  }
  function write(st){ try { localStorage.setItem(KEY, JSON.stringify(st)); return true; } catch (e) { return false; } }
  // 3 bronze make a silver and 2 silver make a gold, all by themselves
  function combine(st){
    var up = [];
    while (st.b >= 3){ st.b -= 3; st.s++; up.push("b"); }
    while (st.s >= 2){ st.s -= 2; st.g++; up.push("s"); }
    return up;
  }
  function medalFor(right, total){
    if (total < MIN_Q) return "";
    var pct = right * 100 / total;
    return pct >= 90 ? "g" : pct >= 80 ? "s" : pct >= 70 ? "b" : "";
  }

  /* a game just ended: save its coin and trophy and say what was won */
  function award(game, right, total){
    var k = medalFor(right, total), res = { game: game, k: k, right: right, total: total, up: [], trophy: "", prize: false };
    if (!k) return res;
    var st = read(), pct = Math.round(right * 100 / total), old = st.tr[game];
    st[k]++;
    res.up = combine(st);
    if (!old || RANK[k] > RANK[old.k] || (k === old.k && pct > old.pct)){
      if (!old || RANK[k] > RANK[old.k]) res.trophy = k;
      st.tr[game] = { k: k, pct: pct, n: total };
    }
    if (k === "g" && !st.won[game]){ st.won[game] = 1; st.wear[game] = 1; res.prize = true; }
    write(st);
    return res;
  }

  function coinHtml(k, size){
    var c = { g: ["#fff6a0", "#f8c800", "#a87000"], s: ["#ffffff", "#c8c8d8", "#707088"], b: ["#ffd8b0", "#d08040", "#7a4010"] }[k];
    size = size || 22;
    return '<span style="display:inline-block;width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:2px solid #000;vertical-align:middle;' +
      'background:radial-gradient(circle at 35% 35%,' + c[0] + ',' + c[1] + ' 45%,' + c[2] + ')"></span>';
  }
  function trophyHtml(k, size){
    var c = { g: ["#ffe680", "#f8c000", "#a87000"], s: ["#ffffff", "#c8c8d8", "#6a6a80"], b: ["#ffd0a0", "#cd7f32", "#6e3a10"], "": ["#4a5a70", "#34465c", "#24324a"] }[k || ""];
    size = size || 34;
    return '<svg viewBox="0 0 40 44" width="' + size + '" height="' + Math.round(size * 1.1) + '" aria-hidden="true" style="vertical-align:middle">' +
      '<path d="M10 6h20v8c0 8-4.5 13-10 13S10 22 10 14z" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="2"/>' +
      '<path d="M10 9H4c0 7 3 10 7 10M30 9h6c0 7-3 10-7 10" fill="none" stroke="' + c[2] + '" stroke-width="2.5"/>' +
      '<path d="M14 9c0 6 1.5 10 4 12" fill="none" stroke="' + c[0] + '" stroke-width="2" stroke-linecap="round" opacity=".8"/>' +
      '<rect x="17" y="27" width="6" height="6" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="1.5"/>' +
      '<rect x="11" y="33" width="18" height="6" rx="1.5" fill="' + c[1] + '" stroke="' + c[2] + '" stroke-width="2"/></svg>';
  }

  /* the rewards box for a score card (it brings its own colors, so it reads on any card) */
  function cardHtml(res, lang){
    var es = lang === "es", lines = [];
    var box = 'margin:12px auto 4px;max-width:420px;padding:10px 12px;border-radius:12px;background:#1b1040;color:#fff4e6;border:2px solid #f8b800;' +
      'font:600 14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;text-align:center';
    if (res.free) return '<div style="' + box + '">' + (es ? "Juego gratis: sin monedas ni trofeos." : "Free play: no coins or trophies.") + "</div>";
    if (!res.k){
      var need = MIN_Q - res.total;
      lines.push(need > 0
        ? (es ? "Contesta " + need + " pregunta" + (need === 1 ? "" : "s") + " más en un juego (20 en total) con 70% o más para ganar una moneda y un trofeo."
              : "Answer " + need + " more question" + (need === 1 ? "" : "s") + " in a game (20 in all) with 70% or better to earn a coin and a trophy.")
        : (es ? "Saca 70% o más en 20 preguntas o más para ganar una moneda y un trofeo." : "Get 70% or better on 20 or more questions to earn a coin and a trophy."));
    } else {
      lines.push(coinHtml(res.k) + " " + (es ? "¡Ganaste una moneda de " + tx(lang, MEDAL[res.k]) + "!" : "You earned a " + tx(lang, MEDAL[res.k]) + " coin!"));
      res.up.forEach(function(u){ lines.push(u === "b" ? (es ? "¡3 de bronce = 1 de plata!" : "3 bronze = 1 silver!") : (es ? "¡2 de plata = 1 de oro!" : "2 silver = 1 gold!")); });
      if (res.trophy) lines.push(trophyHtml(res.trophy, 26) + " " + (es ? "¡Nuevo trofeo de " + tx(lang, MEDAL[res.trophy]) + " en " + tx(lang, GAME_NAMES[res.game]) + "!"
        : "New " + tx(lang, MEDAL[res.trophy]) + " trophy in " + tx(lang, GAME_NAMES[res.game]) + "!"));
      if (res.prize) lines.push('<span style="color:#f8d800">' + (es ? "¡Desbloqueaste: " + tx(lang, PRIZES[res.game].name) + "! Lo llevas puesto. Puedes quitártelo en el Centro de premios."
        : "You unlocked " + tx(lang, PRIZES[res.game].name) + "! You have it on now. You can take it off in the Reward Center.") + "</span>");
    }
    return '<div style="' + box + '">' + lines.join("<br>") + "</div>";
  }

  function wearing(game){ var st = read(); return !!st.won[game] && !!st.wear[game]; }
  function setWear(game, on){ var st = read(); if (!st.won[game]) return; st.wear[game] = on ? 1 : 0; write(st); }

  /* free plays */
  function buyFree(game){
    var st = read();
    if (st.g < 1 || GAMES.indexOf(game) < 0) return false;
    st.g--; st.free = { game: game, left: FREE_SECS, lives: FREE_LIVES };
    return write(st);
  }
  function ticket(game){ var f = read().free; return f && (!game || f.game === game) && f.left > 0 && f.lives > 0 ? f : null; }
  function ticketSave(f){ var st = read(); if (!st.free || st.free.game !== f.game) return; st.free.left = Math.max(0, Math.round(f.left)); st.free.lives = f.lives; write(st); }
  function ticketEnd(){ var st = read(); st.free = null; write(st); }

  /* a free play in progress: 10 minutes and 3 lives, kept on the device so closing
     the app pauses it. o: { game, lang, pause(), resume(), timeUp() } */
  function freeRun(o){
    var f = ticket(o.game);
    if (!f) return null;
    f = { game: f.game, left: f.left, lives: f.lives };
    var last = Date.now(), paused = false, over = false, saveT = 0, ov = null;
    function tick(){
      if (over || paused) return;
      var now = Date.now(), dt = Math.min(1, (now - last) / 1000);  // a long gap means the page was asleep: don't count it
      last = now;
      f.left = Math.max(0, f.left - dt);
      saveT += dt;
      if (saveT >= 1 || f.left <= 0){ saveT = 0; ticketSave(f); }
      if (f.left <= 0){ run.end(); if (o.timeUp) o.timeUp(); }
    }
    var iv = setInterval(tick, 250);
    function showPause(){
      if (ov) return;
      var es = o.lang === "es";
      ov = document.createElement("div");
      ov.setAttribute("style", "position:fixed;inset:0;z-index:2147483000;background:rgba(10,6,30,.88);display:flex;align-items:center;justify-content:center;padding:24px;" +
        'font:700 18px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff4e6;text-align:center');
      ov.innerHTML = '<div><div style="font-size:30px;color:#f8d800;margin-bottom:6px">' + (es ? "PAUSA" : "PAUSED") + "</div>" +
        '<div style="font-weight:600;font-size:15px;margin-bottom:18px">' + (es ? "Tu juego gratis está en pausa." : "Your free play is paused.") + " " + fmt(f.left) + " " + (es ? "restantes" : "left") + "</div>" +
        '<button type="button" style="font:inherit;font-size:18px;padding:14px 28px;border-radius:14px;border:3px solid #000;background:#f8b800;color:#1b1040;cursor:pointer">' + (es ? "SEGUIR JUGANDO" : "KEEP PLAYING") + "</button></div>";
      ov.querySelector("button").onclick = function(){ run.resume(); };
      document.body.appendChild(ov);
    }
    function onHide(){ if (document.visibilityState === "hidden") run.pause(); }
    function onPageHide(){ run.pause(); }
    var run = {
      left: function(){ return f.left; },
      lives: function(){ return f.lives; },
      // a life is gone; returns how many are left (the run ends at 0)
      loseLife: function(){ f.lives = Math.max(0, f.lives - 1); ticketSave(f); if (!f.lives) run.end(); return f.lives; },
      paused: function(){ return paused; },
      pause: function(){
        if (over) return;
        if (!paused){ tick(); paused = true; ticketSave(f); if (o.pause) o.pause(); }
        showPause();
      },
      resume: function(){
        if (ov){ ov.remove(); ov = null; }
        if (over || !paused) return;
        paused = false; last = Date.now();
        if (o.resume) o.resume();
      },
      // the free play is over (time, lives, or the player left): the ticket is used up
      end: function(){
        if (over) return;
        over = true; clearInterval(iv); ticketEnd();
        if (ov){ ov.remove(); ov = null; }
        document.removeEventListener("visibilitychange", onHide);
        window.removeEventListener("pagehide", onPageHide);
      },
      over: function(){ return over; }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return run;
  }
  function fmt(s){ s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  window.NBR = {
    KEY: KEY, MIN_Q: MIN_Q, FREE_SECS: FREE_SECS, FREE_LIVES: FREE_LIVES, GAMES: GAMES, GAME_NAMES: GAME_NAMES, PRIZES: PRIZES, MEDAL: MEDAL,
    read: read, award: award, medalFor: medalFor, cardHtml: cardHtml, coinHtml: coinHtml, trophyHtml: trophyHtml,
    wearing: wearing, setWear: setWear, buyFree: buyFree, ticket: ticket, ticketEnd: ticketEnd, freeRun: freeRun, fmt: fmt
  };
})();
