let username = prompt("Enter your username:");
if (!username) username = "Anonymous";

let clientId = Math.random().toString(36).substring(2);

const ably = new Ably.Realtime({
  authUrl: "/.netlify/functions/token",
  clientId: clientId
});

const chatChannel = ably.channels.get("chat");
const presenceChannel = ably.channels.get("presence");

function addMessage(text, name, senderId) {
  const div = document.createElement("div");
  div.classList.add("message");

  if (senderId === clientId) {
    div.classList.add("me");
  } else {
    div.classList.add("other");
  }

  div.innerHTML = `
    <div class="name">${name}</div>
    <div>${text}</div>
  `;

  document.getElementById("messages").appendChild(div);
  div.scrollIntoView();
}

function sendMessage() {
  const input = document.getElementById("input");
  if (!input.value) return;

  chatChannel.publish("message", {
    text: input.value,
    username: username,
    sender: clientId
  });

  input.value = "";
}

chatChannel.subscribe("message", msg => {
  addMessage(msg.data.text, msg.data.username, msg.data.sender);
});

// presence
presenceChannel.presence.enter({ username });

function updateUsers() {
  presenceChannel.presence.get((err, members) => {
    const usersDiv = document.getElementById("users");
    usersDiv.innerHTML = "";

    members.forEach(member => {
      const div = document.createElement("div");
      div.classList.add("user");
      div.innerHTML = `<div class="dot"></div>${member.data.username}`;
      usersDiv.appendChild(div);
    });
  });
}

presenceChannel.presence.subscribe(updateUsers);
setTimeout(updateUsers, 1000);
