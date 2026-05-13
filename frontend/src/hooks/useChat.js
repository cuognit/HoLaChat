import { useContext } from 'react';
import { ChatContext } from '../context/chatContextInstance';

export function useChat() {
  return useContext(ChatContext);
}
