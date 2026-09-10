(function () {
  "use strict";

  var EXAMPLES = [
    "A habit tracker with streaks and widgets",
    "A local cafe finder with maps and favorites",
    "A personal finance app with budgets",
    "A meditation timer with Live Activities",
    "Electro Cycles shop with product catalog"
  ];

  var KW = {
    import: 1, struct: 1, class: 1, enum: 1, protocol: 1, extension: 1,
    var: 1, let: 1, func: 1, return: 1, if: 1, else: 1, some: 1, private: 1,
    public: 1, static: 1, in: 1, self: 1, nil: 1, true: 1, false: 1,
    for: 1, while: 1, guard: 1, switch: 1, case: 1, break: 1, continue: 1,
    where: 1, as: 1, is: 1, try: 1, await: 1, async: 1, throws: 1, override: 1,
    mutating: 1, inout: 1, init: 1, associatedtype: 1, default: 1
  };

  var TEAMS = [
    { id: "A1B2C3D4E5", name: "Personal Team", role: "Account Holder" },
    { id: "X9Y8Z7W6V5", name: "Nativ Demo LLC", role: "Admin" }
  ];

  var savedAccount = null;
  try {
    savedAccount = JSON.parse(localStorage.getItem("nativ.appleAccount") || "null");
  } catch (e) {
    savedAccount = null;
  }

  var state = {
    view: "landing",
    prompt: "",
    appName: "MyApp",
    template: "generic",
    activeFile: "",
    files: {},
    building: false,
    built: false,
    opening: false,
    logs: [],
    compileTimer: null,
    submitOpen: false,
    submitStep: 0,
    submitting: false,
    linkOpen: false,
    linkMethod: "signin",
    linking: false,
    linkStep: 0,
    password: "",
    otp: "",
    apiKey: "",
    appleId: (savedAccount && savedAccount.appleId) || "",
    teamName: (savedAccount && savedAccount.teamName) || "",
    teamId: (savedAccount && savedAccount.teamId) || "",
    issuerId: (savedAccount && savedAccount.issuerId) || "",
    keyId: (savedAccount && savedAccount.keyId) || "",
    accountLinked: !!(savedAccount && savedAccount.linked),
    pendingSubmitAfterLink: false,
    bundleId: "",
    toast: null,
    toastTimer: null
  };

  function persistAccount() {
    var payload = {
      linked: state.accountLinked,
      appleId: state.appleId,
      teamId: state.teamId,
      teamName: state.teamName,
      issuerId: state.issuerId,
      keyId: state.keyId
    };
    try {
      localStorage.setItem("nativ.appleAccount", JSON.stringify(payload));
    } catch (e) {}
  }

  function accountLabel() {
    if (!state.accountLinked) return "Link Apple Developer";
    return state.teamName || state.appleId || "Apple Developer";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function detectTemplate(prompt) {
    var p = (prompt || "").toLowerCase();
    if (/electro|e-?bike|evoque|scooter|catalog/.test(p)) return "electro";
    if (/habit|streak/.test(p)) return "habit";
    if (/cafe|coffee|map|finder/.test(p)) return "cafe";
    if (/finance|budget|money/.test(p)) return "finance";
    if (/meditat|breath|mindful/.test(p)) return "meditation";
    return "generic";
  }

  function deriveName(prompt) {
    var template = detectTemplate(prompt);
    if (template === "electro") return "ElectroCycles";
    if (template === "habit") return "HabitKit";
    if (template === "cafe") return "CafeFinder";
    if (template === "finance") return "Budgetly";
    if (template === "meditation") return "Stillness";
    var p = (prompt || "").trim();
    if (!p) return "MyApp";
    var words = p.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    var pick = words.slice(0, 2).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
    return (pick.join("") || "MyApp").slice(0, 24);
  }

  function previewItems(prompt) {
    var template = detectTemplate(prompt);
    if (template === "habit") {
      return [
        ["Morning run", "7-day streak"],
        ["Read 20 pages", "On track"],
        ["Drink water", "5 / 8 cups"]
      ];
    }
    if (template === "cafe") {
      return [
        ["Harbor Roast", "0.4 mi · Open"],
        ["Bean Theory", "0.9 mi · Busy"],
        ["Northside Pour", "1.2 mi · Quiet"]
      ];
    }
    if (template === "finance") {
      return [
        ["Groceries", "$186 remaining"],
        ["Transit", "$42 remaining"],
        ["Fun", "$95 remaining"]
      ];
    }
    if (template === "meditation") {
      return [
        ["Breath focus", "10 min"],
        ["Body scan", "15 min"],
        ["Evening wind-down", "8 min"]
      ];
    }
    if (template === "electro") {
      return [
        ["Evoque Bandit", "$5,499 · E-Bikes"],
        ["Stinger Plus", "$4,449 · E-Scooters"],
        ["Streetster RR", "$8,599 · E-Bikes"]
      ];
    }
    return [
      ["Getting started", "Built with Nativ"],
      ["Your first screen", "Native SwiftUI"],
      ["Ready to ship", "App Store Connect"]
    ];
  }

  function filesFor(template, appName) {
    var plist =
      "<!-- App Store Connect ready -->\n" +
      "<key>CFBundleDisplayName</key>\n" +
      "<string>" + appName + "</string>\n" +
      "<key>CFBundleShortVersionString</key>\n" +
      "<string>1.0.0</string>\n" +
      "<key>UILaunchScreen</key>\n" +
      "<dict/>";

    if (template === "electro") {
      return {
        "ElectroCyclesApp.swift":
          "import SwiftUI\n\n" +
          "@main\n" +
          "struct ElectroCyclesApp: App {\n" +
          "    @State private var store = ShopStore()\n\n" +
          "    var body: some Scene {\n" +
          "        WindowGroup {\n" +
          "            MainTabView()\n" +
          "                .environment(store)\n" +
          "                .preferredColorScheme(.dark)\n" +
          "        }\n" +
          "    }\n" +
          "}",
        "ShopHomeView.swift":
          "import SwiftUI\n\n" +
          "struct ShopHomeView: View {\n" +
          "    @Environment(ShopStore.self) private var store\n\n" +
          "    var body: some View {\n" +
          "        NavigationStack {\n" +
          "            ScrollView {\n" +
          "                LazyVStack(spacing: 14) {\n" +
          "                    ForEach(store.products) { product in\n" +
          "                        ProductCard(product: product)\n" +
          "                    }\n" +
          "                }\n" +
          "                .padding()\n" +
          "            }\n" +
          "            .navigationTitle(\"Electro Cycles\")\n" +
          "        }\n" +
          "    }\n" +
          "}",
        "Product.swift":
          "import Foundation\n\n" +
          "struct Product: Identifiable, Hashable {\n" +
          "    var id: String { sku }\n" +
          "    var sku: String\n" +
          "    var name: String\n" +
          "    var category: String\n" +
          "    var price: Double\n" +
          "    var quantity: Int\n" +
          "}",
        "Info.plist": plist
      };
    }

    if (template === "habit") {
      return {
        "HabitKitApp.swift": appMain(appName),
        "ContentView.swift":
          "import SwiftUI\n\n" +
          "struct ContentView: View {\n" +
          "    @State private var habits = Habit.sample\n\n" +
          "    var body: some View {\n" +
          "        NavigationStack {\n" +
          "            List(habits) { habit in\n" +
          "                HStack {\n" +
          "                    VStack(alignment: .leading) {\n" +
          "                        Text(habit.title).font(.headline)\n" +
          "                        Text(\"\\(habit.streak) day streak\").foregroundStyle(.secondary)\n" +
          "                    }\n" +
          "                    Spacer()\n" +
          "                    Image(systemName: habit.doneToday ? \"checkmark.circle.fill\" : \"circle\")\n" +
          "                }\n" +
          "            }\n" +
          "            .navigationTitle(\"" + appName + "\")\n" +
          "        }\n" +
          "    }\n" +
          "}",
        "Habit.swift":
          "import Foundation\n\n" +
          "struct Habit: Identifiable {\n" +
          "    let id = UUID()\n" +
          "    var title: String\n" +
          "    var streak: Int\n" +
          "    var doneToday: Bool\n\n" +
          "    static let sample = [\n" +
          "        Habit(title: \"Morning run\", streak: 7, doneToday: true),\n" +
          "        Habit(title: \"Read 20 pages\", streak: 4, doneToday: false),\n" +
          "        Habit(title: \"Drink water\", streak: 12, doneToday: true)\n" +
          "    ]\n" +
          "}",
        "Info.plist": plist
      };
    }

    if (template === "cafe") {
      return {
        "CafeFinderApp.swift": appMain(appName),
        "ContentView.swift":
          "import SwiftUI\nimport MapKit\n\n" +
          "struct ContentView: View {\n" +
          "    @State private var cafes = Cafe.nearby\n\n" +
          "    var body: some View {\n" +
          "        NavigationStack {\n" +
          "            List(cafes) { cafe in\n" +
          "                VStack(alignment: .leading) {\n" +
          "                    Text(cafe.name).font(.headline)\n" +
          "                    Text(cafe.detail).foregroundStyle(.secondary)\n" +
          "                }\n" +
          "            }\n" +
          "            .navigationTitle(\"" + appName + "\")\n" +
          "        }\n" +
          "    }\n" +
          "}",
        "Cafe.swift":
          "import Foundation\n\n" +
          "struct Cafe: Identifiable {\n" +
          "    let id = UUID()\n" +
          "    var name: String\n" +
          "    var detail: String\n\n" +
          "    static let nearby = [\n" +
          "        Cafe(name: \"Harbor Roast\", detail: \"0.4 mi · Open\"),\n" +
          "        Cafe(name: \"Bean Theory\", detail: \"0.9 mi · Busy\"),\n" +
          "        Cafe(name: \"Northside Pour\", detail: \"1.2 mi · Quiet\")\n" +
          "    ]\n" +
          "}",
        "Info.plist": plist
      };
    }

    if (template === "finance") {
      return {
        "BudgetlyApp.swift": appMain(appName),
        "ContentView.swift":
          "import SwiftUI\n\n" +
          "struct ContentView: View {\n" +
          "    @State private var buckets = BudgetBucket.sample\n\n" +
          "    var body: some View {\n" +
          "        NavigationStack {\n" +
          "            List(buckets) { bucket in\n" +
          "                HStack {\n" +
          "                    Text(bucket.name)\n" +
          "                    Spacer()\n" +
          "                    Text(bucket.remaining, format: .currency(code: \"USD\"))\n" +
          "                }\n" +
          "            }\n" +
          "            .navigationTitle(\"" + appName + "\")\n" +
          "        }\n" +
          "    }\n" +
          "}",
        "BudgetBucket.swift":
          "import Foundation\n\n" +
          "struct BudgetBucket: Identifiable {\n" +
          "    let id = UUID()\n" +
          "    var name: String\n" +
          "    var remaining: Decimal\n\n" +
          "    static let sample = [\n" +
          "        BudgetBucket(name: \"Groceries\", remaining: 186),\n" +
          "        BudgetBucket(name: \"Transit\", remaining: 42),\n" +
          "        BudgetBucket(name: \"Fun\", remaining: 95)\n" +
          "    ]\n" +
          "}",
        "Info.plist": plist
      };
    }

    if (template === "meditation") {
      return {
        "StillnessApp.swift": appMain(appName),
        "ContentView.swift":
          "import SwiftUI\n\n" +
          "struct ContentView: View {\n" +
          "    @State private var sessions = Session.sample\n\n" +
          "    var body: some View {\n" +
          "        NavigationStack {\n" +
          "            List(sessions) { session in\n" +
          "                HStack {\n" +
          "                    Text(session.title)\n" +
          "                    Spacer()\n" +
          "                    Text(\"\\(session.minutes) min\").foregroundStyle(.secondary)\n" +
          "                }\n" +
          "            }\n" +
          "            .navigationTitle(\"" + appName + "\")\n" +
          "        }\n" +
          "    }\n" +
          "}",
        "Session.swift":
          "import Foundation\n\n" +
          "struct Session: Identifiable {\n" +
          "    let id = UUID()\n" +
          "    var title: String\n" +
          "    var minutes: Int\n\n" +
          "    static let sample = [\n" +
          "        Session(title: \"Breath focus\", minutes: 10),\n" +
          "        Session(title: \"Body scan\", minutes: 15),\n" +
          "        Session(title: \"Evening wind-down\", minutes: 8)\n" +
          "    ]\n" +
          "}",
        "Info.plist": plist
      };
    }

    return {
      "NativApp.swift": appMain(appName),
      "ContentView.swift":
        "import SwiftUI\n\n" +
        "struct ContentView: View {\n" +
        "    @State private var items = AppItem.sample\n\n" +
        "    var body: some View {\n" +
        "        NavigationStack {\n" +
        "            List(items) { item in\n" +
        "                ItemRow(item: item)\n" +
        "            }\n" +
        "            .navigationTitle(\"" + appName + "\")\n" +
        "            .toolbar {\n" +
        "                Button(\"Add\", systemImage: \"plus\") { }\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "}",
      "AppItem.swift":
        "import Foundation\n\n" +
        "struct AppItem: Identifiable, Hashable {\n" +
        "    let id = UUID()\n" +
        "    var title: String\n" +
        "    var detail: String\n\n" +
        "    static let sample = [\n" +
        "        AppItem(title: \"Getting started\", detail: \"Built with Nativ\"),\n" +
        "        AppItem(title: \"Your first screen\", detail: \"Native SwiftUI\")\n" +
        "    ]\n" +
        "}",
      "Info.plist": plist
    };
  }

  function appMain(appName) {
    return (
      "import SwiftUI\n\n" +
      "@main\n" +
      "struct " + appName + "App: App {\n" +
      "    var body: some Scene {\n" +
      "        WindowGroup { ContentView() }\n" +
      "    }\n" +
      "}"
    );
  }

  function highlightLine(line) {
    if (/^\s*\/\//.test(line) || /^\s*<!--/.test(line)) {
      return '<span class="cm">' + esc(line) + "</span>";
    }
    var out = "";
    var i = 0;
    while (i < line.length) {
      var ch = line.charAt(i);
      if (ch === "\"") {
        var j = i + 1;
        while (j < line.length && line.charAt(j) !== "\"") {
          if (line.charAt(j) === "\\") j += 1;
          j += 1;
        }
        j = Math.min(j + 1, line.length);
        out += '<span class="str">' + esc(line.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        var k = i + 1;
        while (k < line.length && /[A-Za-z0-9_]/.test(line.charAt(k))) k += 1;
        var word = line.slice(i, k);
        var cls = "op";
        if (KW[word]) cls = "kw";
        else if (word.charAt(0) === word.charAt(0).toUpperCase() && /[A-Z]/.test(word.charAt(0))) cls = "ty";
        out += '<span class="' + cls + '">' + esc(word) + "</span>";
        i = k;
        continue;
      }
      var n = i + 1;
      while (n < line.length && !/[A-Za-z_"]/.test(line.charAt(n))) n += 1;
      out += '<span class="op">' + esc(line.slice(i, n)) + "</span>";
      i = n;
    }
    return out || "&nbsp;";
  }

  function renderCode(src) {
    return String(src || "").split("\n").map(function (line, i) {
      return '<div class="line"><span class="ln">' + (i + 1) + "</span><span>" + highlightLine(line) + "</span></div>";
    }).join("");
  }

  function brandMark() {
    return '<span class="brand-mark" aria-hidden="true"></span>';
  }

  function landingPreviewInner() {
    var items = previewItems(state.prompt).map(function (row) {
      return '<div class="preview-item"><strong>' + esc(row[0]) + "</strong><span>" + esc(row[1]) + "</span></div>";
    }).join("");
    var name = deriveName(state.prompt);
    var hint = state.prompt.trim()
      ? esc(state.prompt.trim().slice(0, 90))
      : "Your generated SwiftUI app";
    return (
      '<div class="phone-status"><span>9:41</span><span>5G</span></div>' +
      '<div class="preview-card">' +
        '<div class="preview-title">' + esc(name) + "</div>" +
        '<div class="preview-hint">' + hint + "</div>" +
        items +
      "</div>"
    );
  }

  function renderLanding() {
    var chips = EXAMPLES.map(function (ex) {
      var on = state.prompt === ex ? " active" : "";
      return '<button type="button" class="chip' + on + '" data-example="' + esc(ex) + '">' + esc(ex) + "</button>";
    }).join("");

    return (
      '<header class="site-header"><div class="wrap nav">' +
        '<a class="brand" href="#top">' + brandMark() + "Nativ</a>" +
        '<div class="nav-links">' +
          '<a class="nav-link" href="#features">Features</a>' +
          '<a class="nav-link" href="#publish">Publish</a>' +
          '<button type="button" class="account-chip' + (state.accountLinked ? " linked" : "") + '" data-action="link-account">' +
            '<span class="dot" aria-hidden="true"></span>' + esc(accountLabel()) +
          "</button>" +
          '<button type="button" class="btn" data-action="open-studio">Open compiler</button>' +
        "</div>" +
      "</div></header>" +
      '<section class="hero" id="top"><div class="wrap hero-grid">' +
        "<div>" +
          '<div class="brand-hero">Nativ</div>' +
          "<h1>Build iOS apps with AI</h1>" +
          '<p class="lede">Describe your idea. Get a native Swift project, compile it in the cloud Xcode toolchain, and submit to App Store Connect.</p>' +
          '<div class="prompt-box">' +
            '<textarea id="prompt" placeholder="Describe the iPhone app you want to build…">' + esc(state.prompt) + "</textarea>" +
            '<div class="prompt-actions">' +
              '<div class="chips">' + chips + "</div>" +
              '<button type="button" class="btn btn-generate" data-action="generate"' + (state.opening ? " disabled" : "") + ">" +
                (state.opening ? "Generating…" : "Generate &amp; compile") +
              "</button>" +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="phone-stage" aria-hidden="true">' +
          '<div class="phone-notch"></div>' +
          '<div class="phone-screen" id="landing-preview">' + landingPreviewInner() + "</div>" +
        "</div>" +
      "</div></section>" +
      '<section class="section" id="features"><div class="wrap">' +
        "<h2>Native Swift. Real Xcode.</h2>" +
        '<p class="lede">Not a web wrapper. Nativ generates SwiftUI, runs the Apple toolchain in the cloud, and keeps your project exportable.</p>' +
        '<div class="feature-list">' +
          "<article class=\"feature\"><h3>Cloud Xcode compiler</h3><p>Build, archive, and validate with a browser-based Xcode workflow — no Mac required to start.</p></article>" +
          "<article class=\"feature\"><h3>SwiftUI you own</h3><p>Read every file, tweak the project, export the full Xcode package whenever you want.</p></article>" +
          "<article class=\"feature\"><h3>App Store Connect</h3><p>Link your Apple Developer account, then submit builds, metadata, and privacy details in two clicks.</p></article>" +
        "</div>" +
      "</div></section>" +
      '<section class="section" id="publish"><div class="wrap">' +
        "<h2>From finished app to App Store review.</h2>" +
        '<p class="lede">Link App Store Connect with your Apple Developer account. Signing, packaging, and delivery are automated after that. Try the included <a href="./shop/">Electro Cycles sample shop</a>.</p>' +
        '<div class="prompt-actions publish-actions">' +
          '<button type="button" class="btn btn-ghost" data-action="link-account">' +
            (state.accountLinked ? "Manage Apple Developer" : "Link Apple Developer account") +
          "</button>" +
          '<button type="button" class="btn btn-amber" data-action="publish">Submit to App Store Connect</button>' +
        "</div>" +
      "</div></section>" +
      '<footer class="wrap site-footer"><span>Nativ · Native iOS with AI</span><span><a href="./shop/">Electro Cycles sample shop</a> · Demo compiler · Not affiliated with Apple</span></footer>' +
      (state.opening
        ? '<div class="opening-overlay"><div class="spinner" aria-hidden="true"></div><p>Generating SwiftUI project…</p></div>'
        : "")
    );
  }

  function renderStudio() {
    var names = Object.keys(state.files);
    var files = names.map(function (f) {
      var active = f === state.activeFile ? " active" : "";
      return '<div class="file' + active + '" data-file="' + esc(f) + '">' + esc(f) + "</div>";
    }).join("");

    var items = previewItems(state.prompt).map(function (row) {
      return '<div class="sim-item"><strong>' + esc(row[0]) + "</strong>" + esc(row[1]) + "</div>";
    }).join("");

    var logs = state.logs.map(function (l) {
      return '<div class="' + l.cls + '">' + esc(l.msg) + "</div>";
    }).join("") || '<div class="dim">Ready. Press Compile to run xcodebuild.</div>';

    var buildLabel = state.building ? "Compiling…" : state.built ? "Recompile" : "Compile";
    var theme = "theme-" + state.template;

    return (
      '<div class="studio">' +
        '<div class="studio-bar">' +
          '<div class="studio-title">' +
            '<div class="traffic" aria-hidden="true"><span class="r"></span><span class="y"></span><span class="g"></span></div>' +
            "<strong>" + esc(state.appName) + ".xcodeproj</strong>" +
            (state.built ? '<span class="badge">Build succeeded</span>' : "") +
            (state.accountLinked ? '<span class="badge">ASC linked</span>' : "") +
          "</div>" +
          '<div class="studio-actions">' +
            '<button type="button" class="btn btn-ghost" data-action="home">← Home</button>' +
            '<button type="button" class="btn btn-ghost" data-action="export">Export</button>' +
            '<button type="button" class="account-chip' + (state.accountLinked ? " linked" : "") + '" data-action="link-account">' +
              '<span class="dot" aria-hidden="true"></span>' + esc(accountLabel()) +
            "</button>" +
            '<button type="button" class="btn btn-ghost" data-action="compile"' + (state.building ? " disabled" : "") + ">" + buildLabel + "</button>" +
            '<button type="button" class="btn btn-amber" data-action="submit">Submit to App Store Connect</button>' +
          "</div>" +
        "</div>" +
        '<div class="studio-body">' +
          '<aside class="pane">' +
            '<div class="pane-head">Project navigator</div>' +
            '<div class="file-tree">' +
              '<div class="folder">' + esc(state.appName) + "</div>" +
              files +
            "</div>" +
          "</aside>" +
          '<section class="pane" style="position:relative">' +
            '<div class="pane-head"><span>' + esc(state.activeFile) + '</span><span>' + (state.activeFile.indexOf(".plist") !== -1 ? "plist" : "Swift") + "</span></div>" +
            '<div class="editor">' + renderCode(state.files[state.activeFile]) + "</div>" +
            (state.building ? '<div class="building-overlay"><div class="spinner" aria-label="Building"></div></div>' : "") +
          "</section>" +
          '<section class="pane preview-pane">' +
            '<div>' +
              '<div class="pane-head"><span>Simulator</span><span>iPhone 16</span></div>' +
              '<div class="device-frame"><div class="device"><div class="device-inner ' + theme + '">' +
                "<h4>" + esc(state.appName) + "</h4>" +
                "<p>" + esc((state.prompt || "Your generated SwiftUI app").slice(0, 110)) + "</p>" +
                '<div class="sim-list">' + items + "</div>" +
              "</div></div></div>" +
            "</div>" +
            '<div class="console" id="console">' +
              '<div class="dim">Nativ Cloud Xcode · xcodebuild</div>' +
              logs +
            "</div>" +
          "</section>" +
        "</div>" +
      "</div>"
    );
  }

  function renderLinkModal() {
    if (!state.linkOpen) return "";

    if (state.accountLinked) {
      return (
        '<div class="modal" id="link-modal">' +
          '<div class="sheet wide" role="dialog" aria-labelledby="link-title">' +
            '<h2 id="link-title">App Store Connect</h2>' +
            "<p>Your Apple Developer account is linked for signing and uploads.</p>" +
            '<div class="account-card">' +
              '<div class="label">Linked account</div>' +
              '<div class="name">' + esc(state.teamName || "Apple Developer") + "</div>" +
              '<div class="meta">' +
                esc(state.appleId || "API key auth") +
                (state.teamId ? "<br>Team ID · " + esc(state.teamId) : "") +
                (state.keyId ? "<br>Key ID · " + esc(state.keyId) : "") +
              "</div>" +
            "</div>" +
            '<div class="sheet-actions">' +
              '<button type="button" class="btn btn-ghost" data-action="unlink">Unlink</button>' +
              '<button type="button" class="btn" data-action="close-link">Done</button>' +
            "</div>" +
          "</div>" +
        "</div>"
      );
    }

    var teamOptions = TEAMS.map(function (t) {
      var selected = state.teamId === t.id ? " selected" : "";
      return '<option value="' + esc(t.id) + '"' + selected + ">" + esc(t.name + " · " + t.id) + "</option>";
    }).join("");

    var signinFields;
    if (state.linkStep === 1) {
      signinFields =
        '<div class="field"><label for="apple-otp">Verification code</label>' +
          '<input id="apple-otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6-digit code" value="' + esc(state.otp) + '"' + (state.linking ? " disabled" : "") + " /></div>" +
        '<p class="hint">Two-factor authentication: enter the 6-digit code sent to the Apple devices signed in to ' + esc(state.appleId) + ".</p>";
    } else {
      signinFields =
        '<div class="field"><label for="apple-id">Apple ID</label>' +
          '<input id="apple-id" type="email" autocomplete="username" placeholder="you@icloud.com" value="' + esc(state.appleId) + '"' + (state.linking ? " disabled" : "") + " /></div>" +
        '<div class="field"><label for="apple-password">Password</label>' +
          '<input id="apple-password" type="password" autocomplete="current-password" placeholder="Apple ID password" value="' + esc(state.password) + '"' + (state.linking ? " disabled" : "") + " /></div>" +
        '<div class="field"><label for="team-select">Developer team</label>' +
          '<select id="team-select"' + (state.linking ? " disabled" : "") + ">" +
            '<option value="">Select a team…</option>' + teamOptions +
          "</select></div>" +
        '<p class="hint">Sign in with your Apple ID. A verification code will be sent to your trusted Apple devices.</p>';
    }

    var apiFields =
      '<div class="field"><label for="issuer-id">Issuer ID</label>' +
        '<input id="issuer-id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value="' + esc(state.issuerId) + '"' + (state.linking ? " disabled" : "") + " /></div>" +
      '<div class="field"><label for="key-id">Key ID</label>' +
        '<input id="key-id" placeholder="AB12CD34EF" value="' + esc(state.keyId) + '"' + (state.linking ? " disabled" : "") + " /></div>" +
      '<div class="field"><label for="api-team-id">Team ID</label>' +
        '<input id="api-team-id" placeholder="ABCDE12345" value="' + esc(state.teamId) + '"' + (state.linking ? " disabled" : "") + " /></div>" +
      '<div class="field"><label for="api-key">API key (.p8)</label>' +
        '<textarea id="api-key" rows="4" placeholder="-----BEGIN PRIVATE KEY-----&#10;…&#10;-----END PRIVATE KEY-----"' + (state.linking ? " disabled" : "") + ">" + esc(state.apiKey) + "</textarea></div>" +
      '<p class="hint">Paste your App Store Connect API key (.p8). It is used to authenticate and is never stored.</p>';

    return (
      '<div class="modal" id="link-modal">' +
        '<div class="sheet wide" role="dialog" aria-labelledby="link-title">' +
          '<h2 id="link-title">Link Apple Developer account</h2>' +
          "<p>Connect App Store Connect so Nativ can sign builds and upload to your team.</p>" +
          '<div class="link-methods">' +
            '<button type="button" class="method-card' + (state.linkMethod === "signin" ? " active" : "") + '" data-link-method="signin">' +
              "<strong>Sign in with Apple</strong><span>Use your Apple ID and pick a developer team.</span>" +
            "</button>" +
            '<button type="button" class="method-card' + (state.linkMethod === "api" ? " active" : "") + '" data-link-method="api">' +
              "<strong>App Store Connect API</strong><span>Use an Issuer ID, Key ID, and API key from Users and Access.</span>" +
            "</button>" +
          "</div>" +
          (state.linkMethod === "api" ? apiFields : signinFields) +
          '<div class="sheet-actions">' +
            (state.linkMethod === "signin" && state.linkStep === 1
              ? '<button type="button" class="btn btn-ghost" data-action="link-back"' + (state.linking ? " disabled" : "") + ">Back</button>"
              : '<button type="button" class="btn btn-ghost" data-action="close-link">Cancel</button>') +
            '<button type="button" class="btn" data-action="confirm-link"' + (state.linking ? " disabled" : "") + ">" +
              (state.linking
                ? (state.linkMethod === "signin" && state.linkStep === 0 ? "Sending code…" : "Verifying…")
                : (state.linkMethod === "api" ? "Verify & link" : state.linkStep === 1 ? "Verify & link" : "Continue")) +
            "</button>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderSubmitModal() {
    if (!state.submitOpen) return "";
    var steps = [
      "Validate archive with cloud Xcode",
      "Upload build to App Store Connect",
      "Attach metadata & privacy nutrition labels",
      "Submit for App Review"
    ].map(function (label, i) {
      var cls = "step";
      if (i < state.submitStep) cls += " done";
      if (i === state.submitStep) cls += " active";
      var mark = i < state.submitStep ? "✓" : String(i + 1);
      return '<div class="' + cls + '"><span class="dot">' + mark + "</span><span>" + esc(label) + "</span></div>";
    }).join("");

    var done = state.submitStep >= 4;
    var accountBlock = state.accountLinked
      ? '<div class="account-card"><div class="label">Uploading as</div><div class="name">' +
          esc(state.teamName || "Apple Developer") +
          '</div><div class="meta">Team ID · ' + esc(state.teamId) +
          (state.appleId ? "<br>" + esc(state.appleId) : "") +
          "</div></div>"
      : '<p class="hint">Link an Apple Developer account before submitting.</p>';

    return (
      '<div class="modal" id="submit-modal">' +
        '<div class="sheet" role="dialog" aria-labelledby="submit-title">' +
          '<h2 id="submit-title">Submit to App Store Connect</h2>' +
          "<p>Nativ prepares signing, the archive, and the ASC upload for your linked team.</p>" +
          accountBlock +
          '<div class="field"><label for="bundle-id">Bundle ID</label>' +
            '<input id="bundle-id" placeholder="com.you.' + esc(state.appName.toLowerCase()) + '" value="' + esc(state.bundleId) + '"' + (done || state.submitting ? " disabled" : "") + " /></div>" +
          '<div class="steps">' + steps + "</div>" +
          '<div class="sheet-actions">' +
            '<button type="button" class="btn btn-ghost" data-action="close-submit">Close</button>' +
            (!state.accountLinked
              ? '<button type="button" class="btn" data-action="submit-needs-link">Link Apple Developer</button>'
              : done
                ? '<button type="button" class="btn" data-action="close-submit">Done</button>'
                : '<button type="button" class="btn btn-amber" data-action="confirm-submit"' + (state.submitting ? " disabled" : "") + ">" +
                    (state.submitting ? "Submitting…" : "Submit build") +
                  "</button>") +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderToast() {
    if (!state.toast) return "";
    return '<div class="toast" role="status">' + esc(state.toast) + "</div>";
  }

  function showToast(msg, ms) {
    state.toast = msg;
    var toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.getElementById("app").appendChild(toast);
    }
    toast.textContent = msg;
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      state.toast = null;
      var el = document.querySelector(".toast");
      if (el) el.remove();
    }, ms || 2200);
  }

  function openLinkModal(thenSubmit) {
    state.linkOpen = true;
    state.linking = false;
    state.linkStep = 0;
    state.otp = "";
    state.pendingSubmitAfterLink = !!thenSubmit;
    if (thenSubmit) state.submitOpen = false;
    render();
  }

  function closeLinkModal() {
    state.linkOpen = false;
    state.pendingSubmitAfterLink = false;
    render();
  }

  function openSubmitModal() {
    if (!state.accountLinked) {
      openLinkModal(true);
      showToast("Link your Apple Developer account to continue.");
      return;
    }
    state.submitOpen = true;
    state.submitStep = 0;
    state.submitting = false;
    render();
  }

  function loadProject(prompt) {
    state.prompt = prompt || state.prompt;
    state.template = detectTemplate(state.prompt);
    state.appName = deriveName(state.prompt);
    state.files = filesFor(state.template, state.appName);
    state.activeFile = Object.keys(state.files)[0];
    state.built = false;
    state.logs = [];
    state.bundleId = "com.nativ." + state.appName.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function render() {
    var root = document.getElementById("app");
    var html = state.view === "studio" ? renderStudio() : renderLanding();
    html += renderLinkModal();
    html += renderSubmitModal();
    html += renderToast();
    root.innerHTML = html;
    var consoleEl = document.getElementById("console");
    if (consoleEl) consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function applyExample(text) {
    state.prompt = text || "";
    var ta = document.getElementById("prompt");
    if (ta) ta.value = state.prompt;
    var preview = document.getElementById("landing-preview");
    if (preview) preview.innerHTML = landingPreviewInner();
    document.querySelectorAll("[data-example]").forEach(function (el) {
      if (el.getAttribute("data-example") === state.prompt) el.classList.add("active");
      else el.classList.remove("active");
    });
  }

  function openStudio(fromPrompt) {
    if (fromPrompt != null) state.prompt = fromPrompt;
    loadProject(state.prompt);
    state.view = "studio";
    state.opening = false;
    pushLog("info", "→ Project generated: " + state.appName + ".xcodeproj");
    if (state.template === "electro") {
      pushLog("info", "Using sample sources from ios/ElectroCycles");
    }
    pushLog("dim", "SwiftUI sources ready · waiting for compile");
    render();
    runCompile();
  }

  function startGenerate() {
    if (state.opening || state.building) return;
    var text = ((document.getElementById("prompt") || {}).value || state.prompt || "").trim();
    if (!text) {
      showToast("Describe your app idea first.");
      return;
    }
    state.prompt = text;
    state.opening = true;
    var btn = document.querySelector("[data-action='generate']");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Generating…";
    }
    var overlay = document.createElement("div");
    overlay.className = "opening-overlay";
    overlay.innerHTML = '<div class="spinner" aria-hidden="true"></div><p>Generating SwiftUI project…</p>';
    document.getElementById("app").appendChild(overlay);
    setTimeout(function () {
      openStudio(text);
    }, 280);
  }

  function pushLog(cls, msg) {
    state.logs.push({ cls: cls, msg: msg, t: new Date() });
    if (state.logs.length > 80) state.logs.shift();
    var consoleEl = document.getElementById("console");
    if (consoleEl && state.view === "studio") {
      var div = document.createElement("div");
      div.className = cls;
      div.textContent = msg;
      consoleEl.appendChild(div);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }

  function runCompile() {
    if (state.building) return;
    state.building = true;
    state.built = false;
    if (state.view === "studio" && !document.querySelector(".building-overlay")) {
      var editorPane = document.querySelector(".studio-body .pane:nth-child(2)");
      if (editorPane) {
        var overlay = document.createElement("div");
        overlay.className = "building-overlay";
        overlay.innerHTML = '<div class="spinner" aria-label="Building"></div>';
        editorPane.appendChild(overlay);
      }
    }
    var compileBtn = document.querySelector("[data-action='compile']");
    if (compileBtn) {
      compileBtn.disabled = true;
      compileBtn.textContent = "Compiling…";
    }

    pushLog("info", "$ xcodebuild -scheme " + state.appName + " -destination 'platform=iOS Simulator,name=iPhone 16'");
    pushLog("dim", "Compiling Swift module " + state.appName + "…");

    var fileNames = Object.keys(state.files).filter(function (f) { return /\.swift$/.test(f); });
    var phases = fileNames.map(function (f, i) {
      return { delay: 450 + i * 380, cls: "dim", msg: "Compile " + f };
    });
    phases.push({ delay: 450 + fileNames.length * 380 + 280, cls: "dim", msg: "Link " + state.appName + " (arm64)" });
    if (state.accountLinked) {
      phases.push({ delay: 450 + fileNames.length * 380 + 520, cls: "info", msg: "Signing with team " + state.teamId });
    }
    phases.push({ delay: 450 + fileNames.length * 380 + 780, cls: "ok", msg: "** BUILD SUCCEEDED **" });
    phases.push({ delay: 450 + fileNames.length * 380 + 980, cls: "info", msg: "Installed on iPhone 16 Simulator" });

    if (state.compileTimer) {
      state.compileTimer.forEach(function (id) { clearTimeout(id); });
    }
    state.compileTimer = [];
    phases.forEach(function (p) {
      var id = setTimeout(function () {
        pushLog(p.cls, p.msg);
        if (p.msg.indexOf("BUILD SUCCEEDED") !== -1) {
          state.building = false;
          state.built = true;
          render();
        }
      }, p.delay);
      state.compileTimer.push(id);
    });
  }

  var UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  var P8_RE = /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/;

  function runLinkAccount() {
    if (state.linking) return;

    if (state.linkMethod === "signin") {
      if (state.linkStep === 1) {
        var otpEl = document.getElementById("apple-otp");
        state.otp = ((otpEl && otpEl.value) || "").trim();
        if (!/^\d{6}$/.test(state.otp)) {
          showToast("Enter the 6-digit verification code.");
          return;
        }
        var vteam = TEAMS.filter(function (t) { return t.id === state.teamId; })[0];
        state.teamName = vteam ? vteam.name : "Developer Team";
        state.issuerId = "";
        state.keyId = "";
        finishLink();
        return;
      }

      var appleIdEl = document.getElementById("apple-id");
      var passEl = document.getElementById("apple-password");
      var teamEl = document.getElementById("team-select");
      state.appleId = ((appleIdEl && appleIdEl.value) || state.appleId || "").trim();
      state.password = (passEl && passEl.value) || state.password || "";
      state.teamId = ((teamEl && teamEl.value) || state.teamId || "").trim();
      if (!state.appleId || state.appleId.indexOf("@") === -1) {
        showToast("Enter a valid Apple ID email.");
        return;
      }
      if (state.password.length < 6) {
        showToast("Enter your Apple ID password.");
        return;
      }
      if (!state.teamId) {
        showToast("Select a developer team.");
        return;
      }
      // Authenticate credentials, then request a 2FA code on the user's devices.
      state.linking = true;
      render();
      setTimeout(function () {
        state.linking = false;
        state.otp = "";
        state.linkStep = 1;
        render();
        showToast("Verification code sent to your Apple devices");
      }, 700);
      return;
    }

    var issuerEl = document.getElementById("issuer-id");
    var keyEl = document.getElementById("key-id");
    var apiTeamEl = document.getElementById("api-team-id");
    var apiKeyEl = document.getElementById("api-key");
    state.issuerId = ((issuerEl && issuerEl.value) || state.issuerId || "").trim();
    state.keyId = ((keyEl && keyEl.value) || state.keyId || "").trim();
    state.teamId = ((apiTeamEl && apiTeamEl.value) || state.teamId || "").trim();
    state.apiKey = (apiKeyEl && apiKeyEl.value) || state.apiKey || "";
    if (!UUID_RE.test(state.issuerId)) {
      showToast("Enter a valid Issuer ID (UUID).");
      return;
    }
    if (!/^[0-9A-Za-z]{10}$/.test(state.keyId)) {
      showToast("Key ID must be 10 characters.");
      return;
    }
    if (!/^[0-9A-Za-z]{10}$/.test(state.teamId)) {
      showToast("Team ID must be 10 characters.");
      return;
    }
    if (!P8_RE.test(state.apiKey)) {
      showToast("Paste a valid .p8 private key.");
      return;
    }
    state.appleId = "";
    state.teamName = "API Key · " + state.teamId;
    finishLink();
  }

  function finishLink() {
    state.linking = true;
    render();

    setTimeout(function () {
      state.linking = false;
      state.accountLinked = true;
      state.linkOpen = false;
      state.linkStep = 0;
      // Never persist secrets (password / private key / one-time code).
      state.password = "";
      state.apiKey = "";
      state.otp = "";
      persistAccount();
      if (state.view === "studio") {
        pushLog("ok", "Linked App Store Connect · " + (state.teamName || state.teamId));
      }
      var shouldSubmit = state.pendingSubmitAfterLink;
      state.pendingSubmitAfterLink = false;
      render();
      showToast("Apple Developer account linked");
      if (shouldSubmit) {
        setTimeout(function () {
          state.submitOpen = true;
          state.submitStep = 0;
          state.submitting = false;
          render();
        }, 500);
      }
    }, 900);
  }

  function unlinkAccount() {
    state.accountLinked = false;
    state.appleId = "";
    state.teamName = "";
    state.teamId = "";
    state.issuerId = "";
    state.keyId = "";
    persistAccount();
    render();
    showToast("Apple Developer account unlinked.");
  }

  function runSubmit() {
    if (state.submitting) return;
    if (!state.accountLinked) {
      openLinkModal(true);
      return;
    }
    var bundle = (document.getElementById("bundle-id") || {}).value || state.bundleId;
    state.bundleId = (bundle || "").trim();
    if (!state.bundleId) {
      showToast("Enter a Bundle ID to continue.");
      return;
    }
    if (!state.built && state.view === "studio") {
      showToast("Compile the project before submitting.");
      return;
    }

    state.submitting = true;
    state.submitStep = 0;
    render();

    var ticks = [0, 1, 2, 3, 4];
    ticks.forEach(function (step, idx) {
      setTimeout(function () {
        state.submitStep = step;
        if (step === 4) {
          state.submitting = false;
          pushLog("ok", "Uploaded " + state.bundleId + " to App Store Connect (Team " + state.teamId + ")");
          render();
          showToast("Build uploaded · waiting for App Review", 2800);
          return;
        }
        render();
      }, 700 * (idx + 1));
    });
  }

  function crcTable() {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  }

  var CRC = crcTable();

  function crc32(bytes) {
    var crc = 0 ^ -1;
    for (var i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ CRC[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ -1) >>> 0;
  }

  function u32(n) {
    return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  }

  function u16(n) {
    return [n & 255, (n >>> 8) & 255];
  }

  function exportZip() {
    if (!Object.keys(state.files).length) loadProject(state.prompt || EXAMPLES[0]);
    var encoder = new TextEncoder();
    var locals = [];
    var centrals = [];
    var offset = 0;
    var names = Object.keys(state.files);
    names.forEach(function (name) {
      var path = state.appName + "/" + name;
      var data = encoder.encode(state.files[name]);
      var nameBytes = encoder.encode(path);
      var crc = crc32(data);
      var local = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
        .concat(u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0));
      local = local.concat(Array.from(nameBytes), Array.from(data));
      var central = [0x50, 0x4b, 0x01, 0x02, 0x14, 0x00, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
        .concat(u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset));
      central = central.concat(Array.from(nameBytes));
      locals.push(local);
      centrals.push(central);
      offset += local.length;
    });
    var centralSize = centrals.reduce(function (n, a) { return n + a.length; }, 0);
    var eocd = [0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00]
      .concat(u16(names.length), u16(names.length), u32(centralSize), u32(offset), u16(0));
    var bytes = locals.concat(centrals).reduce(function (acc, part) { return acc.concat(part); }, []).concat(eocd);
    var blob = new Blob([new Uint8Array(bytes)], { type: "application/zip" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = state.appName + ".zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    showToast("Exported " + state.appName + ".zip");
  }

  function onAppClick(e) {
    if (e.target.id === "link-modal") {
      closeLinkModal();
      return;
    }
    if (e.target.id === "submit-modal") {
      state.submitOpen = false;
      render();
      return;
    }

    var example = e.target.closest("[data-example]");
    if (example) {
      applyExample(example.getAttribute("data-example") || "");
      var ta = document.getElementById("prompt");
      if (ta) ta.focus();
      return;
    }

    var file = e.target.closest("[data-file]");
    if (file) {
      state.activeFile = file.getAttribute("data-file");
      render();
      return;
    }

    var method = e.target.closest("[data-link-method]");
    if (method) {
      state.linkMethod = method.getAttribute("data-link-method") || "signin";
      state.linkStep = 0;
      state.otp = "";
      render();
      return;
    }

    var actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    var action = actionEl.getAttribute("data-action");
    if (action === "generate") startGenerate();
    else if (action === "open-studio") {
      if (!state.prompt.trim()) state.prompt = EXAMPLES[0];
      startGenerate();
    } else if (action === "link-account") openLinkModal(false);
    else if (action === "publish") {
      if (state.view !== "studio") {
        if (!state.prompt.trim()) state.prompt = EXAMPLES[0];
        startGenerate();
        setTimeout(function () { openSubmitModal(); }, 3400);
        return;
      }
      openSubmitModal();
    } else if (action === "home") {
      state.view = "landing";
      state.opening = false;
      render();
    } else if (action === "compile") runCompile();
    else if (action === "submit") openSubmitModal();
    else if (action === "export") exportZip();
    else if (action === "close-link") closeLinkModal();
    else if (action === "link-back") {
      state.linkStep = 0;
      state.otp = "";
      render();
    } else if (action === "confirm-link") runLinkAccount();
    else if (action === "unlink") unlinkAccount();
    else if (action === "close-submit") {
      state.submitOpen = false;
      render();
    } else if (action === "confirm-submit") runSubmit();
    else if (action === "submit-needs-link") openLinkModal(true);
  }

  function onAppInput(e) {
    var id = e.target.id;
    if (id === "prompt") {
      state.prompt = e.target.value;
      var preview = document.getElementById("landing-preview");
      if (preview) preview.innerHTML = landingPreviewInner();
    } else if (id === "apple-id") state.appleId = e.target.value;
    else if (id === "apple-password") state.password = e.target.value;
    else if (id === "apple-otp") state.otp = e.target.value;
    else if (id === "issuer-id") state.issuerId = e.target.value;
    else if (id === "key-id") state.keyId = e.target.value;
    else if (id === "api-team-id") state.teamId = e.target.value;
    else if (id === "api-key") state.apiKey = e.target.value;
    else if (id === "bundle-id") state.bundleId = e.target.value;
  }

  function onAppChange(e) {
    if (e.target.id === "team-select") {
      state.teamId = e.target.value;
      var team = TEAMS.filter(function (t) { return t.id === state.teamId; })[0];
      state.teamName = team ? team.name : state.teamName;
    }
  }

  var root = document.getElementById("app");
  root.addEventListener("click", onAppClick);
  root.addEventListener("input", onAppInput);
  root.addEventListener("change", onAppChange);
  render();
})();
