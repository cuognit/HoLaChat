
export default function Profile({avatarUrl,userName,email}){
    return (
        <>
        <div className={`flex flex-col p-5 `}>
            <img src={avatarUrl} alt="" />
            <div className="flex flex-col gap-2 ">
                <p>{userName}</p>
                <p>{email}</p>
            </div>
        </div>
        </>
    );

}
