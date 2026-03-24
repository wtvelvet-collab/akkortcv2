// 👤 USERNAME (saved)
let username = localStorage.getItem("username");

if (!username) {
  username = prompt("Enter your username:");
  if (!username) username = "Anonymous";
  localStorage.setItem("username", username);
}

// 🆔 client id
const clientId = Math.random().toString(36).substring(2);

// 🔌 connect to Ably
const ably = new Ably.Realtime({
  authUrl: "/.netlify/functions/token",
  clientId: clientId
});

// debug connection
ably.connection.on("connected", () => {
  console.log("✅ Connected to Ably");
});

// 📡 channel
const channel = ably.channels.get("chat");

// 💬 ADD MESSAGE TO SCREEN
function addMessage(text, name, senderId) {
  const messages = document.getElementById("messages");

  if (!messages) {
    console.error("❌ messages div missing");
    return;
  }

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

// 📨 SEND MESSAGE (FIXED)
function sendMessage() {
  const input = document.getElementById("input");

  if (!input || input.value.trim() === "") return;

  const text = input.value.trim();

  console.log("📤 Sending:", text);

  // ✅ SHOW MESSAGE IMMEDIATELY
  addMessage(text, username, clientId);

  // send to Ably
  channel.publish("message", {
    text: text,
    username: username,
    sender: clientId
  });

  input.value = "";
}

// 📥 RECEIVE MESSAGES
channel.subscribe("message", (msg) => {
  console.log("📩 Received:", msg);

  // ❌ skip your own messages (already shown)
  if (msg.data.sender === clientId) return;

  addMessage(
    msg.data.text,
    msg.data.username,
    msg.data.sender
  );
});

// ⌨️ ENTER TO SEND
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }
});

// 🧪 TEST MESSAGE (should ALWAYS show)
addMessage("✅ Chat is working", "System", "system");
