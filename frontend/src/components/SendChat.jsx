import TextareaAutosize from 'react-textarea-autosize';
import { SendHorizonal } from 'lucide-react';
export default function SendChat() {
        return (
        <>
        <div className="bg-white mb-1 border-t border-gray-200 px-4 w-full">
            <form className="flex gap-2 items-end w-full">
                <TextareaAutosize placeholder="Nhập tin nhắn..." className="flex-1 py-3 outline-none resize-none w-full" maxRows={7} minRows={1}/>
                <SendHorizonal className="text-gray-400 hover:text-blue-600 cursor-pointer mb-2.5"/>       
            </form>
        </div>
        </>
    );
}