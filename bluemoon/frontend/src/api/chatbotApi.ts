// src/api/chatbotApi.ts
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Thiếu VITE_GEMINI_API_KEY trong file .env.local");
}

// Khởi tạo client theo cú pháp mới
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const chatbotApi = {
  sendMessage: async (systemContext: string, userQuestion: string) => {
    try {
      // Prompt ghép từ ngữ cảnh hệ thống và câu hỏi người dùng
      const prompt = `
        ${systemContext}
        
        --- HỘI THOẠI MỚI ---
        Cư dân: ${userQuestion}
        Trợ lý ảo (trả lời ngắn gọn, format Markdown nếu cần):
      `;

      // Gọi model Gemini 1.5 Flash bằng SDK mới
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Model này chạy mượt mà trên SDK mới
        contents: prompt,
      });

      // Lấy text trả về (cú pháp mới đơn giản hơn)
      return response.text || "Xin lỗi, tôi không có câu trả lời.";
      
    } catch (error) {
      console.error("Lỗi gọi Gemini AI:", error);
      return "Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau.";
    }
  },
};