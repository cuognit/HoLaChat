export default function Message({content, whoSend, time}) {
    return (
        <>
        <div className={`flex items-start gap-2 mt-4 ${whoSend}`}>
        <img src="/notfound.png" className={`${whoSend === 'self-end'? 'hidden' : ''}
            w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer`} alt="" />
        <div className=" bg-white p-4 rounded-lg shadow mb-4 max-w-xl">
            <p className="text-gray-800">{content}</p>
            <p className="text-xs text-gray-500 mt-2">{time}</p>
        </div>
        </div>
        </>
    );
}