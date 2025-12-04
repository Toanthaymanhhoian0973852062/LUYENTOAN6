
import emailjs from '@emailjs/browser';

// Define the structure of the data we want to send
interface ReportData {
  studentName: string;
  className: string;
  schoolName: string;
  score: number;
  topic: string;
}

export const sendScoreReport = async (data: ReportData) => {
  // Get credentials from environment variables
  const env = (import.meta as any).env;
  const serviceId = env.VITE_EMAILJS_SERVICE_ID;
  const templateId = env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("Chưa cấu hình EmailJS. Vui lòng kiểm tra file .env");
  }

  try {
    const templateParams = {
      student_name: data.studentName,
      class_name: data.className,
      school_name: data.schoolName,
      score: data.score,
      topic: data.topic,
      date: new Date().toLocaleString('vi-VN')
    };

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    return response;
  } catch (error) {
    console.error("Lỗi gửi email:", error);
    throw error;
  }
};