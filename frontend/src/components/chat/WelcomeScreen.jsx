/**
 * File: WelcomeScreen.jsx
 * Chức năng: Thành phần giao diện (UI component) của ứng dụng.
 */
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import image1 from "../../assets/image1.png";
import image2 from "../../assets/image2.png";
import image3 from "../../assets/image3.png";
import image4 from "../../assets/image4.png";
const carouselData = [
    {
        id: 1,
        image: image1,
        title: "Nhắn tin nhiều hơn, soạn thảo ít hơn",
        description: "Sử dụng Tin Nhắn Nhanh để lưu sẵn các tin nhắn thường dùng và gửi nhanh trong hội thoại bất kỳ."
    },
    {
        id: 2,
        image: image2,
        title: "Trò chuyện nhóm tiện lợi",
        description: "Trao đổi công việc dễ dàng hơn với nhóm chat, chia sẻ tài liệu và quản lý công việc hiệu quả."
    },
    {
        id: 3,
        image: image3,
        title: "Đồng bộ đa thiết bị",
        description: "Tin nhắn và dữ liệu được đồng bộ liền mạch giữa máy tính và điện thoại của bạn."
    },
    {
        id: 4,
        image: image4,
        title: "Bảo mật và riêng tư",
        description: "Trò chuyện an toàn với mã hóa đầu cuối, bảo vệ thông tin cá nhân của bạn tuyệt đối."
    }
];

export default function WelcomeScreen({ isMobile = false }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Tính năng tự động chuyển slide sau mỗi 5 giây
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselData.length);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselData.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + carouselData.length) % carouselData.length);
    };

    return (
        <div className="bg-white flex-1 flex flex-col items-center justify-center h-screen w-full relative overflow-hidden">
            
            {/* Phần Header (Luôn cố định trên cùng) */}
            <div className="absolute top-10 md:top-20 flex flex-col items-center text-center px-4 w-full">
                <h1 className="text-xl md:text-3xl text-gray-800 mb-3 md:mb-5">
                    Chào mừng đến với <span className="font-bold text-blue-600">HoLa Chat!</span>
                </h1>
                <p className="text-gray-700 text-xs md:text-[15px] max-w-md leading-relaxed text-center">
                    Khám phá những tiện ích hỗ trợ làm việc và trò chuyện cùng người thân, bạn bè được tối ưu hoá cho máy tính của bạn.
                </p>
            </div>

            {/* Vùng chứa Carousel ở giữa màn hình */}
            <div className="flex items-center justify-between w-full px-4 md:px-12 mt-16 md:mt-24">
                
                {/* Nút mũi tên trái — ẩn trên mobile */}
                <button 
                    onClick={prevSlide}
                    className="hidden md:flex cursor-pointer p-2 text-blue-500 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors flex-shrink-0"
                >
                    <ChevronLeft size={40} strokeWidth={1.5} />
                </button>

                {/* Viewport cho Slide */}
                <div className="flex-1 overflow-hidden relative min-h-[280px] md:min-h-[400px] flex items-center">
                    {/* Container chứa tất cả các slide, có hiệu ứng trượt */}
                    <div 
                        className="flex w-full transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                        {carouselData.map((slide) => (
                            <div key={slide.id} className="w-full flex-shrink-0 flex flex-col items-center px-4 md:px-8">
                                {/* Ảnh minh họa */}
                                <img 
                                    src={slide.image} 
                                    alt={slide.title} 
                                    className="w-[200px] h-[150px] md:w-[350px] md:h-[250px] object-contain mb-6 md:mb-10"
                                />
                                
                                {/* Tiêu đề chức năng */}
                                <h2 className="text-base md:text-xl font-medium text-blue-600 mb-2 md:mb-3 text-center">
                                    {slide.title}
                                </h2>
                                
                                {/* Mô tả chức năng */}
                                <p className="text-gray-600 text-xs md:text-[15px] text-center max-w-[500px]">
                                    {slide.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nút mũi tên phải — ẩn trên mobile */}
                <button 
                    onClick={nextSlide}
                    className="hidden md:flex p-2 text-blue-500 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                >
                    <ChevronRight size={40} strokeWidth={1.5} />
                </button>
            </div>

            {/* Chấm tròn chỉ báo ở dưới cùng */}
            <div className="absolute bottom-8 md:bottom-16 flex gap-2">
                {carouselData.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                            index === currentIndex ? 'bg-blue-600 w-2.5 h-2.5' : 'bg-gray-300'
                        }`}
                        aria-label={`Chuyển đến slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
