importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

importScripts('/firebase-config.js');

// Initialize Firebase using the auto-generated config
firebase.initializeApp(self.firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Gửi thông báo tới các tab đang mở (để đổi title web)
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
    for (let client of windowClients) {
      client.postMessage({ type: 'NEW_BACKGROUND_MESSAGE', payload: payload });
    }
  });

  // Firebase SDK automatically displays the notification if the payload contains a 'notification' object.
  // We only need to manually show it if we are using 'data' only payloads.
  // Since our backend sends 'notification', we don't need to call self.registration.showNotification() here,
  // otherwise it will show twice!
});
