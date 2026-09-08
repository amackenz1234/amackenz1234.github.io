function money(n) {
  return "C$" + Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&", "<": "<", ">": ">", '"': """, "'": "&#39;" }[c];
  });
}
var state = { cat: "All", q: "", open: null, items: window.PRODUCTS || [] };
function filtered() {
  var q = state.q.toLowerCase();
  return state.items.filter(function (i) {
    return (state.cat === "All" || i.category === state.cat) &&
      (i.name + i.sku).toLowerCase().indexOf(q) !== -1;
  });
}
function cats() {
  var set = {};
  state.items.forEach(function (i) { set[i.category] = true; });
  return ["All"].concat(Object.keys(set));
}
function render() {
  var items = filtered();
  var html = "";
  html += '<header><div class="wrap nav"><a class="brand" href="#top">Electro <span>Cycles</span></a><a class="btn" href="tel:9053085392">Call</a></div></header>';
  html += '<section class="hero" id="top"><div class="wrap"><div class="tag">Ontario · Evoque dealer</div><h1>Ride farther.</h1><p class="lede">Custom shop site for Electro Cycles. E-bikes, scooters, mobility, and gear. GST/HST 729028506TZ0001.</p><a class="btn" href="#shop">Shop inventory</a></div></section>';
  html += '<section class="section" id="shop"><div class="wrap"><div class="row" id="cats">';
  cats().forEach(function (c) {
    html += '<button class="chip' + (c === state.cat ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
  });
  html += '</div><input class="search" id="q" value="' + esc(state.q) + '" placeholder="Search" />';
  if (!items.length) html += '<p class="lede">No matches.</p>';
  html += '<div class="grid">';
  items.forEach(function (p) {
    html += '<article class="card" data-sku="' + esc(p.sku) + '"><div class="pic">';
    if (p.image) html += '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">';
    html += '</div><div class="body"><div class="tag">' + esc(p.category) + "</div><h3>" + esc(p.name) + '</h3><div class="price">' + money(p.price) + "</div>";
    if (p.qty <= 0) html += '<div class="out">Special order</div>';
    html += "</div></article>";
  });
  html += "</div></div></section>";
  html += '<section class="section" id="contact"><div class="wrap"><h2>Visit or call</h2><p class="lede">905-308-5392 · info@electrocycles.ca · Ontario</p><a class="ghost" href="mailto:info@electrocycles.ca">Email the shop</a></div></section>';
  html += '<footer><div class="wrap">Electro Cycles · CAD · GST/HST 729028506TZ0001</div></footer>';
  html += '<div class="dock"><a class="shop" href="#shop">Shop</a><a class="call" href="tel:9053085392">Call</a></div>';
  if (state.open) {
    var o = state.open;
    html += '<div class="modal" id="modal"><div class="sheet" id="sheet">';
    if (o.image) html += '<img src="' + esc(o.image) + '" alt="' + esc(o.name) + '">';
    html += '<div class="pad"><div class="tag">' + esc(o.sku) + "</div><h2>" + esc(o.name) + '</h2><div class="price" style="margin:8px 0 12px">' + money(o.price) + '</div><p class="lede">' + esc(o.description) + '</p><div class="row"><a class="btn" href="mailto:info@electrocycles.ca?subject=' + encodeURIComponent(o.name) + '">Ask about this</a><button class="ghost" id="close">Close</button></div></div></div></div>';
  }
  document.getElementById("root").innerHTML = html;
  document.getElementById("cats").onclick = function (e) {
    var b = e.target.closest("[data-cat]");
    if (!b) return;
    state.cat = b.getAttribute("data-cat");
    render();
  };
  var qel = document.getElementById("q");
  qel.oninput = function (e) { state.q = e.target.value; render(); };
  Array.prototype.forEach.call(document.querySelectorAll(".card"), function (card) {
    card.onclick = function () {
      var sku = card.getAttribute("data-sku");
      state.open = state.items.filter(function (i) { return i.sku === sku; })[0] || null;
      render();
    };
  });
  var modal = document.getElementById("modal");
  if (modal) {
    modal.onclick = function (e) { if (e.target.id === "modal") { state.open = null; render(); } };
    var close = document.getElementById("close");
    if (close) close.onclick = function () { state.open = null; render(); };
    var sheet = document.getElementById("sheet");
    if (sheet) sheet.onclick = function (e) { e.stopPropagation(); };
  }
}
render();
