// 👤 USERNAME (saved)
let username = localStorage.getItem("username");

if (!username) {
  username = prompt("Enter your username:");
  if (!username) username = "Anonymous";
  localStorage.setItem("username", username);
}

// 🆔 client id
const clientId = Math.random().toString(36).substring(2);

// 🔌 connect
const ably = new Ably.Realtime({
  authUrl: "/.netlify/functions/token",
  clientId: clientId
});

// debug
ably.connection.on("connected", () => {
  console.log("✅ Connected to Ably");
});

// 📡 channel WITH history
const channel = ably.channels.get("chat", {
  params: { rewind: "50" }
});

// 🟢 presence
const presence = ably.channels.get("presence");

// 💬 add message
function addMessage(text, name, senderId) {
  const messages = document.getElementById("messages");

  const msg = document.createElement("div");
  msg.classList.add("message");

  if (senderId === clientId) {
    msg.classList.add("me");
  } else {
    msg.classList.add("other");
  }

  msg.innerHTML = `
    <div class="name">${name}</div>
    <div class="bubble">${text}</div>
  `;

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

// 📜 LOAD HISTORY
channel.history({ limit: 50 }, (err, result) => {
  if (err) return console.error(err);

  result.items.reverse().forEach(msg => {
    addMessage(
      msg.data.text,
      msg.data.username,
      msg.data.sender
    );
  });
});

// 📥 receive
channel.subscribe("message", (msg) => {
  if (msg.data.sender === clientId) return;

  addMessage(
    msg.data.text,
    msg.data.username,
    msg.data.sender
  );
});

// 📨 send
function sendMessage() {
  const input = document.getElementById("input");

  if (!input.value.trim()) return;

  const text = input.value.trim();

  addMessage(text, username, clientId);

  channel.publish("message", {
    text,
    username,
    sender: clientId
  });

  input.value = "";
}

// ⌨️ enter to send
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});

// 🟢 presence join
presence.presence.enter({ username });

// update users
function updateUsers() {
  presence.presence.get((err, members) => {
    if (err) return;

    const usersDiv = document.getElementById("users");
    usersDiv.innerHTML = "";

    members.forEach(member => {
      const div = document.createElement("div");
      div.classList.add("user");

      div.innerHTML = `
        <div class="dot"></div>
        ${member.data.username}
      `;

      usersDiv.appendChild(div);
    });
  });
}

// listen for presence changes
presence.presence.subscribe(updateUsers);
setTimeout(updateUsers, 1000);
