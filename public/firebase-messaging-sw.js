/* global importScripts, firebase, clients */
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
apiKey: "AIzaSyAGHwowscXnkIDIfgqh0hhiInlHGJR4D8I",
  authDomain: "chat-app-f73d7.firebaseapp.com",
  projectId: "chat-app-f73d7",
  storageBucket: "chat-app-f73d7.firebasestorage.app",
  messagingSenderId: "632704641930",
  appId: "1:632704641930:web:006d7aa74a31e4e8ca7673",
  measurementId: "G-K4ZNWC04N8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message:", payload);

  self.registration.showNotification(payload.data.title, {
    body: payload.data.body,
    icon: payload.data.image || "chat.png",
    data: {
      conversationId: payload.data.conversationId,
    },
  });
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const conversationId = event.notification.data.conversationId;
  const url = `https://chat-iznx.onrender.com/chat/${conversationId}`;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/chat") && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});