/**
 * File: useChat.js
 * Chức năng: Các custom hook dùng chung cho logic React.
 */
import { useContext } from 'react';
import { ChatContext } from '../context/chatContextInstance';

export function useChat() {
  return useContext(ChatContext);
}
