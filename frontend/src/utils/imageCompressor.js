/**
 * Nén ảnh phía Client-side sử dụng HTML5 Canvas API
 * @param {File} file - Đối tượng File ảnh gốc
 * @param {Object} options - Tùy chọn nén ảnh
 * @param {number} options.maxWidth - Chiều rộng tối đa (mặc định 800px)
 * @param {number} options.maxHeight - Chiều cao tối đa (mặc định 800px)
 * @param {number} options.quality - Chất lượng nén từ 0.0 đến 1.0 (mặc định 0.7)
 * @returns {Promise<File>} - Promise trả về đối tượng File đã được nén
 */
export function compressImage(file, { maxWidth = 800, maxHeight = 800, quality = 0.7 } = {}) {
    // Không nén nếu không phải là file ảnh hoặc là ảnh gif (tránh mất animation)
    if (!file || !file.type.startsWith("image/") || file.type === "image/gif") {
        return Promise.resolve(file);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Tính toán kích thước mới dựa trên maxWidth/maxHeight mà vẫn giữ nguyên tỷ lệ ảnh gốc
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // Xuất canvas ra Blob với chất lượng nén mong muốn
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Không thể chuyển đổi canvas thành Blob."));
                            return;
                        }
                        // Tạo đối tượng File mới từ Blob để tương thích hoàn toàn với code upload hiện tại
                        const compressedFile = new File([blob], file.name, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        });
                        
                        // Nếu file nén lại lớn hơn file gốc (trường hợp ảnh quá nhỏ), trả về file gốc
                        if (compressedFile.size > file.size) {
                            resolve(file);
                        } else {
                            resolve(compressedFile);
                        }
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}
