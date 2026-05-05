import { useState, useCallback } from "react";
import { encryptMessagePayload } from "@/crypto/messaging";
import { sendMessage as apiSendMessage } from "@/api/messages";
import { getConversationMessages } from "@/api/messages";
import { getUserPublicKey } from "@/api/users";
import { useAuthStore } from "@/store/authStore";
import { useMessageStore } from "@/store/messageStore";
import { useConversationStore } from "@/store/conversationStore";
import { ApiError } from "@/types";

export function useMessages() {
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const { user, privateKey, publicKey } = useAuthStore();
  const { prependMessages, cursors } = useMessageStore();
  const { activeUserId } = useConversationStore();

  const loadHistory = useCallback(
    async (userId: string) => {
      if (!user || !privateKey) return;
      setLoadingHistory(true);
      try {
        const cursor = cursors[userId] ?? undefined;
        if (cursor === null) return;

        const { messages, next_cursor } = await getConversationMessages(
          userId,
          cursor,
        );
        await prependMessages(
          userId,
          messages,
          user.id,
          privateKey,
          next_cursor,
        );
      } catch {
      } finally {
        setLoadingHistory(false);
      }
    },
    [user, privateKey, cursors],
  );

  const sendMessage = useCallback(
    async (
      recipientId: string,
      recipientPublicKeyB64: string,
      plaintext: string,
    ): Promise<boolean> => {
      if (!user || !privateKey || !publicKey) return false;
      if (!plaintext.trim()) return false;

      setSending(true);
      setSendError(null);

      try {
        // encrypt
        const payload = await encryptMessagePayload(
          plaintext,
          recipientPublicKeyB64,
          publicKey,
        );

        // log to be sure of what's being encrypted
        console.log(
          "[send] payload:",
          JSON.stringify(
            {
              recipient_id: recipientId,
              ...payload,
            },
            null,
            2,
          ),
        );

        const message = await apiSendMessage({
          to: recipientId,
          payload: {
            ciphertext: payload.ciphertext,
            iv: payload.iv,
            encrypted_key: payload.encrypted_key,
            encrypted_key_for_self: payload.encrypted_key_for_self,
          },
        });
        const { addMessage } = useMessageStore.getState();
        await addMessage(message, user.id, privateKey);

        return true;
      } catch (e) {
        const msg = e instanceof ApiError ? e.detail : "Failed to send message";
        setSendError(msg);
        return false;
      } finally {
        setSending(false);
      }
    },
    [user, privateKey, publicKey],
  );

  const getRecipientPublicKey = useCallback(
    async (userId: string): Promise<string | null> => {
      try {
        const profile = await getUserPublicKey(userId);
        return profile.public_key;
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    sendMessage,
    loadHistory,
    getRecipientPublicKey,
    sending,
    loadingHistory,
    sendError,
    activeUserId,
  };
}
