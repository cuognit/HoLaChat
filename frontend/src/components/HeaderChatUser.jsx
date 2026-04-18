
export default function HeaderChatUser(user) {
    return (
        <>
        <div className="w-full flex items-center gap-4 p-2 cursor-pointer bg-white">
        <img src={user.userAvatar} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-300 mb-1 " />
        <div className="flex-1 flex flex-col min-w-0 justify-center">
            <h3 className="text-lg font-medium ">{user.userName}</h3>
            <p className="truncate text-gray-600">{user.status}</p>
        </div>
        
        </div>
        </>
    );
}