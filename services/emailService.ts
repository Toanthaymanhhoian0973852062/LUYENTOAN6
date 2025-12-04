
// Dịch vụ gửi email đã bị vô hiệu hóa theo yêu cầu.
// File này được giữ lại (ở trạng thái rỗng) để tránh lỗi import nếu có reference cũ.

export const sendScoreReport = async (data: any) => {
  console.warn("Tính năng gửi email báo cáo đã bị tắt.");
  return Promise.resolve({ status: 200, text: "Email disabled" });
};
