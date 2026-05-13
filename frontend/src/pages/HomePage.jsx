import React, { useEffect, useState } from 'react';
import LeftSidebar from '../components/chat/LeftSidebar';
import MainChat from '../components/chat/MainChat';
import api from '../api/axiosConfig';
import { useChat } from '../hooks/useChat';
import { AuthContext } from '../context/AuthContextInstance.js';
import { useContext } from 'react';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
    const { accessToken } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const { setCurrentUser } = useChat();
    
    
    useEffect(() => {
        if(accessToken){
           api.get("/auth/user")
           .then(res => {
               setUser(res.data.data);
               setCurrentUser(res.data.data);
           })
           .catch (error => {
               console.error(error.response.data);
               if (error.response.data.status === 401) {
                   localStorage.removeItem('token');
               }
           });
        }
    }, [accessToken, setCurrentUser]);
    
    return (
        <>
            {(accessToken && !user) ?
            <div className="flex items-center justify-center h-screen w-full text-black">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div> :
           <div className="flex h-screen">
                
                <LeftSidebar avatarUrl={user?.avatarUrl || "/avatar.jpg"} name={user?.userName} email={user?.email} />
                <MainChat />
                {/* <div className="bg-red-100 w-84 p-4 border-l border-gray-200 h-screen">
                    <h2 className="text-xl font-bold mb-4">Khu vực này đang trong quá trình phát triển.</h2>
                </div> */}
            </div>
            }
        </>
    );
}
