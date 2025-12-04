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
  let serviceId = '';
  let templateId = '';
  let publicKey = '';

  // 1. Try accessing via Vite's import.meta.env safely
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      // @ts-ignore
      templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      // @ts-ignore
      publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    }
  } catch (e) {
    console.warn("Could not access import.meta.env", e);
  }

  // 2. Fallback to process.env (for compatibility)
  if (!serviceId) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        serviceId = process.env.VITE_EMAILJS_SERVICE_ID || '';
        templateId = process.env.VITE_EMAILJS_TEMPLATE_ID || '';
        publicKey = process.env.VITE_EMAILJS_PUBLIC_KEY || '';
      }
    } catch (e) {
      // Ignore process access error
    }
  }

  // Validate configuration
  if (!serviceId || !templateId || !publicKey) {
    console.error("EmailJS Config Missing", { 
      hasServiceId: !!serviceId, 
      hasTemplateId: !!templateId, 
      hasPublicKey: !!publicKey 
    });
    // Throw a user-friendly error to be caught by the UI
    throw new Error("Chưa cấu hình EmailJS. Vui lòng kiểm tra biến môi trường (VITE_EMAILJS_...).");
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
  } catch (error: any) {
    console.error("Lỗi gửi email:", error);
    if (error.text) {
        throw new Error(`Lỗi từ EmailJS: ${error.text}`);
    }
    throw new Error("Gửi báo cáo thất bại. Vui lòng thử lại.");
  }
};