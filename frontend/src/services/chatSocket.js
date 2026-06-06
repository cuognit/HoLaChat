import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { getAuthToken } from "../api/axiosConfig";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

let stompClient = null;

function createSocket() {
    return new SockJS(WS_URL);
}

function createClient() {
    return new Client({
        webSocketFactory: createSocket,
        beforeConnect: () => {
            const token = getAuthToken();
            if (token) {
                stompClient.connectHeaders = {
                    Authorization: `Bearer ${token}`,
                };
            } else {
                stompClient.connectHeaders = {};
            }
        },
        reconnectDelay: 5000,
        debug: () => {},
    });
}

const listeners = new Set();

export function getChatSocketClient() {
    if (!stompClient) {
        stompClient = createClient();
    }

    return stompClient;
}

export function activateChatSocket(callbacks = {}) {
    const client = getChatSocketClient();

    listeners.add(callbacks);

    client.onConnect = (frame) => {
        listeners.forEach(l => l.onConnect?.(frame));
    };

    client.onStompError = (frame) => {
        listeners.forEach(l => l.onStompError?.(frame));
    };

    client.onWebSocketClose = (event) => {
        listeners.forEach(l => l.onWebSocketClose?.(event));
    };

    client.onWebSocketError = (event) => {
        listeners.forEach(l => l.onWebSocketError?.(event));
    };

    if (!client.active) {
        client.activate();
    } else if (client.connected) {
        callbacks.onConnect?.();
    }

    return client;
}

export function deactivateChatSocket(callbacks) {
    if (callbacks) {
        listeners.delete(callbacks);
    }
}

export async function forceDeactivateChatSocket() {
    listeners.clear();
    if (stompClient?.active) {
        await stompClient.deactivate();
        stompClient = null;
    }
}

export function isChatSocketConnected() {
    return Boolean(stompClient?.connected);
}

export function subscribeToDestination(destination, handler) {
    const client = getChatSocketClient();

    if (!client.connected) {
        return null;
    }

    return client.subscribe(destination, (message) => {
        try {
            const parsedMessage = JSON.parse(message.body);
            handler(parsedMessage);
        } catch {
            handler(message.body);
        }
    });
}

export function publishToDestination(destination, body) {
    const client = getChatSocketClient();

    if (!client.connected) {
        throw new Error("Socket chua ket noi");
    }

    client.publish({
        destination,
        body: JSON.stringify(body),
    });
}
