import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { toast } from 'sonner'
import apiClient from '@/lib/api-client.js'
import { SIGNUP_ROUTE } from '@/utils/constants.js'
import { LOGIN_ROUTE } from '../../utils/constants'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'

const Auth = () => {
  const navigate = useNavigate()
  const { setUserInfo, resetChatState } = useAppStore()
  const [isLogin, setIsLogin] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const formSectionRef = useRef(null)

  useEffect(() => {
    if (formSectionRef.current) {
      gsap.fromTo(
        formSectionRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )
    }
  }, [isLogin])

  const toggleForm = () => {
    if (formSectionRef.current) {
      gsap.to(formSectionRef.current, {
        opacity: 0,
        y: -15,
        duration: 0.3,
        onComplete: () => {
          setIsLogin(!isLogin)
          if (isLogin) {
            setSignupName('')
            setSignupEmail('')
            setSignupPassword('')
            setConfirmPassword('')
          } else {
            setLoginEmail('')
            setLoginPassword('')
          }
        },
      })
    } else {
      setIsLogin(!isLogin)
    }
  }

  const validateLogin = () => {
    const email = loginEmail.trim().toLowerCase()
    if (!email) {
      toast.error('Email is required.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.')
      return false
    }
    if (!loginPassword.trim()) {
      toast.error('Password is required.')
      return false
    }
    return true
  }

  const validateSignup = () => {
    if (!signupName.trim()) {
      toast.error('Name is required.')
      return false
    }
    const email = signupEmail.trim().toLowerCase()
    if (!email) {
      toast.error('Email is required.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.')
      return false
    }
    if (!signupPassword.trim()) {
      toast.error('Password is required.')
      return false
    }
    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return false
    }
    if (!confirmPassword.trim()) {
      toast.error('Confirm password is required.')
      return false
    }
    if (signupPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return false
    }
    return true
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (validateLogin()) {
      try {
        const response = await apiClient.post(
          LOGIN_ROUTE,
          {
            email: loginEmail.trim().toLowerCase(),
            password: loginPassword,
          },
          { withCredentials: true }
        )
        const { user, token } = response.data
        if (user && user.id) {
          setUserInfo({ ...user, token })
          resetChatState()
          if (user.profileSetup) {
            navigate('/chat')
          } else {
            navigate('/profile')
          }
        }
      } catch (error) {
        console.error('Login API call failed:', error.response || error)
        toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.')
      }
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    if (validateSignup()) {
      try {
        const response = await apiClient.post(
          SIGNUP_ROUTE,
          {
            name: signupName,
            email: signupEmail.trim().toLowerCase(),
            password: signupPassword,
            confirmPassword,
          },
          { withCredentials: true }
        )
        const { user, token } = response.data
        if (response.status === 201) {
          setUserInfo({ ...user, token })
          resetChatState()
          navigate('/profile')
        }
      } catch (error) {
        console.error('Signup API call failed:', error.response || error)
        toast.error(error.response?.data?.message || 'Signup failed. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-blue-500 rounded-full mix-blend-screen opacity-40 animate-bubble-float"></div>
        <div className="absolute bottom-[15%] right-[8%] w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-purple-500 rounded-lg mix-blend-screen opacity-40 animate-bubble-float delay-500"></div>
        <div className="absolute top-[35%] right-[5%] w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-teal-400 rounded-3xl mix-blend-screen opacity-40 animate-bubble-float delay-1000"></div>
        <div className="absolute bottom-[10%] left-[5%] w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-pink-400 rounded-full mix-blend-screen opacity-40 animate-bubble-float delay-1500"></div>
        <div className="absolute top-[50%] left-[50%] w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-indigo-500 rounded-full mix-blend-screen opacity-40 animate-bubble-float delay-2000 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/simple-dashed.png')] opacity-10"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl h-auto max-h-[40rem] lg:max-h-[36rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col lg:flex-row transform scale-[0.9] sm:scale-100">
        <div className="flex flex-col gap-6 items-center justify-center p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-blue-700 to-purple-800 text-white w-full lg:w-1/2 rounded-t-3xl lg:rounded-t-none lg:rounded-l-3xl text-center">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-md">Welcome</h1>
            <p className="text-sm sm:text-base lg:text-lg mb-6 text-gray-200">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button onClick={toggleForm} className="px-6 py-2 sm:px-8 sm:py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-semibold shadow-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 ease-in-out text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white/50">
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </div>

        <div ref={formSectionRef} className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 bg-black/40 backdrop-blur-lg w-full lg:w-1/2 rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl text-white">
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="w-full max-w-md space-y-5 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white text-center mb-6 sm:mb-8">Login</h2>
              <div>
                <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input type="email" id="loginEmail" name="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700/30 text-white focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm sm:text-base placeholder-gray-400" placeholder="your@example.com" />
              </div>
              <div>
                <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input type="password" id="loginPassword" name="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700/30 text-white focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-sm sm:text-base placeholder-gray-400" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 sm:py-3 sm:px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-lg font-medium text-white bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-300">
                Login
              </button>
              <p className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-400">
                <a href="#" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">Forgot your password?</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="w-full max-w-md space-y-5 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white text-center mb-6 sm:mb-8">Sign Up</h2>
              <div>
                <label htmlFor="signupName" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input type="text" id="signupName" name="name" required value={signupName} onChange={(e) => setSignupName(e.target.value)} className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700/30 text-white focus:ring-green-400 focus:border-green-400 transition-all duration-200 text-sm sm:text-base placeholder-gray-400" placeholder="John Doe" />
              </div>
              <div>
                <label htmlFor="signupEmail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input type="email" id="signupEmail" name="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700/30 text-white focus:ring-green-400 focus:border-green-400 transition-all duration-200 text-sm sm:text-base placeholder-gray-400" placeholder="your@example.com" />
              </div>
              <div>
                <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input type="password" id="signupPassword" name="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700/30 text-white focus:ring-green-400 focus:border-green-400 transition-all duration-200 text-sm sm:text-base placeholder-gray-400" placeholder="••••••••" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-600 rounded-lg shadow-sm bg-gray-700/30 text-white focus:ring-green-400 focus:border-green-400 transition-all duration-200 text-sm sm:text-base placeholder-gray-400" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 sm:py-3 sm:px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-lg font-medium text-white bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 transition-all duration-300">
                Sign Up
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bubble-float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.05);
          }
        }
        .animate-bubble-float {
          animation: bubble-float 8s ease-in-out infinite alternate;
        }
        .delay-500 { animation-delay: 0.5s; }
        .delay-1000 { animation-delay: 1s; }
        .delay-1500 { animation-delay: 1.5s; }
        .delay-2000 { animation-delay: 2s; }
        @media (max-width: 640px) {
          .animate-bubble-float {
            animation-duration: 7s;
          }
        }
      `}</style>
    </div>
  );
};

export default Auth;
