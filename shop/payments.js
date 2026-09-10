(function () {
  "use strict";

  var HST_RATE = 0.13; // Ontario HST
  var STORAGE_KEY = "ec_cart_v1";
  var cfg = window.PAYMENTS_CONFIG || {};

  function products() { return window.PRODUCTS || []; }
  function find(sku) {
    var list = products();
    for (var i = 0; i < list.length; i++) if (list[i].sku === sku) return list[i];
    return null;
  }
  function money(n) {
    return "C$" + Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }

  var cart = load();
  function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; } }
  function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {} }

  function lines() {
    var out = [];
    Object.keys(cart).forEach(function (sku) {
      var p = find(sku);
      if (p) out.push({ p: p, qty: cart[sku] });
    });
    return out;
  }
  function count() { var n = 0; Object.keys(cart).forEach(function (k) { n += cart[k]; }); return n; }
  function subtotal() { return lines().reduce(function (s, l) { return s + l.p.price * l.qty; }, 0); }
  function tax() { return subtotal() * HST_RATE; }
  function total() { return subtotal() + tax(); }
  function installments() {
    var cents = Math.round(total() * 100);
    var base = Math.floor(cents / 4);
    var rem = cents - base * 4;
    var out = [];
    for (var i = 0; i < 4; i++) out.push((base + (i < rem ? 1 : 0)) / 100);
    return out;
  }

  var ui = { open: false, view: "cart", method: "card", processing: false, order: null, error: "" };

  function add(sku) {
    if (!find(sku)) return;
    cart[sku] = (cart[sku] || 0) + 1;
    persist();
    ui.open = true; ui.view = "cart"; ui.order = null; ui.error = "";
    render();
  }
  function setQty(sku, q) {
    if (q <= 0) delete cart[sku]; else cart[sku] = q;
    persist();
    render();
  }
  function clearCart() { cart = {}; persist(); }

  function openCart() { ui.open = true; ui.view = lines().length ? "cart" : "cart"; ui.error = ""; render(); }
  function close() { ui.open = false; ui.processing = false; ui.error = ""; render(); }

  function stripeEnabled() {
    if (!cfg.stripePublishableKey) return false;
    var ls = lines();
    if (!ls.length) return false;
    for (var i = 0; i < ls.length; i++) {
      if (!cfg.prices || !cfg.prices[ls[i].p.sku]) return false;
    }
    return true;
  }

  function serverEnabled() {
    return !!(cfg.checkoutEndpoint && lines().length);
  }

  function serverCheckout() {
    ui.processing = true; ui.error = ""; render();
    var payload = {
      items: lines().map(function (l) { return { sku: l.p.sku, qty: l.qty }; }),
      origin: location.origin
    };
    fetch(cfg.checkoutEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (d) {
        if (d && d.url) {
          window.location = d.url;
        } else {
          ui.processing = false;
          ui.error = (d && d.error) || "Checkout could not be started.";
          render();
        }
      })
      .catch(function () {
        ui.processing = false;
        ui.error = "Could not reach the checkout server.";
        render();
      });
  }

  function payWithStripe() {
    ui.processing = true; ui.error = ""; render();
    var items = lines().map(function (l) { return { price: cfg.prices[l.p.sku], quantity: l.qty }; });
    function go() {
      try {
        var stripe = window.Stripe(cfg.stripePublishableKey);
        stripe.redirectToCheckout({
          lineItems: items,
          mode: "payment",
          successUrl: location.origin + location.pathname + "?checkout=success",
          cancelUrl: location.origin + location.pathname + "?checkout=cancel"
        }).then(function (res) {
          if (res && res.error) { ui.processing = false; ui.error = res.error.message || "Stripe error."; render(); }
        });
      } catch (e) {
        ui.processing = false; ui.error = "Stripe checkout failed to start."; render();
      }
    }
    if (window.Stripe) return go();
    var s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = go;
    s.onerror = function () { ui.processing = false; ui.error = "Could not load Stripe.js."; render(); };
    document.head.appendChild(s);
  }

  function fail(msg) { ui.error = msg; render(); return false; }

  function payDemo() {
    var name = val("ecp-name"), email = val("ecp-email");
    var card = digits(val("ecp-card")), exp = val("ecp-exp"), cvc = digits(val("ecp-cvc"));

    if (!name) return fail("Enter the cardholder name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Enter a valid email for the receipt.");
    if (card.length < 15) return fail("Enter a card number.");
    var m = exp.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!m) return fail("Enter expiry as MM/YY.");
    var mm = parseInt(m[1], 10), yy = 2000 + parseInt(m[2], 10);
    if (mm < 1 || mm > 12) return fail("Invalid expiry month.");
    if (new Date(yy, mm, 1) <= new Date()) return fail("That card has expired.");
    if (cvc.length < 3) return fail("Enter the 3-digit CVC.");
    if (card !== "4242424242424242") return fail("Demo mode: use test card 4242 4242 4242 4242.");

    ui.error = ""; ui.processing = true; render();
    var paid = total();
    window.setTimeout(function () {
      ui.processing = false;
      ui.order = { id: "EC-" + Date.now().toString(36).toUpperCase().slice(-6), email: email, total: paid, method: "Card" };
      ui.view = "success";
      clearCart();
      render();
    }, 1100);
  }
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }

  function payKlarna() {
    var email = val("ecp-email");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Enter a valid email to continue with Klarna.");
    ui.error = ""; ui.processing = true; render();
    var paid = total();
    window.setTimeout(function () {
      ui.processing = false;
      ui.order = { id: "EC-" + Date.now().toString(36).toUpperCase().slice(-6), email: email, total: paid, method: "Klarna \u2014 Pay in 4" };
      ui.view = "success";
      clearCart();
      render();
    }, 1200);
  }

  function payApplePay() {
    ui.error = ""; ui.processing = true; render();
    var paid = total();
    window.setTimeout(function () {
      ui.processing = false;
      ui.order = { id: "EC-" + Date.now().toString(36).toUpperCase().slice(-6), email: "", total: paid, method: "Apple Pay" };
      ui.view = "success";
      clearCart();
      render();
    }, 1300);
  }

  function checkout() {
    if (!lines().length) return;
    if (serverEnabled()) return serverCheckout();
    if (stripeEnabled()) return payWithStripe();
    if (ui.method === "klarna") return payKlarna();
    if (ui.method === "applepay") return payApplePay();
    payDemo();
  }

  // ---------- view ----------
  function fabHtml() {
    var n = count();
    return (
      '<button type="button" id="ecp-fab" data-ecp="open" aria-label="Open cart">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M7 4h-2l-1 2H2v2h2l3.6 7.6-1.35 2.45A2 2 0 0 0 8 21h11v-2H8.42a.25.25 0 0 1-.22-.37L9 17h7.5a2 2 0 0 0 1.8-1.12l3.58-7.16A1 1 0 0 0 21 7H6.2l-.9-2z"/><circle fill="currentColor" cx="9" cy="21" r="1.6"/><circle fill="currentColor" cx="17.5" cy="21" r="1.6"/></svg>' +
        (n > 0 ? '<span id="ecp-badge">' + n + "</span>" : "") +
      "</button>"
    );
  }

  function cartView() {
    var ls = lines();
    var body;
    if (!ls.length) {
      body = '<div class="ecp-empty"><p>Your cart is empty.</p><button type="button" class="ecp-btn ghost" data-ecp="close">Continue shopping</button></div>';
    } else {
      var rows = ls.map(function (l) {
        var p = l.p;
        return (
          '<div class="ecp-line">' +
            '<div class="ecp-thumb">' + (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">' : "") + "</div>" +
            '<div class="ecp-line-main">' +
              '<div class="ecp-line-name">' + esc(p.name) + "</div>" +
              '<div class="ecp-line-sku">' + esc(p.sku) + " · " + money(p.price) + "</div>" +
              '<div class="ecp-qty">' +
                '<button type="button" data-ecp="dec" data-sku="' + esc(p.sku) + '" aria-label="Decrease">−</button>' +
                "<span>" + l.qty + "</span>" +
                '<button type="button" data-ecp="inc" data-sku="' + esc(p.sku) + '" aria-label="Increase">+</button>' +
                '<button type="button" class="ecp-rm" data-ecp="rm" data-sku="' + esc(p.sku) + '">Remove</button>' +
              "</div>" +
            "</div>" +
            '<div class="ecp-line-total">' + money(p.price * l.qty) + "</div>" +
          "</div>"
        );
      }).join("");
      body =
        '<div class="ecp-lines">' + rows + "</div>" +
        '<div class="ecp-totals">' +
          '<div><span>Subtotal</span><span>' + money(subtotal()) + "</span></div>" +
          '<div><span>HST (13%)</span><span>' + money(tax()) + "</span></div>" +
          '<div class="ecp-grand"><span>Total</span><span>' + money(total()) + "</span></div>" +
          '<div class="ecp-klarna-hint">or 4 interest-free payments of ' + money(installments()[0]) + ' with <span class="ecp-klarna-badge">Klarna</span></div>' +
        "</div>" +
        '<button type="button" class="ecp-btn" data-ecp="to-checkout">Proceed to checkout</button>';
    }
    return header("Your cart") + '<div class="ecp-scroll">' + body + "</div>";
  }

  function cardFields() {
    return (
      '<div class="ecp-field"><label for="ecp-name">Cardholder name</label><input id="ecp-name" type="text" placeholder="Alex Rider" autocomplete="cc-name"></div>' +
      '<div class="ecp-field"><label for="ecp-email">Email for receipt</label><input id="ecp-email" type="email" placeholder="you@example.com" autocomplete="email"></div>' +
      '<div class="ecp-field"><label for="ecp-card">Card number</label><input id="ecp-card" inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="cc-number"></div>' +
      '<div class="ecp-field-row">' +
        '<div class="ecp-field"><label for="ecp-exp">Expiry</label><input id="ecp-exp" inputmode="numeric" placeholder="MM/YY" autocomplete="cc-exp"></div>' +
        '<div class="ecp-field"><label for="ecp-cvc">CVC</label><input id="ecp-cvc" inputmode="numeric" placeholder="123" autocomplete="cc-csc"></div>' +
      "</div>"
    );
  }

  function planRow(label, amt) {
    return '<div class="ecp-plan-row"><span>' + esc(label) + "</span><span>" + money(amt) + "</span></div>";
  }

  var APPLE_LOGO = '<svg class="ecp-ap-logo" viewBox="0 0 384 512" width="13" height="15" aria-hidden="true"><path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';

  function methodTabs() {
    return (
      '<div class="ecp-methods">' +
        '<button type="button" class="ecp-method' + (ui.method === "card" ? " on" : "") + '" data-ecp="method-card">Card</button>' +
        '<button type="button" class="ecp-method' + (ui.method === "applepay" ? " on" : "") + '" data-ecp="method-applepay">' + APPLE_LOGO + " Pay</button>" +
        '<button type="button" class="ecp-method' + (ui.method === "klarna" ? " on" : "") + '" data-ecp="method-klarna"><span class="ecp-klarna-badge">Klarna</span></button>' +
      "</div>"
    );
  }

  function checkoutView() {
    var err = ui.error ? '<div class="ecp-error" role="alert">' + esc(ui.error) + "</div>" : "";
    var summary = '<div class="ecp-summary"><span>' + count() + " item" + (count() === 1 ? "" : "s") + "</span><span>" + money(total()) + "</span></div>";
    var backBtn = '<button type="button" class="ecp-btn ghost" data-ecp="to-cart"' + (ui.processing ? " disabled" : "") + ">Back to cart</button>";

    if (serverEnabled()) {
      return (
        header("Checkout") +
        '<div class="ecp-scroll">' + summary +
          '<p class="ecp-note">Secure checkout by Stripe. You\u2019ll be redirected to complete your purchase with card, Apple Pay, Klarna, and more.</p>' +
          err +
          '<button type="button" class="ecp-btn" data-ecp="pay"' + (ui.processing ? " disabled" : "") + ">" + (ui.processing ? "Starting secure checkout\u2026" : "Checkout \u00b7 " + money(total())) + "</button>" +
          backBtn +
        "</div>"
      );
    }

    if (stripeEnabled()) {
      return (
        header("Checkout") +
        '<div class="ecp-scroll">' + summary +
          '<p class="ecp-note">Secure payment by Stripe — pay with card, Klarna, and more on the next page.</p>' +
          '<div class="ecp-field"><label for="ecp-email">Email for receipt</label><input id="ecp-email" type="email" placeholder="you@example.com" autocomplete="email"></div>' +
          err +
          '<button type="button" class="ecp-btn" data-ecp="pay"' + (ui.processing ? " disabled" : "") + ">" + (ui.processing ? "Processing…" : "Continue to Stripe") + "</button>" +
          backBtn +
        "</div>"
      );
    }

    var body, payLabel, payClass;
    if (ui.method === "klarna") {
      var inst = installments();
      body =
        '<p class="ecp-note">4 interest-free payments of <strong>' + money(inst[0]) + "</strong>, billed every 2 weeks. 0% interest.</p>" +
        '<div class="ecp-plan">' +
          planRow("Today", inst[0]) + planRow("In 2 weeks", inst[1]) + planRow("In 4 weeks", inst[2]) + planRow("In 6 weeks", inst[3]) +
        "</div>" +
        '<div class="ecp-field"><label for="ecp-email">Email</label><input id="ecp-email" type="email" placeholder="you@example.com" autocomplete="email"></div>' +
        '<p class="ecp-note">Demo mode — no real charge. Klarna approval is simulated.</p>';
      payLabel = ui.processing ? "Processing…" : "Pay in 4 with Klarna";
      payClass = "ecp-btn klarna";
    } else if (ui.method === "applepay") {
      body =
        '<p class="ecp-note">Pay with the card in your Apple Wallet, confirmed with Face ID or Touch ID.</p>' +
        '<div class="ecp-applepay"><span>' + APPLE_LOGO + " Pay</span><span>" + money(total()) + "</span></div>" +
        '<p class="ecp-note">Demo mode — no real charge. Apple Pay authorization is simulated.</p>';
      payLabel = ui.processing ? "Confirming…" : (APPLE_LOGO + " Pay");
      payClass = "ecp-btn applepay";
    } else {
      body =
        '<p class="ecp-note">Demo checkout — no real charge. Use test card <strong>4242 4242 4242 4242</strong>, any future expiry, any CVC.</p>' +
        cardFields();
      payLabel = ui.processing ? "Processing…" : "Pay " + money(total());
      payClass = "ecp-btn";
    }

    return (
      header("Checkout") +
      '<div class="ecp-scroll">' + summary + methodTabs() + body + err +
        '<button type="button" class="' + payClass + '" data-ecp="pay"' + (ui.processing ? " disabled" : "") + ">" + payLabel + "</button>" +
        backBtn +
      "</div>"
    );
  }

  function successView() {
    var o = ui.order || { id: "EC-000000", email: "", total: 0 };
    return (
      header("Order confirmed") +
      '<div class="ecp-scroll ecp-success">' +
        '<div class="ecp-check" aria-hidden="true">✓</div>' +
        "<h3>Thank you!</h3>" +
        '<p class="ecp-note">Order <strong>' + esc(o.id) + "</strong> · " + money(o.total) + " paid" + (o.method ? " · " + esc(o.method) : "") + ".</p>" +
        (o.email ? '<p class="ecp-note">A receipt was sent to ' + esc(o.email) + ".</p>" : "") +
        '<button type="button" class="ecp-btn" data-ecp="continue">Continue shopping</button>' +
      "</div>"
    );
  }

  function header(title) {
    return (
      '<div class="ecp-head">' +
        "<h2>" + esc(title) + "</h2>" +
        '<button type="button" class="ecp-x" data-ecp="close" aria-label="Close">×</button>' +
      "</div>"
    );
  }

  function modalHtml() {
    if (!ui.open) return "";
    var inner = ui.view === "success" ? successView() : ui.view === "checkout" ? checkoutView() : cartView();
    return (
      '<div class="ecp-modal" data-ecp="backdrop">' +
        '<div class="ecp-sheet" role="dialog" aria-label="Cart and checkout">' + inner + "</div>" +
      "</div>"
    );
  }

  var rootEl;
  function render() {
    if (!rootEl) return;
    rootEl.innerHTML = fabHtml() + modalHtml();
  }

  function onClick(e) {
    var el = e.target.closest("[data-ecp]");
    if (!el) return;
    var a = el.getAttribute("data-ecp");
    if (a === "backdrop" && e.target !== el) return;
    if (a === "open") return openCart();
    if (a === "close" || a === "backdrop") return close();
    if (a === "inc") return setQty(el.getAttribute("data-sku"), (cart[el.getAttribute("data-sku")] || 0) + 1);
    if (a === "dec") return setQty(el.getAttribute("data-sku"), (cart[el.getAttribute("data-sku")] || 0) - 1);
    if (a === "rm") return setQty(el.getAttribute("data-sku"), 0);
    if (a === "to-checkout") { ui.view = "checkout"; ui.error = ""; return render(); }
    if (a === "to-cart") { ui.view = "cart"; ui.error = ""; return render(); }
    if (a === "method-card") { ui.method = "card"; ui.error = ""; return render(); }
    if (a === "method-applepay") { ui.method = "applepay"; ui.error = ""; return render(); }
    if (a === "method-klarna") { ui.method = "klarna"; ui.error = ""; return render(); }
    if (a === "pay") return checkout();
    if (a === "continue" || a === "done") { ui.view = "cart"; return close(); }
  }

  function onDocClick(e) {
    var addBtn = e.target.closest("[data-add-sku]");
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      add(addBtn.getAttribute("data-add-sku"));
    }
  }

  function onKey(e) {
    if (e.key === "Escape" && ui.open && !ui.processing) close();
  }

  function injectStyles() {
    if (document.getElementById("ecp-style")) return;
    var css =
      "#ecp-fab{position:fixed;right:20px;bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:60;width:56px;height:56px;border-radius:50%;border:0;background:#c1121f;color:#fff;box-shadow:0 10px 26px rgba(0,0,0,.45);cursor:pointer;display:flex;align-items:center;justify-content:center}" +
      "#ecp-fab:hover{background:#e5383b}" +
      "#ecp-badge{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#fff;color:#c1121f;font:800 12px/22px -apple-system,sans-serif;text-align:center}" +
      "@media(min-width:900px){#ecp-fab{bottom:24px}}" +
      ".ecp-modal{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.72);display:flex;justify-content:flex-end}" +
      ".ecp-sheet{width:min(440px,100%);background:#16161a;border-left:1px solid #2a2a30;display:flex;flex-direction:column;max-height:100%;color:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,sans-serif}" +
      ".ecp-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #2a2a30}" +
      ".ecp-head h2{font-size:1.05rem;margin:0}" +
      ".ecp-x{background:transparent;border:0;color:#b7b2a8;font-size:1.8rem;line-height:1;cursor:pointer}" +
      ".ecp-scroll{padding:16px 18px;overflow:auto}" +
      ".ecp-line{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #2a2a30}" +
      ".ecp-thumb{width:64px;height:64px;border-radius:10px;overflow:hidden;background:#09090b;flex:0 0 auto}" +
      ".ecp-thumb img{width:100%;height:100%;object-fit:cover}" +
      ".ecp-line-main{flex:1;min-width:0}" +
      ".ecp-line-name{font-weight:700}" +
      ".ecp-line-sku{color:#b7b2a8;font-size:.8rem;margin:2px 0 8px}" +
      ".ecp-qty{display:flex;align-items:center;gap:8px}" +
      ".ecp-qty button{width:28px;height:28px;border-radius:8px;border:1px solid #2a2a30;background:#1c1c22;color:#f4f1ea;cursor:pointer;font-size:1rem}" +
      ".ecp-qty .ecp-rm{width:auto;padding:0 10px;color:#b7b2a8;border-color:transparent;background:transparent;font-size:.8rem}" +
      ".ecp-line-total{font-weight:800;white-space:nowrap}" +
      ".ecp-totals{margin:16px 0}" +
      ".ecp-totals>div{display:flex;justify-content:space-between;color:#b7b2a8;padding:4px 0}" +
      ".ecp-totals .ecp-grand{color:#f4f1ea;font-weight:800;font-size:1.1rem;border-top:1px solid #2a2a30;margin-top:6px;padding-top:10px}" +
      ".ecp-summary{display:flex;justify-content:space-between;font-weight:800;padding:6px 0 14px;border-bottom:1px solid #2a2a30;margin-bottom:14px}" +
      ".ecp-btn{display:block;width:100%;margin-top:12px;background:#c1121f;color:#fff;border:0;border-radius:12px;padding:14px;font-weight:800;cursor:pointer}" +
      ".ecp-btn:hover{background:#e5383b}" +
      ".ecp-btn[disabled]{opacity:.6;cursor:default}" +
      ".ecp-btn.ghost{background:transparent;border:1px solid #2a2a30;color:#f4f1ea}" +
      ".ecp-field{margin:12px 0}" +
      ".ecp-field label{display:block;font-size:.8rem;color:#b7b2a8;margin-bottom:6px}" +
      ".ecp-field input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid #2a2a30;background:#0f0f12;color:#f4f1ea;font-size:1rem}" +
      ".ecp-field-row{display:flex;gap:12px}.ecp-field-row .ecp-field{flex:1}" +
      ".ecp-note{color:#b7b2a8;font-size:.85rem;margin:6px 0}" +
      ".ecp-error{background:rgba(197,18,31,.15);border:1px solid #c1121f;color:#ffd7d7;border-radius:10px;padding:10px 12px;font-size:.85rem;margin:12px 0}" +
      ".ecp-klarna-badge{display:inline-block;background:#ffb3c7;color:#0c0c0e;font-weight:800;border-radius:6px;padding:1px 7px;font-size:.78rem;letter-spacing:.01em}" +
      ".ecp-klarna-hint{margin-top:10px;color:#b7b2a8;font-size:.8rem}" +
      ".ecp-methods{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}" +
      ".ecp-method{flex:1 1 30%;min-width:88px;padding:12px 8px;border-radius:12px;border:1px solid #2a2a30;background:#0f0f12;color:#f4f1ea;cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px}" +
      ".ecp-method.on{border-color:#c1121f;background:#1c1c22}" +
      ".ecp-ap-logo{vertical-align:-2px}" +
      ".ecp-applepay{display:flex;justify-content:space-between;align-items:center;padding:14px;border:1px solid #2a2a30;border-radius:12px;margin:10px 0;font-weight:800}" +
      ".ecp-btn.applepay{background:#000;color:#fff;display:flex;align-items:center;justify-content:center;gap:6px}" +
      ".ecp-btn.applepay:hover{background:#111}" +
      ".ecp-plan{margin:12px 0;border:1px solid #2a2a30;border-radius:12px;overflow:hidden}" +
      ".ecp-plan-row{display:flex;justify-content:space-between;padding:11px 13px;border-bottom:1px solid #2a2a30;color:#b7b2a8}" +
      ".ecp-plan-row:last-child{border-bottom:0}" +
      ".ecp-plan-row:first-child{color:#f4f1ea;font-weight:700}" +
      ".ecp-btn.klarna{background:#ffb3c7;color:#0c0c0e}" +
      ".ecp-btn.klarna:hover{background:#ff9fb9}" +
      ".ecp-empty{text-align:center;color:#b7b2a8;padding:30px 0}" +
      ".ecp-success{text-align:center}" +
      ".ecp-check{width:64px;height:64px;border-radius:50%;background:#1e7f4f;color:#fff;font-size:2rem;line-height:64px;margin:6px auto 10px}" +
      "@media(max-width:520px){.ecp-sheet{width:100%}}";
    var style = document.createElement("style");
    style.id = "ecp-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    rootEl = document.createElement("div");
    rootEl.id = "ecp";
    document.body.appendChild(rootEl);
    rootEl.addEventListener("click", onClick);
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.ECPayments = { add: add, open: openCart, count: count };
})();
