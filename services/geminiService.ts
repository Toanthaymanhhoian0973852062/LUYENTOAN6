
import { GoogleGenAI, Type, Content } from "@google/genai";
import { QuizData, MathNews } from "../types";

let genAIInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (genAIInstance) return genAIInstance;

  // Lấy API key từ Vite environment variable
  let apiKey = '';
  
  // Trong Vite, dùng import.meta.env thay vì process.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  // Fallback: kiểm tra process.env (cho môi trường Node.js/build)
  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
  }

  if (!apiKey) {
    throw new Error("Không tìm thấy API Key. Vui lòng cấu hình biến môi trường 'VITE_GEMINI_API_KEY' trên Vercel.");
  }

  genAIInstance = new GoogleGenAI({ apiKey });
  return genAIInstance;
};
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
         - Mỗi ý con đúng được 0.25đ. Tổng 16 ý con.
         - Kèm theo giải thích cho từng ý (explanation).
         
      3. Phần 3: Trả lời ngắn (3.0 điểm).
         - 6 câu hỏi. Mỗi câu 0.5đ.
         - Học sinh tự điền số hoặc kết quả ngắn gọn.
         - Kèm theo giải thích/cách giải (explanation).
         
      Yêu cầu:
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
    if (!newsData.title) return { title: "Toán học vui", content: "Chào mừng bạn đến với ứng dụng.", imageUrl: undefined };

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
      console.error("Error generating image:", imgError);
    }

    return {
      title: newsData.title,
      content: newsData.content,
      imageUrl: imageUrl
    };

  } catch (error) {
    console.error("Error generating news:", error);
    return {
      title: "Góc Toán Học",
      content: "Mỗi ngày một niềm vui với những con số.",
      imageUrl: undefined
    };
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
