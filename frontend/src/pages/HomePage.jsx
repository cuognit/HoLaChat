import React from 'react';
import ItemUser from '../components/ItemUser';
import LeftSidebar from '../components/LeftSidebar';
import MainChat from '../components/MainChat';

export default function HomePage() {
    return (
        <>
           <div className="flex h-screen">
                <LeftSidebar />
                <MainChat />
                <div className="bg-red-100 w-84 p-4 border-l border-gray-200 h-screen">
                    <h2 className="text-xl font-bold mb-4">Khu vực này đang trong quá trình phát triển.</h2>
                </div>
            </div>
        </>
    );
}