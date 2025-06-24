import moment from 'moment';
import apiClient from '@/lib/api-client';
import { GET_CONTACTS_TO_DM_ROUTES } from '@/utils/constants';

export const createChatSlice = (set, get) => ({
    selectedChatType: undefined,
    selectedChatData: undefined,
    selectedChatMessages: [],
    userContacts: [],
    isContactsPage: false,
    channel: [],

    setChannel: (channel) => {
        set({ channel })
    },
    setSelectedChatType: (selectedChatType) => {
        set({ selectedChatType });
    },
    setSelectedChatData: (selectedChatData) => {
        set({ selectedChatData });
    },
    setSelectedChatMessages: (messages) => {
        const messagesToProcess = Array.isArray(messages) ? messages : [];
        console.log("[Zustand] Setting selectedChatMessages with new array:", messagesToProcess);
        const normalizedMessages = messagesToProcess.map(msg => ({
            ...msg,
            sender: typeof msg.sender === 'object' && msg.sender !== null ? msg.sender : { _id: msg.sender },
            recipient: typeof msg.recipient === 'object' && msg.recipient !== null ? msg.recipient : { _id: msg.recipient },
        }));
        set({ selectedChatMessages: normalizedMessages });
    },

    setUserContacts: (contacts) => {
        set({ userContacts: contacts });
    },

    setIsContactsPage: (value) => {
        set({ isContactsPage: value });
    },

    addChannel: (newChannel) => {
        set((state) => ({
            channel: [...state.channel, newChannel]
        }));
    },

    fetchAllContacts: async () => {
        try {
            const { userInfo } = get();
            if (!userInfo?.token) {
                console.warn("User not authenticated. Cannot fetch contacts.");
                return;
            }

            const response = await apiClient.get(GET_CONTACTS_TO_DM_ROUTES, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            });

            if (response.data && Array.isArray(response.data.contacts)) {
                set({ userContacts: response.data.contacts });
            } else {
                console.error("Unexpected response format for contacts:", response.data);
                set({ userContacts: [] });
            }
        } catch (error) {
            console.error("Error fetching all contacts:", error);
            set({ userContacts: [] });
        }
    },

    clearSelectedChat: () => {
        console.log("[Zustand] Clearing selected chat data and messages.");
        set({ selectedChatType: undefined, selectedChatData: undefined, selectedChatMessages: [] });
    },
    closeChat: () => {
        console.log("[Zustand] Closing chat, clearing all related state.");
        set({
            selectedChatData: undefined,
            selectedChatType: undefined,
            selectedChatMessages: [],
        });
    },

    resetChatState: () => {
        console.log("[Zustand] Performing a full reset of selected chat state.");
        set({
            selectedChatType: undefined,
            selectedChatData: undefined,
            selectedChatMessages: [],
            userContacts: [],
            isContactsPage: false,
        });
    },

    addMessage: (message) => {
        const currentMessages = get().selectedChatMessages;
        const messageToAdd = {
            ...message,
            sender: typeof message.sender === 'object' && message.sender !== null
                                ? message.sender
                                : { _id: message.sender },
            recipient: typeof message.recipient === 'object' && message.recipient !== null
                                ? message.recipient
                                : { _id: message.recipient }
        };
        console.log("[Zustand: addMessage DEBUG] Appending message to selectedChatMessages:", messageToAdd);
        set({
            selectedChatMessages: [...currentMessages, messageToAdd]
        });
    },

    replaceTemporaryMessage: (officialMessage) => {
        set((state) => {
            console.log("[Zustand: replaceTemporaryMessage DEBUG] === START REPLACEMENT ATTEMPT ===");
            console.log("[Zustand: replaceTemporaryMessage DEBUG] Incoming official message (from server):", officialMessage);
            console.log("[Zustand: replaceTemporaryMessage DEBUG] Current state messages BEFORE update:", state.selectedChatMessages);

            const processedOfficialMessage = {
                ...officialMessage,
                sender: typeof officialMessage.sender === 'object' && officialMessage.sender !== null
                                        ? officialMessage.sender
                                        : { _id: officialMessage.sender },
                recipient: typeof officialMessage.recipient === 'object' && officialMessage.recipient !== null
                                        ? officialMessage.recipient
                                        : { _id: officialMessage.recipient }
            };

            let messageReplaced = false;
            const updatedMessages = state.selectedChatMessages.map(msg => {
                if (processedOfficialMessage.tempClientMessageId &&
                    msg._id === processedOfficialMessage.tempClientMessageId) {

                    messageReplaced = true;
                    const { tempClientMessageId, ...restOfficialMessage } = processedOfficialMessage;
                    console.log(`[Zustand: replaceTemporaryMessage DEBUG] SUCCESS: Matched by tempClientMessageId. Replacing optimistic ID: ${msg._id} with official ID: ${restOfficialMessage._id}`);
                    return { ...restOfficialMessage, status: 'sent' };
                }

                const isOptimisticCandidate = msg._id && typeof msg._id === 'string' && msg._id.startsWith('optimistic-');
                const isHeuristicMatch = (
                    isOptimisticCandidate &&
                    msg.contents === processedOfficialMessage.contents &&
                    msg.sender?._id === processedOfficialMessage.sender?._id &&
                    Math.abs(moment(msg.timestamp).diff(moment(processedOfficialMessage.timestamp), 'seconds')) < 30
                );

                if (isHeuristicMatch && !messageReplaced) {
                    messageReplaced = true;
                    console.log(`[Zustand: replaceTemporaryMessage DEBUG]  MATCH FOUND by HEURISTIC. Replacing optimistic ID: ${msg._id} with official ID: ${processedOfficialMessage._id}`);
                    return { ...processedOfficialMessage, status: 'sent' };
                }
                return msg;
            });

            if (!messageReplaced) {
                const alreadyExistsWithOfficialId = state.selectedChatMessages.some(m =>
                    m._id === processedOfficialMessage._id && !m._id.startsWith('optimistic-')
                );

                if (alreadyExistsWithOfficialId) {
                    console.warn(`[Zustand: replaceTemporaryMessage DEBUG] WARNING: Official message with _id ${processedOfficialMessage._id} already found in state. Skipping add to prevent duplicate.`);
                    console.log("[Zustand: replaceTemporaryMessage DEBUG] === END REPLACEMENT ATTEMPT (No change, already exists) ===");
                    return state;
                } else {
                    console.log(`[Zustand: replaceTemporaryMessage DEBUG]  No replacement occurred, adding as genuinely new:`, processedOfficialMessage);
                    console.log("[Zustand: replaceTemporaryMessage DEBUG] === END REPLACEMENT ATTEMPT (Added new) ===");
                    return { selectedChatMessages: [...state.selectedChatMessages, { ...processedOfficialMessage, status: 'sent' }] };
                }
            }

            console.log("[Zustand: replaceTemporaryMessage DEBUG] Final messages after replacement attempt:", updatedMessages);
            console.log("[Zustand: replaceTemporaryMessage DEBUG] === END REPLACEMENT ATTEMPT (Replaced) ===");
            return { selectedChatMessages: updatedMessages };
        });
    }
});