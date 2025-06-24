import { useEffect, useState } from 'react'



import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/auth'
import Profile from './pages/profile'
import Chat from './pages/chat'
import { useAppStore } from './store'
import apiClient  from './lib/api-client'
import { USER_INFO } from './utils/constants'
const PrivateRoute = ({ children }) => {
  const {userInfo} = useAppStore();
  const isAuthenticated = !!userInfo;

  return isAuthenticated ? children : <Navigate to="/auth" />;
}

const AuthRoute = ({ children }) => {
  const {userInfo} = useAppStore();
  const isAuthenticated = !!userInfo;

  return isAuthenticated ?  <Navigate to="/chat" /> : children;
}

function App() {
  const {userInfo, setUserInfo} = useAppStore();
  const [loading, setLoading] = useState(false)
  
   useEffect(() => {
    const getUserData = async () => {
      try{
     const response = await apiClient.get(USER_INFO, {
        withCredentials: true,
      });
      if(response.status === 200 && response.data.id) {
        setUserInfo(response.data);
      }else{
        setUserInfo(undefined)
      }
      console.log({response});
      }catch(error){
    setUserInfo(undefined)
      }
      finally{
        setLoading(false);
      }
if(!userInfo) {
  getUserData()
    }
    else{
      setLoading(true)
    }
    }
   }, [userInfo, setUserInfo]);

   if (loading) {
    return <div>Loading...</div>;
   }
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/auth"  element={
<AuthRoute>
        <Auth/>
</AuthRoute>
        }/>
       <Route path="*"  element={<Navigate to="/auth"/>}/>
      <Route path="/profile"  element={
<PrivateRoute>
        <Profile/>
        </PrivateRoute>

        }/>
       <Route path="/chat"  element={
<PrivateRoute>
        <Chat/>
   </PrivateRoute>
        }/>
    </Routes>
    </BrowserRouter>
  )
}

export default App
