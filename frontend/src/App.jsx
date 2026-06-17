
import HomePage from './pages/HomePage'
import NotFound from './pages/NotFound'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import JoinGroupPage from './pages/JoinGroupPage'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster} from 'sonner'
import './index.css'
import ProtectedRoute from './routes/ProtectedRoute'
import GuestRoute from './routes/GuestRoute'

import { IncomingCallBanner } from './components/IncomingCallBanner';
import { ActiveCallWidget } from './components/ActiveCallWidget';

function App() {
  

  return (
    <>
    <Toaster richColors position="top-right" />
    <IncomingCallBanner />
    <ActiveCallWidget />
      <BrowserRouter>
        <Routes>

          <Route path="/*" element={ 
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>} />

          <Route path="/join/:encodedRoomId" element={ 
            <ProtectedRoute>
              <JoinGroupPage />
            </ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />

          <Route path="/login" element={ 
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
            } />
          <Route path="/register" element={
            <GuestRoute>
              <RegisterPage/>
            </GuestRoute>
            }/>

        </Routes>
      </BrowserRouter>
      
    </>
  )
}

export default App
