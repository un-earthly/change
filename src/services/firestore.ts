import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDocs,
  type DocumentReference,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Conversation {
  id: string;
  participants: string[];
  participantLanguages: Record<string, string>;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp | null;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  type: 'text' | 'voice';
  audioURL?: string;
  createdAt: Timestamp | null;
}

export async function createConversation(
  userId: string,
  myLanguage: string,
  otherLanguage: string
): Promise<string> {
  const convoRef = await addDoc(collection(db, 'conversations'), {
    participants: [userId, 'other'], // 'other' is placeholder for demo
    participantLanguages: {
      [userId]: myLanguage,
      other: otherLanguage,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return convoRef.id;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  originalText: string,
  translatedText: string,
  sourceLanguage: string,
  targetLanguage: string,
  type: 'text' | 'voice' = 'text',
  audioURL?: string
): Promise<void> {
  const msgRef = collection(db, 'messages');
  await addDoc(msgRef, {
    conversationId,
    senderId,
    originalText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    type,
    audioURL: audioURL || null,
    createdAt: serverTimestamp(),
  });

  // Update conversation lastMessage
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: {
      text: originalText,
      senderId,
      timestamp: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const msgs: Message[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.conversationId === conversationId) {
        msgs.push({
          id: docSnap.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          originalText: data.originalText,
          translatedText: data.translatedText,
          sourceLanguage: data.sourceLanguage,
          targetLanguage: data.targetLanguage,
          type: data.type,
          audioURL: data.audioURL,
          createdAt: data.createdAt,
        });
      }
    });
    callback(msgs);
  });
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const q = query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const convos: Conversation[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.participants?.includes(userId)) {
        convos.push({
          id: docSnap.id,
          participants: data.participants,
          participantLanguages: data.participantLanguages,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          lastMessage: data.lastMessage,
        });
      }
    });
    callback(convos);
  });
}

export async function getUserMessages(userId: string): Promise<Message[]> {
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const msgs: Message[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.senderId === userId) {
      msgs.push({
        id: docSnap.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        originalText: data.originalText,
        translatedText: data.translatedText,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        type: data.type,
        audioURL: data.audioURL,
        createdAt: data.createdAt,
      });
    }
  });
  return msgs;
}
