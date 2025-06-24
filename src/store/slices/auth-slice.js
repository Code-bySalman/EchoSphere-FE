// src/store/slices/auth-slice.js (Example - verify your actual content)
export const createAuthSlice = (set, get) => ({
  userInfo: null,
  setUserInfo: (userInfo) => set({ userInfo }),
  isAuth: false,
  setIsAuth: (isAuth) => set({ isAuth }),
  // Add other auth-related states/actions here
});