import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import { toast } from 'sonner';
import { BellRing } from 'lucide-react';
import api from '../api/axiosConfig';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const useFirebaseMessaging = () => {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    // Hàm xử lý đổi title khi có tin nhắn
    const notifyNewMessage = () => {
      if (document.hidden) {
        document.title = '(1) Tin nhắn mới - HoLaChat';
      }
    };

    // Listener for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Received foreground message: ', payload);
      
      const title = payload.notification?.title || 'Tin nhắn mới';
      const body = payload.notification?.body || 'Bạn có một tin nhắn mới.';
      
      toast(title, {
        description: body,
        icon: <BellRing className="w-5 h-5 text-blue-500" />,
        style: {
          backgroundColor: '#eef2ff', // blue-50
          borderColor: '#bfdbfe',     // blue-200
          color: '#1e40af',           // blue-900
        }
      });

      notifyNewMessage();
    });

    // Listener for messages from Service Worker (background)
    const handleServiceWorkerMessage = (event) => {
      if (event.data && event.data.type === 'NEW_BACKGROUND_MESSAGE') {
        notifyNewMessage();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Reset title khi người dùng quay lại tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        document.title = 'HoLa';
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const requestPermission = async () => {
    try {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        
        // Get the device token
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        
        if (token) {
          console.log('FCM Token generated:', token);
          setFcmToken(token);
          
          // Send this token to the backend server
          try {
            await api.post('/device-token/save', { token });
            console.log('Token successfully sent to backend.');
          } catch (apiError) {
            console.error('Error sending token to backend:', apiError);
          }
          
          return token;
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
    }
    return null;
  };

  return { fcmToken, requestPermission };
};
