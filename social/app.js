(function () {
  "use strict";

  var STORAGE_KEY = "kin.social.v1";
  var seed = window.KIN_SEED;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      users: clone(seed.users),
      friendships: clone(seed.friendships),
      friendRequests: clone(seed.friendRequests),
      posts: clone(seed.posts),
      stories: clone(seed.stories),
      messages: clone(seed.messages),
      notifications: clone(seed.notifications),
      sessionUserId: null
    };
  }

  var db = loadStore();

  var state = {
    view: db.sessionUserId ? "feed" : "landing",
    authMode: "login",
    authError: "",
    search: "",
    composer: "",
    mood: "life",
    commentDrafts: {},
    profileId: null,
    activeChatId: null,
    chatDraft: "",
    storyOpen: null,
    toast: null,
    toastTimer: null,
    mobileMenu: false
  };

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function currentUser() {
    return db.users.find(function (u) { return u.id === db.sessionUserId; }) || null;
  }

  function userById(id) {
    return db.users.find(function (u) { return u.id === id; }) || null;
  }

  function friendsOf(userId) {
    var ids = [];
    db.friendships.forEach(function (f) {
      if (f.a === userId) ids.push(f.b);
      else if (f.b === userId) ids.push(f.a);
    });
    return ids.map(userById).filter(Boolean);
  }

  function isFriend(a, b) {
    return db.friendships.some(function (f) {
      return (f.a === a && f.b === b) || (f.a === b && f.b === a);
    });
  }

  function pendingRequest(from, to) {
    return db.friendRequests.find(function (r) { return r.from === from && r.to === to; });
  }

  function relativeTime(ts) {
    var diff = Date.now() - ts;
    var m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m";
    var h = Math.floor(m / 60);
    if (h < 24) return h + "h";
    var d = Math.floor(h / 24);
    if (d < 7) return d + "d";
    return new Date(ts).toLocaleDateString();
  }

  function toast(msg) {
    state.toast = msg;
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      state.toast = null;
      render();
    }, 2200);
    render();
  }

  function avatarHtml(user, size) {
    if (!user) return "";
    var cls = "avatar" + (size ? " " + size : "");
    return '<div class="' + cls + '" style="background:' + esc(user.color) + '" aria-hidden="true">' +
      esc(user.avatar) + "</div>";
  }

  function icon(name) {
    var map = {
      home: "⌂",
      friends: "⚭",
      messages: "✉",
      notifications: "◉",
      profile: "☺",
      search: "⌕",
      logout: "⎋"
    };
    return map[name] || "•";
  }

  /* ---------- Mutations ---------- */

  function login(email, password) {
    var user = db.users.find(function (u) {
      return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
    });
    if (!user) {
      state.authError = "Those credentials don’t match a Kin account.";
      render();
      return;
    }
    db.sessionUserId = user.id;
    save();
    state.view = "feed";
    state.authError = "";
    toast("Welcome back, " + user.name.split(" ")[0]);
  }

  function signup(name, handle, email, password) {
    if (!name || !handle || !email || !password) {
      state.authError = "Fill in every field to join Kin.";
      render();
      return;
    }
    if (password.length < 6) {
      state.authError = "Password needs at least 6 characters.";
      render();
      return;
    }
    var cleanHandle = handle.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    if (!cleanHandle) {
      state.authError = "Pick a handle with letters or numbers.";
      render();
      return;
    }
    if (db.users.some(function (u) { return u.email.toLowerCase() === email.toLowerCase(); })) {
      state.authError = "That email is already on Kin.";
      render();
      return;
    }
    if (db.users.some(function (u) { return u.handle === cleanHandle; })) {
      state.authError = "That handle is taken.";
      render();
      return;
    }
    var colors = ["#1a9b8e", "#e07a3d", "#4d7cff", "#c45d8c", "#6a9a3a", "#f0c75e"];
    var parts = name.trim().split(/\s+/);
    var initials = (parts[0][0] || "K") + (parts[1] ? parts[1][0] : (parts[0][1] || "N"));
    var user = {
      id: uid("u"),
      name: name.trim(),
      handle: cleanHandle,
      email: email.trim(),
      password: password,
      bio: "New on Kin.",
      location: "",
      avatar: initials.toUpperCase(),
      color: colors[db.users.length % colors.length],
      cover: "linear-gradient(135deg,#0c1118,#1a9b8e)",
      joined: Date.now()
    };
    db.users.push(user);
    // Auto-friend Maya so new users see a populated feed path
    if (userById("u_maya")) {
      db.friendships.push({ a: user.id, b: "u_maya", since: Date.now() });
    }
    db.sessionUserId = user.id;
    save();
    state.view = "feed";
    state.authError = "";
    toast("You’re in. Start sharing with Kin.");
  }

  function logout() {
    db.sessionUserId = null;
    save();
    state.view = "landing";
    state.authMode = "login";
    render();
  }

  function createPost() {
    var text = state.composer.trim();
    if (!text) {
      toast("Write something first");
      return;
    }
    var me = currentUser();
    var post = {
      id: uid("p"),
      authorId: me.id,
      text: text,
      mood: state.mood || "life",
      createdAt: Date.now(),
      likes: [],
      comments: []
    };
    db.posts.unshift(post);
    // Notify friends
    friendsOf(me.id).forEach(function (f) {
      db.notifications.unshift({
        id: uid("n"),
        userId: f.id,
        type: "post",
        fromId: me.id,
        postId: post.id,
        text: me.name + " shared a new post",
        read: false,
        at: Date.now()
      });
    });
    state.composer = "";
    save();
    toast("Posted");
    render();
  }

  function toggleLike(postId) {
    var me = currentUser();
    var post = db.posts.find(function (p) { return p.id === postId; });
    if (!post || !me) return;
    var idx = post.likes.indexOf(me.id);
    if (idx >= 0) post.likes.splice(idx, 1);
    else {
      post.likes.push(me.id);
      if (post.authorId !== me.id) {
        db.notifications.unshift({
          id: uid("n"),
          userId: post.authorId,
          type: "like",
          fromId: me.id,
          postId: post.id,
          text: me.name + " liked your post",
          read: false,
          at: Date.now()
        });
      }
    }
    save();
    render();
  }

  function addComment(postId) {
    var text = (state.commentDrafts[postId] || "").trim();
    if (!text) return;
    var me = currentUser();
    var post = db.posts.find(function (p) { return p.id === postId; });
    if (!post || !me) return;
    post.comments.push({
      id: uid("c"),
      authorId: me.id,
      text: text,
      createdAt: Date.now()
    });
    if (post.authorId !== me.id) {
      db.notifications.unshift({
        id: uid("n"),
        userId: post.authorId,
        type: "comment",
        fromId: me.id,
        postId: post.id,
        text: me.name + " commented on your post",
        read: false,
        at: Date.now()
      });
    }
    state.commentDrafts[postId] = "";
    save();
    render();
  }

  function sendFriendRequest(toId) {
    var me = currentUser();
    if (!me || me.id === toId || isFriend(me.id, toId) || pendingRequest(me.id, toId)) return;
    var incoming = pendingRequest(toId, me.id);
    if (incoming) {
      acceptFriendRequest(incoming.id);
      return;
    }
    db.friendRequests.push({ id: uid("fr"), from: me.id, to: toId, at: Date.now() });
    db.notifications.unshift({
      id: uid("n"),
      userId: toId,
      type: "friend_request",
      fromId: me.id,
      postId: null,
      text: me.name + " sent you a friend request",
      read: false,
      at: Date.now()
    });
    save();
    toast("Friend request sent");
    render();
  }

  function acceptFriendRequest(requestId) {
    var req = db.friendRequests.find(function (r) { return r.id === requestId; });
    if (!req) return;
    db.friendships.push({ a: req.from, b: req.to, since: Date.now() });
    db.friendRequests = db.friendRequests.filter(function (r) { return r.id !== requestId; });
    var from = userById(req.from);
    db.notifications.unshift({
      id: uid("n"),
      userId: req.from,
      type: "friend_accept",
      fromId: req.to,
      postId: null,
      text: (currentUser() && currentUser().name) + " accepted your friend request",
      read: false,
      at: Date.now()
    });
    save();
    toast("You and " + (from ? from.name.split(" ")[0] : "them") + " are friends");
    render();
  }

  function declineFriendRequest(requestId) {
    db.friendRequests = db.friendRequests.filter(function (r) { return r.id !== requestId; });
    save();
    render();
  }

  function markNotificationsRead() {
    var me = currentUser();
    if (!me) return;
    db.notifications.forEach(function (n) {
      if (n.userId === me.id) n.read = true;
    });
    save();
  }

  function ensureChat(otherId) {
    var me = currentUser();
    var existing = db.messages.find(function (t) {
      return t.participants.indexOf(me.id) >= 0 && t.participants.indexOf(otherId) >= 0;
    });
    if (existing) return existing.id;
    var thread = {
      id: uid("m"),
      participants: [me.id, otherId],
      messages: []
    };
    db.messages.unshift(thread);
    save();
    return thread.id;
  }

  function sendMessage() {
    var text = state.chatDraft.trim();
    if (!text || !state.activeChatId) return;
    var thread = db.messages.find(function (t) { return t.id === state.activeChatId; });
    if (!thread) return;
    var me = currentUser();
    thread.messages.push({ id: uid("msg"), from: me.id, text: text, at: Date.now() });
    var otherId = thread.participants.find(function (id) { return id !== me.id; });
    db.notifications.unshift({
      id: uid("n"),
      userId: otherId,
      type: "message",
      fromId: me.id,
      postId: null,
      text: me.name + " sent you a message",
      read: false,
      at: Date.now()
    });
    state.chatDraft = "";
    save();
    render();
  }

  /* ---------- Views ---------- */

  function renderAuth() {
    var isLogin = state.authMode === "login";
    return (
      '<div class="auth-shell">' +
        '<section class="auth-hero">' +
          '<div class="brand-mark"><span class="dot">K</span> Kin</div>' +
          "<h1>Stay close to your people</h1>" +
          "<p>Share moments, cheer friends on, and keep the good conversations going — without the noise.</p>" +
        "</section>" +
        '<section class="auth-panel">' +
          '<div class="auth-card">' +
            "<h2>" + (isLogin ? "Welcome back" : "Join Kin") + "</h2>" +
            '<p class="sub">' + (isLogin ? "Log in to pick up your feed." : "Create an account in under a minute.") + "</p>" +
            (state.authError ? '<p class="form-error">' + esc(state.authError) + "</p>" : "") +
            '<form id="auth-form">' +
              (!isLogin
                ? '<div class="field"><label for="name">Name</label><input id="name" name="name" autocomplete="name" required /></div>' +
                  '<div class="field"><label for="handle">Handle</label><input id="handle" name="handle" placeholder="yourname" required /></div>'
                : "") +
              '<div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username" required value="' +
                (isLogin ? esc(seed.demoEmail) : "") + '" /></div>' +
              '<div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="' +
                (isLogin ? "current-password" : "new-password") + '" required value="' +
                (isLogin ? esc(seed.demoPassword) : "") + '" /></div>' +
              '<button class="btn btn-primary" type="submit">' + (isLogin ? "Log in" : "Create account") + "</button>" +
            "</form>" +
            '<p class="auth-switch">' +
              (isLogin
                ? 'New here? <button type="button" data-action="switch-auth" data-mode="signup">Create an account</button>'
                : 'Already on Kin? <button type="button" data-action="switch-auth" data-mode="login">Log in</button>') +
            "</p>" +
            '<div class="demo-hint">Demo account: <strong>' + esc(seed.demoEmail) + "</strong> / <strong>" +
              esc(seed.demoPassword) + "</strong></div>" +
          "</div>" +
        "</section>" +
      "</div>"
    );
  }

  function unreadCount() {
    var me = currentUser();
    if (!me) return 0;
    return db.notifications.filter(function (n) { return n.userId === me.id && !n.read; }).length;
  }

  function incomingRequests() {
    var me = currentUser();
    return db.friendRequests.filter(function (r) { return r.to === me.id; });
  }

  function sideNav() {
    var me = currentUser();
    var unread = unreadCount();
    var reqs = incomingRequests().length;
    var items = [
      { id: "feed", label: "Home", ico: "home" },
      { id: "friends", label: "Friends", ico: "friends", badge: reqs },
      { id: "messages", label: "Messages", ico: "messages" },
      { id: "notifications", label: "Notifications", ico: "notifications", badge: unread },
      { id: "profile", label: "Profile", ico: "profile" }
    ];
    return (
      '<aside class="side-nav">' +
        '<div class="brand-mark" style="margin:0.25rem 0.35rem 0.85rem"><span class="dot">K</span> Kin</div>' +
        '<div class="nav-user">' +
          avatarHtml(me) +
          "<div><strong>" + esc(me.name) + '</strong><span>@' + esc(me.handle) + "</span></div>" +
        "</div>" +
        items.map(function (item) {
          var active = state.view === item.id || (state.view === "user" && item.id === "profile" && state.profileId === me.id);
          return (
            '<button class="nav-link' + (active ? " active" : "") + '" data-action="nav" data-view="' + item.id + '">' +
              "<span>" + icon(item.ico) + "</span><span>" + item.label + "</span>" +
              (item.badge ? '<span class="badge">' + item.badge + "</span>" : "") +
            "</button>"
          );
        }).join("") +
        '<div class="nav-footer">' +
          '<button class="nav-link" data-action="logout"><span>' + icon("logout") + "</span><span>Log out</span></button>" +
        "</div>" +
      "</aside>"
    );
  }

  function mobileNav() {
    var unread = unreadCount();
    var items = [
      { id: "feed", label: "Home", ico: "⌂" },
      { id: "friends", label: "Friends", ico: "⚭" },
      { id: "messages", label: "Chat", ico: "✉" },
      { id: "notifications", label: "Alerts", ico: "◉", badge: unread },
      { id: "profile", label: "You", ico: "☺" }
    ];
    return (
      '<nav class="mobile-nav">' +
        items.map(function (item) {
          return (
            '<button class="' + (state.view === item.id ? "active" : "") + '" data-action="nav" data-view="' + item.id + '">' +
              '<span class="ico">' + item.ico + (item.badge ? "·" : "") + "</span>" +
              "<span>" + item.label + "</span>" +
            "</button>"
          );
        }).join("") +
      "</nav>"
    );
  }

  function topbar() {
    return (
      '<div class="topbar">' +
        '<div class="search-box">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
          '<input type="search" placeholder="Search people on Kin" value="' + esc(state.search) + '" data-bind="search" />' +
        "</div>" +
        '<button class="btn btn-ghost" data-action="nav" data-view="friends">Find friends</button>' +
      "</div>"
    );
  }

  function feedPosts(authorFilter) {
    var me = currentUser();
    var friendIds = friendsOf(me.id).map(function (u) { return u.id; });
    var posts = db.posts.filter(function (p) {
      if (authorFilter) return p.authorId === authorFilter;
      return p.authorId === me.id || friendIds.indexOf(p.authorId) >= 0;
    }).sort(function (a, b) { return b.createdAt - a.createdAt; });

    if (!posts.length) {
      return '<div class="panel empty">No posts yet. Say hello to the feed.</div>';
    }

    return posts.map(function (post) {
      var author = userById(post.authorId);
      var liked = post.likes.indexOf(me.id) >= 0;
      var draft = state.commentDrafts[post.id] || "";
      return (
        '<article class="panel post" data-post="' + post.id + '">' +
          '<div class="post-head">' +
            avatarHtml(author) +
            "<div>" +
              '<button class="name" data-action="open-profile" data-id="' + author.id + '">' + esc(author.name) + "</button>" +
              '<div class="meta">@' + esc(author.handle) + " · " + relativeTime(post.createdAt) + "</div>" +
            "</div>" +
          "</div>" +
          '<p class="post-body">' + esc(post.text) + "</p>" +
          (post.mood
            ? '<div class="mood-banner mood-' + esc(post.mood) + '"><span>' + esc(post.mood) + "</span></div>"
            : "") +
          '<div class="post-stats"><span>' + post.likes.length + " likes</span><span>" + post.comments.length + " comments</span></div>" +
          '<div class="post-actions">' +
            '<button class="' + (liked ? "liked" : "") + '" data-action="like" data-id="' + post.id + '">' +
              (liked ? "♥ Liked" : "♡ Like") +
            "</button>" +
            '<button data-action="focus-comment" data-id="' + post.id + '">💬 Comment</button>' +
            '<button data-action="share-post" data-id="' + post.id + '">↗ Share</button>' +
          "</div>" +
          (post.comments.length
            ? '<div class="comments">' +
              post.comments.map(function (c) {
                var cu = userById(c.authorId);
                return (
                  '<div class="comment">' +
                    avatarHtml(cu, "sm") +
                    '<div class="comment-bubble"><strong>' + esc(cu.name) + "</strong>" +
                    '<span class="meta">' + relativeTime(c.createdAt) + "</span>" +
                    "<p>" + esc(c.text) + "</p></div>" +
                  "</div>"
                );
              }).join("") +
              "</div>"
            : "") +
          '<form class="comment-form" data-comment-form="' + post.id + '">' +
            '<input placeholder="Write a comment…" value="' + esc(draft) + '" data-comment="' + post.id + '" />' +
            '<button class="btn btn-soft" type="submit">Post</button>' +
          "</form>" +
        "</article>"
      );
    }).join("");
  }

  function storiesBar() {
    var me = currentUser();
    var friendIds = friendsOf(me.id).map(function (u) { return u.id; });
    var stories = db.stories.filter(function (s) {
      return s.authorId === me.id || friendIds.indexOf(s.authorId) >= 0;
    });
    if (!stories.length) return "";
    return (
      '<div class="panel"><div class="stories">' +
        stories.map(function (s) {
          var u = userById(s.authorId);
          return (
            '<button class="story" data-action="open-story" data-id="' + s.id + '">' +
              '<div class="story-ring"><div style="background:' + esc(u.color) + '">' + esc(u.avatar) + "</div></div>" +
              "<span>" + esc(u.name.split(" ")[0]) + "</span>" +
            "</button>"
          );
        }).join("") +
      "</div></div>"
    );
  }

  function composer() {
    var moods = ["life", "outdoors", "city", "work", "food"];
    return (
      '<div class="panel composer">' +
        '<textarea placeholder="What\'s on your mind?" data-bind="composer">' + esc(state.composer) + "</textarea>" +
        '<div class="composer-actions">' +
          '<div class="mood-pills">' +
            moods.map(function (m) {
              return '<button type="button" class="mood-pill' + (state.mood === m ? " active" : "") +
                '" data-action="mood" data-mood="' + m + '">' + m + "</button>";
            }).join("") +
          "</div>" +
          '<button class="btn btn-primary" style="width:auto;min-width:7rem" data-action="create-post">Post</button>' +
        "</div>" +
      "</div>"
    );
  }

  function rightRail() {
    var me = currentUser();
    var suggestions = db.users.filter(function (u) {
      return u.id !== me.id && !isFriend(me.id, u.id) && !pendingRequest(me.id, u.id);
    }).slice(0, 4);
    var contacts = friendsOf(me.id).slice(0, 6);
    return (
      '<aside class="right-rail">' +
        '<div class="panel">' +
          '<h3 class="rail-title">People you may know</h3>' +
          (suggestions.length
            ? suggestions.map(function (u) {
                return (
                  '<div class="person-row">' +
                    avatarHtml(u, "sm") +
                    '<div class="meta"><strong>' + esc(u.name) + "</strong><span>@" + esc(u.handle) + "</span></div>" +
                    '<button class="btn btn-soft" style="width:auto;min-height:2rem;padding:0.35rem 0.7rem;font-size:0.8rem" data-action="add-friend" data-id="' +
                      u.id + '">Add</button>' +
                  "</div>"
                );
              }).join("")
            : '<p class="empty" style="padding:0.5rem">You’re connected to everyone in the demo.</p>') +
        "</div>" +
        '<div class="panel">' +
          '<h3 class="rail-title">Contacts</h3>' +
          contacts.map(function (u) {
            return (
              '<button class="person-row" style="width:100%;text-align:left" data-action="message-user" data-id="' + u.id + '">' +
                avatarHtml(u, "sm") +
                '<div class="meta"><strong>' + esc(u.name) + '</strong><span>Message</span></div>' +
              "</button>"
            );
          }).join("") +
        "</div>" +
      "</aside>"
    );
  }

  function renderFeed() {
    var q = state.search.trim().toLowerCase();
    var searchResults = "";
    if (q) {
      var hits = db.users.filter(function (u) {
        return u.name.toLowerCase().indexOf(q) >= 0 || u.handle.toLowerCase().indexOf(q) >= 0;
      });
      searchResults =
        '<div class="panel"><h3 class="rail-title">Search results</h3>' +
        (hits.length
          ? hits.map(function (u) {
              return (
                '<button class="person-row" style="width:100%;text-align:left" data-action="open-profile" data-id="' + u.id + '">' +
                  avatarHtml(u, "sm") +
                  '<div class="meta"><strong>' + esc(u.name) + "</strong><span>@" + esc(u.handle) + "</span></div>" +
                "</button>"
              );
            }).join("")
          : '<p class="empty" style="padding:0.75rem">No people match “' + esc(state.search) + '”.</p>') +
        "</div>";
    }
    return (
      topbar() +
      '<h1 class="page-title">Home</h1>' +
      searchResults +
      storiesBar() +
      composer() +
      feedPosts(null)
    );
  }

  function renderFriends() {
    var me = currentUser();
    var reqs = incomingRequests();
    var friends = friendsOf(me.id);
    var others = db.users.filter(function (u) {
      return u.id !== me.id && !isFriend(me.id, u.id);
    });
    return (
      topbar() +
      '<h1 class="page-title">Friends</h1>' +
      (reqs.length
        ? '<div class="panel"><h3 class="rail-title">Friend requests</h3>' +
          reqs.map(function (r) {
            var u = userById(r.from);
            return (
              '<div class="person-row">' +
                avatarHtml(u) +
                '<div class="meta"><strong>' + esc(u.name) + "</strong><span>@" + esc(u.handle) + "</span></div>" +
                '<button class="btn btn-primary" style="width:auto;min-height:2.2rem;padding:0.4rem 0.9rem" data-action="accept-friend" data-id="' +
                  r.id + '">Accept</button>' +
                '<button class="btn btn-ghost" style="width:auto;min-height:2.2rem;padding:0.4rem 0.9rem" data-action="decline-friend" data-id="' +
                  r.id + '">Decline</button>' +
              "</div>"
            );
          }).join("") +
          "</div>"
        : "") +
      '<div class="panel"><h3 class="rail-title">Your friends (' + friends.length + ")</h3>" +
        '<div class="friends-grid">' +
          friends.map(function (u) {
            return (
              '<div class="friend-card">' +
                avatarHtml(u) +
                "<div><strong>" + esc(u.name) + '</strong><div class="meta">@' + esc(u.handle) + "</div></div>" +
                '<button class="btn btn-ghost" style="width:auto" data-action="open-profile" data-id="' + u.id + '">View</button>' +
              "</div>"
            );
          }).join("") +
        "</div></div>" +
      '<div class="panel"><h3 class="rail-title">Discover</h3>' +
        '<div class="friends-grid">' +
          others.map(function (u) {
            var pending = pendingRequest(me.id, u.id);
            return (
              '<div class="friend-card">' +
                avatarHtml(u) +
                "<div><strong>" + esc(u.name) + '</strong><div class="meta">@' + esc(u.handle) + "</div></div>" +
                (pending
                  ? '<button class="btn btn-ghost" style="width:auto" disabled>Requested</button>'
                  : '<button class="btn btn-soft" style="width:auto" data-action="add-friend" data-id="' + u.id + '">Add friend</button>') +
              "</div>"
            );
          }).join("") +
        "</div></div>"
    );
  }

  function renderNotifications() {
    var me = currentUser();
    var notes = db.notifications
      .filter(function (n) { return n.userId === me.id; })
      .sort(function (a, b) { return b.at - a.at; });
    setTimeout(function () {
      var dirty = false;
      db.notifications.forEach(function (n) {
        if (n.userId === me.id && !n.read) {
          n.read = true;
          dirty = true;
        }
      });
      if (dirty) save();
    }, 600);
    return (
      topbar() +
      '<h1 class="page-title">Notifications</h1>' +
      '<div class="panel">' +
        (notes.length
          ? notes.map(function (n) {
              var from = userById(n.fromId);
              return (
                '<div class="notif-row' + (n.read ? "" : " unread") + '">' +
                  avatarHtml(from, "sm") +
                  '<div class="meta"><strong>' + esc(n.text) + '</strong><span>' + relativeTime(n.at) + "</span></div>" +
                "</div>"
              );
            }).join("")
          : '<p class="empty">You’re all caught up.</p>') +
      "</div>"
    );
  }

  function renderMessages() {
    var me = currentUser();
    var threads = db.messages
      .filter(function (t) { return t.participants.indexOf(me.id) >= 0; })
      .sort(function (a, b) {
        var am = a.messages[a.messages.length - 1];
        var bm = b.messages[b.messages.length - 1];
        return ((bm && bm.at) || 0) - ((am && am.at) || 0);
      });
    if (!state.activeChatId && threads[0]) state.activeChatId = threads[0].id;
    var active = db.messages.find(function (t) { return t.id === state.activeChatId; });
    var other = active
      ? userById(active.participants.find(function (id) { return id !== me.id; }))
      : null;

    return (
      topbar() +
      '<h1 class="page-title">Messages</h1>' +
      '<div class="panel"><div class="chat-layout">' +
        '<div class="chat-list">' +
          (threads.length
            ? threads.map(function (t) {
                var o = userById(t.participants.find(function (id) { return id !== me.id; }));
                var last = t.messages[t.messages.length - 1];
                return (
                  '<button class="chat-item' + (t.id === state.activeChatId ? " active" : "") +
                    '" data-action="open-chat" data-id="' + t.id + '">' +
                    avatarHtml(o, "sm") +
                    '<div class="meta"><strong>' + esc(o.name) + '</strong><span>' +
                      esc(last ? last.text : "Say hello") + "</span></div>" +
                  "</button>"
                );
              }).join("")
            : '<p class="empty">No conversations yet. Message a friend from Contacts.</p>') +
        "</div>" +
        '<div class="chat-thread">' +
          (active && other
            ? '<div class="chat-thread-head">' + esc(other.name) + "</div>" +
              '<div class="chat-messages">' +
                active.messages.map(function (m) {
                  return '<div class="bubble' + (m.from === me.id ? " mine" : "") + '">' + esc(m.text) +
                    '<div class="meta" style="margin-top:0.35rem;font-size:0.75rem;opacity:.7">' +
                    relativeTime(m.at) + "</div></div>";
                }).join("") +
              "</div>" +
              '<form class="chat-compose" id="chat-form">' +
                '<input placeholder="Write a message…" value="' + esc(state.chatDraft) + '" data-bind="chatDraft" />' +
                '<button class="btn btn-primary" style="width:auto" type="submit">Send</button>' +
              "</form>"
            : '<div class="empty">Select a conversation</div>') +
        "</div>" +
      "</div></div>"
    );
  }

  function renderProfile(userId) {
    var me = currentUser();
    var user = userById(userId || me.id);
    if (!user) return '<div class="panel empty">User not found.</div>';
    var mine = user.id === me.id;
    var friend = isFriend(me.id, user.id);
    var pending = pendingRequest(me.id, user.id);
    var posts = db.posts.filter(function (p) { return p.authorId === user.id; }).length;
    var friends = friendsOf(user.id).length;

    var actionBtn = "";
    if (mine) {
      actionBtn = '<button class="btn btn-ghost" data-action="logout">Log out</button>';
    } else if (friend) {
      actionBtn =
        '<button class="btn btn-soft" style="width:auto" data-action="message-user" data-id="' + user.id + '">Message</button>' +
        '<button class="btn btn-ghost" style="width:auto" disabled>Friends</button>';
    } else if (pending) {
      actionBtn = '<button class="btn btn-ghost" style="width:auto" disabled>Request sent</button>';
    } else {
      actionBtn = '<button class="btn btn-primary" style="width:auto" data-action="add-friend" data-id="' + user.id + '">Add friend</button>';
    }

    return (
      topbar() +
      '<div class="panel" style="padding-bottom:0.25rem">' +
        '<div class="profile-cover" style="background:' + esc(user.cover) + '"></div>' +
        '<div class="profile-main">' +
          avatarHtml(user, "lg") +
          "<div><h2>" + esc(user.name) + "</h2><p>@" + esc(user.handle) +
            (user.location ? " · " + esc(user.location) : "") + "</p></div>" +
          '<div class="profile-actions">' + actionBtn + "</div>" +
        "</div>" +
        '<p style="color:var(--mist-dim);margin:0 0 1rem">' + esc(user.bio) + "</p>" +
        '<div class="profile-stats">' +
          '<div class="stat"><strong>' + posts + "</strong><span>Posts</span></div>" +
          '<div class="stat"><strong>' + friends + "</strong><span>Friends</span></div>" +
          '<div class="stat"><strong>' + new Date(user.joined).getFullYear() + "</strong><span>Joined</span></div>" +
        "</div>" +
      "</div>" +
      '<h1 class="page-title" style="font-size:1.2rem">Posts</h1>' +
      feedPosts(user.id)
    );
  }

  function storyModal() {
    if (!state.storyOpen) return "";
    var story = db.stories.find(function (s) { return s.id === state.storyOpen; });
    if (!story) return "";
    var u = userById(story.authorId);
    return (
      '<div class="story-modal" data-action="close-story">' +
        '<div class="story-modal-card mood-' + esc(story.mood) + '" role="dialog" aria-label="Story" data-stop="1">' +
          '<div style="display:flex;align-items:center;gap:0.65rem">' +
            avatarHtml(u, "sm") +
            "<div><strong>" + esc(u.name) + '</strong><div class="meta">' + relativeTime(story.createdAt) + "</div></div>" +
          "</div>" +
          '<div style="font-family:var(--font-display);font-size:2rem;letter-spacing:-0.03em">' + esc(story.label) + "</div>" +
          '<button class="btn btn-ghost" data-action="close-story">Close</button>' +
        "</div>" +
      "</div>"
    );
  }

  function renderApp() {
    var main = "";
    if (state.view === "feed") main = renderFeed();
    else if (state.view === "friends") main = renderFriends();
    else if (state.view === "notifications") main = renderNotifications();
    else if (state.view === "messages") main = renderMessages();
    else if (state.view === "profile") main = renderProfile(currentUser().id);
    else if (state.view === "user") main = renderProfile(state.profileId);
    else main = renderFeed();

    return (
      '<div class="app-shell">' +
        sideNav() +
        '<main class="main-col">' + main + "</main>" +
        (state.view === "feed" ? rightRail() : '<aside class="right-rail"></aside>') +
      "</div>" +
      mobileNav() +
      storyModal() +
      (state.toast ? '<div class="toast">' + esc(state.toast) + "</div>" : "")
    );
  }

  function render() {
    var root = document.getElementById("app");
    if (!root) return;
    if (!currentUser()) {
      root.innerHTML = renderAuth();
    } else {
      root.innerHTML = renderApp();
    }
    bind();
  }

  function bind() {
    var authForm = document.getElementById("auth-form");
    if (authForm) {
      authForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(authForm);
        if (state.authMode === "login") {
          login(String(fd.get("email") || ""), String(fd.get("password") || ""));
        } else {
          signup(
            String(fd.get("name") || ""),
            String(fd.get("handle") || ""),
            String(fd.get("email") || ""),
            String(fd.get("password") || "")
          );
        }
      });
    }

    var chatForm = document.getElementById("chat-form");
    if (chatForm) {
      chatForm.addEventListener("submit", function (e) {
        e.preventDefault();
        sendMessage();
      });
    }

    document.querySelectorAll("[data-comment-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        addComment(form.getAttribute("data-comment-form"));
      });
    });

    document.querySelectorAll("[data-bind]").forEach(function (el) {
      el.addEventListener("input", function () {
        var key = el.getAttribute("data-bind");
        state[key] = el.value;
        if (key === "search") {
          // live search without full remount of caret issues — soft re-render
          render();
          var again = document.querySelector('[data-bind="search"]');
          if (again) {
            again.focus();
            var len = again.value.length;
            again.setSelectionRange(len, len);
          }
        }
      });
    });

    document.querySelectorAll("[data-comment]").forEach(function (el) {
      el.addEventListener("input", function () {
        state.commentDrafts[el.getAttribute("data-comment")] = el.value;
      });
    });

    document.querySelectorAll("[data-stop]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });

    document.querySelectorAll("[data-action]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        var action = el.getAttribute("data-action");
        var id = el.getAttribute("data-id");
        handleAction(action, id, el);
      });
    });
  }

  function handleAction(action, id, el) {
    if (action === "switch-auth") {
      state.authMode = el.getAttribute("data-mode");
      state.authError = "";
      render();
      return;
    }
    if (action === "nav") {
      var view = el.getAttribute("data-view");
      state.view = view;
      if (view === "profile") state.profileId = currentUser().id;
      if (view === "messages" && !state.activeChatId) {
        var me = currentUser();
        var t = db.messages.find(function (x) { return x.participants.indexOf(me.id) >= 0; });
        state.activeChatId = t ? t.id : null;
      }
      render();
      return;
    }
    if (action === "logout") {
      logout();
      return;
    }
    if (action === "mood") {
      state.mood = el.getAttribute("data-mood");
      render();
      return;
    }
    if (action === "create-post") {
      createPost();
      return;
    }
    if (action === "like") {
      toggleLike(id);
      return;
    }
    if (action === "focus-comment") {
      var input = document.querySelector('[data-comment="' + id + '"]');
      if (input) input.focus();
      return;
    }
    if (action === "share-post") {
      toast("Link copied (demo)");
      return;
    }
    if (action === "open-profile") {
      state.view = "user";
      state.profileId = id;
      render();
      return;
    }
    if (action === "add-friend") {
      sendFriendRequest(id);
      return;
    }
    if (action === "accept-friend") {
      acceptFriendRequest(id);
      return;
    }
    if (action === "decline-friend") {
      declineFriendRequest(id);
      return;
    }
    if (action === "message-user") {
      state.activeChatId = ensureChat(id);
      state.view = "messages";
      render();
      return;
    }
    if (action === "open-chat") {
      state.activeChatId = id;
      render();
      return;
    }
    if (action === "open-story") {
      state.storyOpen = id;
      render();
      return;
    }
    if (action === "close-story") {
      state.storyOpen = null;
      render();
    }
  }

  // Expose reset for testing
  window.KinApp = {
    reset: function () {
      localStorage.removeItem(STORAGE_KEY);
      db = loadStore();
      state.view = "landing";
      render();
    },
    loginAsDemo: function () {
      login(seed.demoEmail, seed.demoPassword);
    }
  };

  render();
})();
