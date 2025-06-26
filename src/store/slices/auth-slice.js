
export const createAuthSlice = (set, get) => ({
  userInfo: null,
  setUserInfo: (userInfo) => set({ userInfo }),
  isAuth: false,
  setIsAuth: (isAuth) => set({ isAuth }),
 
});