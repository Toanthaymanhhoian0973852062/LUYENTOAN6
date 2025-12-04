import { GoogleGenAI, Type, Content } from "@google/genai";
import { QuizData, MathNews } from "../types";

let genAIInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (genAIInstance) return genAIInstance;

  let apiKey = '';
  
  // Priority 1: Vite Environment Variable (Standard for Vercel/Vite)
  try {
    // Cast import.meta to any to avoid TS errors if vite types are missing in specific environments
    const meta = import.meta as any;
    if (meta && meta.env && meta.env.VITE_API_KEY) {
      apiKey = meta.env.VITE_API_KEY;
    }
  } catch (e) {
    console.warn("Could not access import.meta.env");
  }

  // Priority 2: Process Environment (Fallback for local/legacy)
  if (!apiKey) {
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        apiKey = process.env.API_KEY;
      }
    } catch (e) {
      // Ignore process access errors
    }
  }

  if (!apiKey) {
    console.error("Thiếu API Key. Vui lòng kiểm tra biến môi trường VITE_API_KEY");
    throw new Error("Không tìm thấy API Key. Vui lòng cấu hình biến môi trường 'VITE_API_KEY'.");
  }

  genAIInstance = new GoogleGenAI({ apiKey });
  return genAIInstance;
};

// Fallback data when API Quota is exceeded
const FALLBACK_NEWS_ITEMS: MathNews[] = [
  {
    title: "Bí mật của số 0",
    content: "Bạn có biết? Số 0 là con số duy nhất không thể biểu diễn bằng chữ số La Mã. Người La Mã cổ đại không có ký hiệu riêng cho số 0!",
    imageUrl: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800&q=80"
  },
  {
    title: "Hình Lục Giác Của Loài Ong",
    content: "Tại sao tổ ong lại hình lục giác? Toán học chứng minh rằng hình lục giác giúp tiết kiệm sáp ong nhất mà vẫn chứa được lượng mật tối đa.",
    imageUrl: "https://images.unsplash.com/photo-1587593810167-a6492031e5e8?w=800&q=80"
  },
  {
    title: "Dãy số Fibonacci trong tự nhiên",
    content: "Số cánh hoa của nhiều loài hoa thường tuân theo dãy số Fibonacci (1, 1, 2, 3, 5, 8...). Ví dụ hoa loa kèn thường có 3 cánh, hoa mao lương có 5 cánh.",
    imageUrl: "https://images.unsplash.com/photo-1507646870321-dde51f675867?w=800&q=80"
  },
  {
    title: "Tháp Eiffel và Hình học",
    content: "Tháp Eiffel được thiết kế dựa trên hàng ngàn hình tam giác ghép lại. Hình tam giác là hình có cấu trúc vững chắc nhất trong kiến trúc.",
    imageUrl: "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800&q=80"
  },
  {
    title: "Vẻ đẹp của Fractal",
    content: "Bông súp lơ xanh Romanesco là một ví dụ tuyệt vời về hình học Fractal trong tự nhiên, nơi mỗi chồi nhỏ là bản sao thu nhỏ của chồi lớn.",
    imageUrl: "https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?w=800&q=80"
  }
];

export const generateQuiz = async (topic: string, description: string): Promise<QuizData> => {
  try {
    const ai = getAI();
    const prompt = `
      Tạo đề kiểm tra Toán 6 (Kết nối tri thức) cho bài: "${topic} - ${description}".
      Cấu trúc đề BẮT BUỘC như sau (Tổng 10 điểm):
      
      1. Phần 1: Trắc nghiệm (3.0 điểm). 
         - 12 câu hỏi. Mỗi câu 0.25đ.
         - Chọn 1 đáp án đúng trong 4 phương án A,B,C,D.
         - Kèm theo giải thích ngắn gọn (explanation).
         
      2. Phần 2: Đúng/Sai (4.0 điểm).
         - 4 câu hỏi lớn. Mỗi câu hỏi lớn gồm 1 đề dẫn và 4 ý con (a,b,c,d).
         - Yêu cầu: Đề dẫn phải là một TÌNH HUỐNG THỰC TẾ (ví dụ: tính tiền đi chợ, đo đạc sân vườn, nhiệt độ các thành phố, chia nhóm học sinh...).
         - Mỗi ý con đúng được 0.25đ. Tổng 16 ý con.
         - Kèm theo giải thích cho từng ý (explanation).
         
      3. Phần 3: Trả lời ngắn (3.0 điểm).
         - 6 câu hỏi. Mỗi câu 0.5đ.
         - Yêu cầu: Câu hỏi phải là bài toán đố có yếu tố THỰC TẾ.
         - QUAN TRỌNG: Kết quả BẮT BUỘC phải là MỘT CON SỐ (Số tự nhiên hoặc số thập phân).
         - Trường 'correctAnswer' CHỈ ĐƯỢC CHỨA SỐ (ví dụ: "15", "2.5", "-10"), KHÔNG được chứa đơn vị hay chữ cái.
         - Kèm theo giải thích/cách giải (explanation).
         
      Yêu cầu chung:
      - Nội dung bám sát sách giáo khoa Kết nối tri thức.
      - Câu hỏi đa dạng: Nhận biết, Thông hiểu, Vận dụng.
      - Trả về JSON thuần túy.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là chuyên gia soạn đề Toán 6. Chỉ trả về JSON hợp lệ theo schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            part1: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctAnswerIndex"]
              }
            },
            part2: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  stem: { type: Type.STRING },
                  statements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.INTEGER },
                        statement: { type: Type.STRING },
                        isTrue: { type: Type.BOOLEAN },
                        explanation: { type: Type.STRING }
                      },
                      required: ["id", "statement", "isTrue"]
                    }
                  }
                },
                required: ["id", "stem", "statements"]
              }
            },
            part3: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "correctAnswer"]
              }
            }
          },
          required: ["topic", "part1", "part2", "part3"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizData;
    }
    throw new Error("Không nhận được dữ liệu từ Gemini");

  } catch (error) {
    console.error("Lỗi tạo đề:", error);
    throw error;
  }
};

export const generateMathNews = async (): Promise<MathNews> => {
  try {
    const ai = getAI();
    // Step 1: Generate Text Content
    const textPrompt = `
      Hãy tạo một bản tin ngắn thú vị về toán học dành cho học sinh lớp 6. 
      Nội dung có thể về: lịch sử các con số, ứng dụng toán học trong tự nhiên, tiểu sử nhà toán học nổi tiếng, hoặc một câu đố tư duy vui.
      
      Trả về JSON gồm:
      - title: Tiêu đề hấp dẫn.
      - content: Nội dung ngắn gọn (khoảng 3-4 câu).
      - imagePrompt: Một mô tả chi tiết bằng tiếng ANH để dùng cho AI vẽ ảnh minh họa (colorful, 3d render style, suitable for education).
    `;

    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["title", "content", "imagePrompt"]
        }
      }
    });

    const newsData = JSON.parse(textResponse.text || "{}");
    if (!newsData.title) throw new Error("Invalid news data");

    // Step 2: Generate Image using the prompt from Step 1
    let imageUrl: string | undefined = undefined;
    try {
      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: newsData.imagePrompt }],
        },
        config: {
          imageConfig: {
             aspectRatio: "16:9"
          }
        }
      });

      // Find image part
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (imgError) {
      console.warn("Image generation failed (likely quota), skipping image.", imgError);
    }

    return {
      title: newsData.title,
      content: newsData.content,
      imageUrl: imageUrl
    };

  } catch (error: any) {
    // Graceful fallback for API Quota Exceeded or other errors
    const isQuotaError = error.status === 429 || error.message?.includes('quota') || error.message?.includes('429');
    
    if (isQuotaError) {
       console.warn("Gemini API Quota Exceeded for News. Using fallback content.");
    } else {
       console.error("Error generating news:", error);
    }

    // Return a random fallback news item
    const randomIndex = Math.floor(Math.random() * FALLBACK_NEWS_ITEMS.length);
    return FALLBACK_NEWS_ITEMS[randomIndex];
  }
};

export const getChatResponse = async (history: Content[], newMessage: string): Promise<string> => {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `
          Bạn là "Gia Sư Toán 6" - một trợ lý ảo thân thiện, vui vẻ dành cho học sinh lớp 6 học sách "Kết nối tri thức với cuộc sống".
          
          Nhiệm vụ của bạn:
          1. Giải đáp thắc mắc về Toán học lớp 6.
          2. Nếu học sinh hỏi đáp án bài tập, KHÔNG ĐƯỢC trả lời ngay kết quả. Hãy gợi ý từng bước, đặt câu hỏi gợi mở để học sinh tự tìm ra đáp án.
          3. Giải thích các khái niệm dễ hiểu, có ví dụ minh họa thực tế.
          4. Luôn khích lệ, động viên tinh thần học tập.
          5. Sử dụng emoji phù hợp để tạo cảm giác gần gũi 🌟.
          
          Lưu ý: Giữ câu trả lời ngắn gọn, súc tích (dưới 150 từ) để học sinh dễ đọc trên điện thoại.
        `
      },
      history: history
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Xin lỗi, thầy chưa nghe rõ câu hỏi. Em nhắc lại được không? 😅";
  } catch (error) {
    console.error("Chat error:", error);
    return "Hệ thống đang bận một chút, em thử lại sau nhé!";
  }
};
