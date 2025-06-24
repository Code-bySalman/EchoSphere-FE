import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createAuthSlice } from "./slices/auth-slice";
import { createThemeSlice } from "./slices/theme-slice";
import { createChatSlice } from "./slices/chat-slice";

export const useAppStore = create()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createThemeSlice(...a),
      ...createChatSlice(...a),
    }),
    {
      name: 'chat-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userInfo: state.userInfo,
        isAuth: state.isAuth,
        theme: state.theme,
        selectedChatType: state.selectedChatType,
        selectedChatData: state.selectedChatData,
      }),
    }
  )
);