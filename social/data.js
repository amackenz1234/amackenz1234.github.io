/* SocialFace seed data — demo users, posts, and conversations */
window.SOCIALFACE_SEED = (function () {
  "use strict";

  var now = Date.now();
  var hour = 3600000;
  var day = 86400000;

  var users = [
    {
      id: "u_maya",
      name: "Maya Chen",
      handle: "maya",
      email: "maya@socialface.demo",
      password: "demo1234",
      bio: "Product designer. Coffee before pixels.",
      location: "Portland, OR",
      avatar: "MC",
      color: "#1a9b8e",
      cover: "linear-gradient(135deg,#0c1118 0%,#1a9b8e 55%,#f0c75e 100%)",
      joined: now - 400 * day
    },
    {
      id: "u_jordan",
      name: "Jordan Blake",
      handle: "jordan",
      email: "jordan@socialface.demo",
      password: "demo1234",
      bio: "Trail runner · weekend photographer",
      location: "Denver, CO",
      avatar: "JB",
      color: "#e07a3d",
      cover: "linear-gradient(120deg,#1b2838,#e07a3d)",
      joined: now - 320 * day
    },
    {
      id: "u_sam",
      name: "Sam Okonkwo",
      handle: "sam",
      email: "sam@socialface.demo",
      password: "demo1234",
      bio: "Building things that feel human.",
      location: "Austin, TX",
      avatar: "SO",
      color: "#4d7cff",
      cover: "linear-gradient(160deg,#101828,#4d7cff 70%)",
      joined: now - 210 * day
    },
    {
      id: "u_riley",
      name: "Riley Park",
      handle: "riley",
      email: "riley@socialface.demo",
      password: "demo1234",
      bio: "Music, markets, morning light.",
      location: "Brooklyn, NY",
      avatar: "RP",
      color: "#c45d8c",
      cover: "linear-gradient(135deg,#1a1020,#c45d8c)",
      joined: now - 180 * day
    },
    {
      id: "u_alex",
      name: "Alex Rivera",
      handle: "alex",
      email: "alex@socialface.demo",
      password: "demo1234",
      bio: "Chef by night, gardener by day.",
      location: "Oakland, CA",
      avatar: "AR",
      color: "#6a9a3a",
      cover: "linear-gradient(145deg,#0f1a12,#6a9a3a)",
      joined: now - 90 * day
    }
  ];

  var friendships = [
    { a: "u_maya", b: "u_jordan", since: now - 100 * day },
    { a: "u_maya", b: "u_sam", since: now - 80 * day },
    { a: "u_maya", b: "u_riley", since: now - 60 * day },
    { a: "u_jordan", b: "u_sam", since: now - 50 * day },
    { a: "u_jordan", b: "u_alex", since: now - 40 * day },
    { a: "u_sam", b: "u_riley", since: now - 30 * day },
    { a: "u_riley", b: "u_alex", since: now - 20 * day }
  ];

  var friendRequests = [
    { id: "fr1", from: "u_alex", to: "u_maya", at: now - 5 * hour }
  ];

  var posts = [
    {
      id: "p1",
      authorId: "u_jordan",
      text: "Sunrise at Red Rocks before the crowds. Worth the 5am alarm every single time.",
      mood: "outdoors",
      createdAt: now - 2 * hour,
      likes: ["u_maya", "u_sam", "u_riley"],
      comments: [
        { id: "c1", authorId: "u_maya", text: "That light is unreal. Save me a spot next week?", createdAt: now - 90 * 60000 },
        { id: "c2", authorId: "u_sam", text: "Sending this to my hiking group immediately.", createdAt: now - 40 * 60000 }
      ]
    },
    {
      id: "p2",
      authorId: "u_riley",
      text: "Found a vinyl shop that still handwrites recommendation cards. Support the weird little places.",
      mood: "city",
      createdAt: now - 5 * hour,
      likes: ["u_maya", "u_alex"],
      comments: [
        { id: "c3", authorId: "u_alex", text: "Name drop please — I need this in my life.", createdAt: now - 3 * hour }
      ]
    },
    {
      id: "p3",
      authorId: "u_sam",
      text: "Shipped a tiny feature that made three people smile in standup. Not everything has to be a platform.",
      mood: "work",
      createdAt: now - 9 * hour,
      likes: ["u_jordan", "u_maya", "u_riley", "u_alex"],
      comments: []
    },
    {
      id: "p4",
      authorId: "u_alex",
      text: "Tonight's special: roasted squash toast with chili honey and ricotta. Come hungry.",
      mood: "food",
      createdAt: now - 14 * hour,
      likes: ["u_riley", "u_jordan"],
      comments: [
        { id: "c4", authorId: "u_riley", text: "Already on the way.", createdAt: now - 12 * hour }
      ]
    },
    {
      id: "p5",
      authorId: "u_maya",
      text: "Redesigning onboarding for the third time this year. The third time's the charm… right?",
      mood: "work",
      createdAt: now - 26 * hour,
      likes: ["u_sam", "u_jordan"],
      comments: [
        { id: "c5", authorId: "u_sam", text: "Ship the honest version. Users forgive rough edges more than confusion.", createdAt: now - 20 * hour }
      ]
    }
  ];

  var stories = [
    { id: "s1", authorId: "u_jordan", label: "Trail", mood: "outdoors", createdAt: now - hour },
    { id: "s2", authorId: "u_alex", label: "Kitchen", mood: "food", createdAt: now - 2 * hour },
    { id: "s3", authorId: "u_riley", label: "Market", mood: "city", createdAt: now - 3 * hour },
    { id: "s4", authorId: "u_sam", label: "Desk", mood: "work", createdAt: now - 4 * hour }
  ];

  var messages = [
    {
      id: "m1",
      participants: ["u_maya", "u_jordan"],
      messages: [
        { id: "msg1", from: "u_jordan", text: "Coffee tomorrow before the hike?", at: now - 6 * hour },
        { id: "msg2", from: "u_maya", text: "Yes — 7:30 at Coava?", at: now - 5.5 * hour },
        { id: "msg3", from: "u_jordan", text: "Perfect. Bring the good camera.", at: now - 5 * hour }
      ]
    },
    {
      id: "m2",
      participants: ["u_maya", "u_sam"],
      messages: [
        { id: "msg4", from: "u_sam", text: "Loved your onboarding draft. Mind if I leave notes?", at: now - day },
        { id: "msg5", from: "u_maya", text: "Please do — brutal honesty welcome.", at: now - 20 * hour }
      ]
    }
  ];

  var notifications = [
    { id: "n1", userId: "u_maya", type: "friend_request", fromId: "u_alex", postId: null, text: "Alex Rivera sent you a friend request", read: false, at: now - 5 * hour },
    { id: "n2", userId: "u_maya", type: "like", fromId: "u_jordan", postId: "p5", text: "Jordan Blake liked your post", read: false, at: now - 18 * hour },
    { id: "n3", userId: "u_maya", type: "comment", fromId: "u_sam", postId: "p5", text: "Sam Okonkwo commented on your post", read: true, at: now - 20 * hour },
    { id: "n4", userId: "u_maya", type: "like", fromId: "u_riley", postId: "p1", text: "Riley Park liked a post in your feed", read: true, at: now - day }
  ];

  return {
    users: users,
    friendships: friendships,
    friendRequests: friendRequests,
    posts: posts,
    stories: stories,
    messages: messages,
    notifications: notifications,
    demoEmail: "maya@socialface.demo",
    demoPassword: "demo1234"
  };
})();
