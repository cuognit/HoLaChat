import { useCallback, useEffect, useRef, useState } from "react";
import {
    activateChatSocket,
    deactivateChatSocket,
    isChatSocketConnected,
    publishToDestination,
    subscribeToDestination,
} from "../services/chatSocket";

export function useChatSocket() {
    const [isConnected, setIsConnected] = useState(isChatSocketConnected());
    const subscriptionsRef = useRef([]);

    useEffect(() => {
        const client = activateChatSocket({
            onConnect: () => setIsConnected(true),
            onStompError: () => setIsConnected(false),
            onWebSocketClose: () => setIsConnected(false),
            onWebSocketError: () => setIsConnected(false),
        });

        if (client.connected) {
            setIsConnected(true);
        }

        return () => {
            subscriptionsRef.current.forEach((subscription) => subscription?.unsubscribe());
            subscriptionsRef.current = [];
            deactivateChatSocket();
        };
    }, []);

    const subscribe = useCallback((destination, handler) => {
        const subscription = subscribeToDestination(destination, handler);

        if (subscription) {
            subscriptionsRef.current.push(subscription);
        }

        return subscription;
    }, []);

    const publish = useCallback((destination, body) => {
        publishToDestination(destination, body);
    }, []);

    return {
        isConnected,
        publish,
        subscribe,
    };
}
