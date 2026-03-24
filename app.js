// 👤 USERNAME (saved)
let username = localStorage.getItem("username");

if (!username) {
  username = prompt("Enter your username:");
  if (!username) username = "Anonymous";
  localStorage.setItem("username", username);
}

// 🆔 unique client id
let clientId = Math.random().toString(36).substring(2);

// 🔌 connect to Ably
const ably = new Ably.Realtime({
  authUrl: "/.netlify/functions/token",
  clientId: clientId
});

// debug connection
ably.connection.on("connected", () => {
  console.log("✅ Connected to Ably");
});

// 📡 channels
const chatChannel = ably.channels.get("chat");
const presenceChannel = ably.channels.get("presence");

// 💬 ADD MESSAGE TO UI
function addMessage(text, name, senderId) {
  const messages = document.getElementById("messages");

  if (!messages) {
    console.error("❌ messages div not found");
    return;
  }

  const div = document.createElement("div");
  div.classList.add("message");

  if (senderId === clientId) {
    div.classList.add("me");
  } else {
    div.classList.add("other");
  }

  div.innerHTML = `
    <div class="name">${name}</div>
    <div class="bubble">${text}</div>
  `;

  messages.appendChild(div);
  div.scrollIntoView();
}

// 📨 SEND MESSAGE
function sendMessage() {
  const input = document.getElementById("input");

  if (!input || !input.value) return;

  console.log("📤 Sending:", input.value);

  chatChannel.publish("message", {
    text: input.value,
    username: username,
    sender: clientId
  });

  input.value = "";
}

// 📥 RECEIVE MESSAGES
chatChannel.subscribe("message", (msg) => {
  console.log("📩 Received:", msg);

  addMessage(
    msg.data.text,
    msg.data.username,
    msg.data.sender
  );
});

// 🟢 PRESENCE (ONLINE USERS)

// join presence
presenceChannel.presence.enter({
  username: username
});

// update sidebar
function updateUsers() {
  presenceChannel.presence.get((err, members) => {
    if (err) {
      console.error("❌ Presence error:", err);
      return;
    }

    const usersDiv = document.getElementById("users");

    if (!usersDiv) {
      console.error("❌ users div not found");
      return;
    }

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

// listen for join/leave
presenceChannel.presence.subscribe(() => {
  console.log("👥 Presence updated");
  updateUsers();
});

// initial load
setTimeout(updateUsers, 1000);

// ⌨️ ENTER KEY TO SEND
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

// 🧪 TEST MESSAGE (REMOVE LATER)
addMessage("✅ Chat loaded successfully", "System", "system");
