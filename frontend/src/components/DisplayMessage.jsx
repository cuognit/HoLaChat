import Message from "./Message";
export default function DisplayMessage() {
    return (
        <>
        <div className="bg-gray-100 flex-1 px-4 overflow-y-auto flex flex-col">
          <Message content="Xin chào! Tôi là trợ lý ảo." whoSend="self-start" time="10:00 AM" />
          <Message content="Tôi có thể giúp gì cho bạn?" whoSend="self-end" time="10:01 AM" />
          <Message content="Bạn có câu hỏi nào không?" whoSend="self-start" time="10:02 AM" />
          <Message content="Tôi đang ở đây để hỗ trợ bạn." whoSend="self-end" time="10:03 AM" />
          <Message content="Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!" whoSend="self-start" time="10:04 AM" />
          <Message content="Nếu bạn cần thêm sự gssssssssssssssssssssssssssssssssssssssiúp đỡ, đừng ngần ngại liên hệ với tôi." whoSend="self-end" time="10:05 AM" />
          <Message content="Tôi có thể giúp gì cho bạn?" whoSend="self-start" time="10:06 AM" />
          <Message content="Bạn có câu hỏi nào không?" whoSend="self-end" time="10:07 AM" />
          <Message content="Bạn có câu hỏi nào không?" whoSend="self-end" time="10:08 AM" />
          <Message content="Bạn có câu hỏi nào không?" whoSend="self-end" time="10:09 AM" />
        </div>
        </>
    );
}