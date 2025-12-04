
import React, { useState, useEffect } from 'react';
import { QuizData, QuizMode } from '../types';
import { CheckCircle, ArrowLeft, Eye, EyeOff, Lightbulb, Clock, Check, X, AlertCircle, XCircle, Share2, RotateCcw, ArrowRight, ListChecks } from 'lucide-react';

interface QuizRunnerProps {
  quizData: QuizData;
  mode: QuizMode;
  onFinish: (score: number) => void;
  onBack: () => void;
}

const ASSESSMENT_DURATION = 60 * 60; // 60 minutes in seconds

export const QuizRunner: React.FC<QuizRunnerProps> = ({ quizData, mode, onFinish, onBack }) => {
  const [part1Answers, setPart1Answers] = useState<Record<number, number>>({});
  const [part2Answers, setPart2Answers] = useState<Record<string, boolean | null>>({});
  const [part3Answers, setPart3Answers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // New state for confirmation modal
  const [instantFeedback, setInstantFeedback] = useState(mode === 'PRACTICE');
  const [timeLeft, setTimeLeft] = useState(ASSESSMENT_DURATION);

  // Timer countdown logic
  useEffect(() => {
    if (mode !== 'ASSESSMENT' || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, isSubmitted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (mode === 'ASSESSMENT' && timeLeft === 0 && !isSubmitted) {
      handleAutoSubmit();
    }
  }, [timeLeft, mode, isSubmitted]);

  const calculateScore = () => {
    let score = 0;

    // Part 1: 12 questions * 0.25 = 3.0 points
    quizData.part1.forEach(q => {
      if (part1Answers[q.id] === q.correctAnswerIndex) {
        score += 0.25;
      }
    });

    // Part 2: 4 questions * 4 statements * 0.25 = 4.0 points
    quizData.part2.forEach(q => {
      q.statements.forEach(s => {
        const key = `${q.id}-${s.id}`;
        // Only count if user explicitly selected True/False matching the key
        if (part2Answers[key] === s.isTrue) {
          score += 0.25;
        }
      });
    });

    // Part 3: 6 questions * 0.5 = 3.0 points
    quizData.part3.forEach(q => {
      const userAns = part3Answers[q.id]?.trim().toLowerCase();
      const correctAns = String(q.correctAnswer).trim().toLowerCase();
      // Basic normalization for comparison
      if (userAns && userAns === correctAns) {
        score += 0.5;
      }
    });

    return Math.max(0, Math.min(score, 10));
  };

  // Called when user clicks "Nộp bài" button
  const handleAttemptSubmit = () => {
    setShowConfirmModal(true);
  };

  // Called when user confirms inside the modal
  const confirmManualSubmit = () => {
    setShowConfirmModal(false);
    setIsSubmitted(true);
    setShowResultModal(true);
  };

  // Called automatically when timer hits 0
  const handleAutoSubmit = () => {
    setIsSubmitted(true);
    setShowResultModal(true);
    alert("Đã hết thời gian làm bài! Hệ thống đã tự động nộp bài của bạn.");
  };

  const handleShare = async () => {
    const score = calculateScore();
    const text = `Tôi vừa đạt ${score}/10 điểm bài "${quizData.topic}" trên ứng dụng Toán 6 KNTT Master! 🏆`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kết quả học tập',
          text: text,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Đã sao chép kết quả vào bộ nhớ tạm!');
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  // Helper to remove prefixes like "A.", "B)", "1." from option text
  const cleanOptionText = (text: string) => {
    return text.replace(/^[A-Da-d0-9]+[.:)]\s*/, '').trim();
  };

  // Helper to check if we should show result for a question
  const shouldShowResult = (isAnswered: boolean) => {
    return isSubmitted || (mode === 'PRACTICE' && instantFeedback && isAnswered);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderExplanation = (text?: string) => {
    if (!text) return null;
    return (
      <div className="mt-3 p-3 bg-indigo-50 text-indigo-800 text-sm rounded-lg border border-indigo-100 flex gap-2 animate-fade-in">
        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
        <span><strong className="font-semibold">Giải thích:</strong> {text}</span>
      </div>
    );
  };

  const renderPart1 = () => (
    <section className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <h3 className="text-lg font-bold text-blue-900">Phần 1: Trắc nghiệm (3.0 điểm)</h3>
        <p className="text-sm text-blue-700">12 câu hỏi - 0.25 điểm/câu</p>
      </div>
      <div className="grid gap-4">
        {quizData.part1.map((q, idx) => {
          const userVal = part1Answers[q.id];
          const isAnswered = userVal !== undefined;
          const showResult = shouldShowResult(isAnswered);
          const isCorrect = userVal === q.correctAnswerIndex;
          
          return (
            <div key={q.id} className={`p-4 rounded-lg border-2 transition-all duration-300 ${showResult ? (isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30') : 'border-gray-100 bg-white shadow-sm'}`}>
              <div className="flex gap-2">
                <span className="font-bold text-gray-500 whitespace-nowrap">Câu {idx + 1}:</span>
                <p className="font-medium text-gray-800">{q.question}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 ml-0 sm:ml-8">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userVal === optIdx;
                  const isThisCorrect = q.correctAnswerIndex === optIdx;
                  
                  let btnClass = 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-200';
                  let icon = null;

                  if (isSelected) {
                     btnClass = 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-100';
                  }
                  
                  if (showResult) {
                    if (isThisCorrect) {
                        btnClass = '!bg-green-600 !border-green-600 !text-white shadow-md ring-2 ring-green-100';
                        icon = <Check className="w-5 h-5 ml-2" />;
                    } else if (isSelected && !isThisCorrect) {
                        btnClass = '!bg-red-500 !border-red-500 !text-white shadow-md ring-2 ring-red-100';
                        icon = <X className="w-5 h-5 ml-2" />;
                    } else {
                        btnClass = 'bg-gray-50 border-gray-100 text-gray-400 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isSubmitted || (mode === 'PRACTICE' && instantFeedback && isAnswered)}
                      onClick={() => setPart1Answers(prev => ({ ...prev, [q.id]: optIdx }))}
                      className={`text-left px-4 py-3 rounded-lg border text-sm transition-all flex justify-between items-center group ${btnClass}`}
                    >
                      <div className="flex items-center gap-3">
                         <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
                             showResult 
                                ? (isThisCorrect || isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500')
                                : (isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600')
                         }`}>
                             {String.fromCharCode(65 + optIdx)}
                         </span>
                         <span>{cleanOptionText(opt)}</span>
                      </div>
                      {icon}
                    </button>
                  );
                })}
              </div>
              {showResult && renderExplanation(q.explanation)}
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderPart2 = () => (
    <section className="space-y-6 mt-10">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
        <h3 className="text-lg font-bold text-purple-900">Phần 2: Đúng / Sai (4.0 điểm)</h3>
        <p className="text-sm text-purple-700">4 câu hỏi lớn - Mỗi ý đúng 0.25 điểm</p>
      </div>
      {quizData.part2.map((q, idx) => (
        <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4 flex gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-sm h-fit">Câu {idx + 1}</span>
            <span>{q.stem}</span>
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Mệnh đề</th>
                  <th className="px-4 py-3 w-24 text-center">Đúng</th>
                  <th className="px-4 py-3 w-24 text-center">Sai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {q.statements.map((s) => {
                  const key = `${q.id}-${s.id}`;
                  const val = part2Answers[key];
                  const isAnswered = val !== undefined && val !== null;
                  const showResult = shouldShowResult(isAnswered);
                  const isMatch = val === s.isTrue;
                  
                  return (
                    <React.Fragment key={s.id}>
                      <tr className={`bg-white hover:bg-gray-50 transition-colors ${showResult ? (isMatch ? 'bg-green-50/50' : 'bg-red-50/50') : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <div className="flex items-start gap-2">
                            {showResult && (
                              <div className="mt-0.5">
                                {isMatch ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                              </div>
                            )}
                            <span className={showResult && !isMatch ? 'text-red-800' : ''}>{s.statement}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center relative">
                          <input
                            type="radio"
                            name={`p2-${key}`}
                            disabled={isSubmitted || (mode === 'PRACTICE' && instantFeedback && isAnswered)}
                            checked={val === true}
                            onChange={() => setPart2Answers(prev => ({ ...prev, [key]: true }))}
                            className={`w-5 h-5 text-blue-600 accent-blue-600 cursor-pointer disabled:cursor-not-allowed transition-transform active:scale-95 ${
                              showResult && s.isTrue && !isMatch ? 'ring-2 ring-green-500 ring-offset-1 rounded-full' : ''
                            }`}
                          />
                          {showResult && s.isTrue && !isMatch && (
                             <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 text-[10px] font-bold text-green-600 bg-green-100 px-1 rounded whitespace-nowrap">Đúng</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center relative">
                          <input
                            type="radio"
                            name={`p2-${key}`}
                            disabled={isSubmitted || (mode === 'PRACTICE' && instantFeedback && isAnswered)}
                            checked={val === false}
                            onChange={() => setPart2Answers(prev => ({ ...prev, [key]: false }))}
                            className={`w-5 h-5 text-blue-600 accent-blue-600 cursor-pointer disabled:cursor-not-allowed transition-transform active:scale-95 ${
                               showResult && !s.isTrue && !isMatch ? 'ring-2 ring-green-500 ring-offset-1 rounded-full' : ''
                            }`}
                          />
                           {showResult && !s.isTrue && !isMatch && (
                             <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 text-[10px] font-bold text-green-600 bg-green-100 px-1 rounded whitespace-nowrap">Đúng</span>
                          )}
                        </td>
                      </tr>
                      {showResult && s.explanation && (
                        <tr>
                          <td colSpan={3} className="px-4 pb-3 pt-0 border-b">
                             {renderExplanation(s.explanation)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );

  const renderPart3 = () => (
    <section className="space-y-6 mt-10">
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
        <h3 className="text-lg font-bold text-orange-900">Phần 3: Trả lời ngắn (3.0 điểm)</h3>
        <p className="text-sm text-orange-700">6 câu hỏi - 0.5 điểm/câu</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizData.part3.map((q, idx) => {
          const val = part3Answers[q.id] || '';
          const isMatch = val.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
          const [revealed, setRevealed] = useState(false);
          const showResult = isSubmitted || revealed;

          return (
            <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Câu {idx + 1}</span>
                <p className="font-medium text-gray-800 mt-1">{q.question}</p>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isSubmitted || (revealed && instantFeedback)}
                    value={val}
                    placeholder="Nhập kết quả..."
                    onChange={(e) => setPart3Answers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    className={`w-full p-3 pr-10 rounded-lg border outline-none transition-all ${
                      showResult
                        ? isMatch
                          ? 'border-green-500 bg-green-50 text-green-900 font-bold'
                          : 'border-red-500 bg-red-50 text-red-900'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {showResult && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isMatch ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-2">
                   {mode === 'PRACTICE' && !isSubmitted && !revealed && (
                    <button 
                      onClick={() => setRevealed(true)}
                      className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium whitespace-nowrap"
                    >
                      Kiểm tra
                    </button>
                  )}
                  {showResult && !isMatch && (
                    <div className="text-sm text-red-600 font-bold flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Đáp án: {q.correctAnswer}
                    </div>
                  )}
                </div>
                {showResult && renderExplanation(q.explanation)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b shadow-sm mb-6 -mx-4 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:shadow-none sm:border-none sm:mb-8 gap-3">
         <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
           <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" /> <span className="hidden sm:inline">Quay lại</span>
           </button>
           <h2 className="text-xl font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[300px]">{quizData.topic}</h2>
         </div>

         <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Timer Display for Assessment Mode */}
            {mode === 'ASSESSMENT' && !isSubmitted && (
               <div className={`flex items-center gap-2 font-mono font-bold text-lg px-3 py-1 rounded-lg border ${timeLeft < 300 ? 'text-red-600 bg-red-50 border-red-200 animate-pulse' : 'text-slate-700 bg-white border-slate-200'}`}>
                   <Clock className="w-5 h-5" />
                   {formatTime(timeLeft)}
               </div>
            )}

            {mode === 'PRACTICE' && !isSubmitted && (
              <button 
                onClick={() => setInstantFeedback(!instantFeedback)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${instantFeedback ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {instantFeedback ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="hidden sm:inline">Xem đáp án</span>
              </button>
            )}

            {isSubmitted ? (
               <>
                 <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold whitespace-nowrap border border-yellow-200">
                    <span>Điểm: {calculateScore()}/10</span>
                </div>
                {!showResultModal && (
                   <button 
                     onClick={() => setShowResultModal(true)}
                     className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700"
                   >
                     Xem kết quả
                   </button>
                )}
               </>
            ) : (
                <div className={`text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap hidden sm:block ${mode === 'PRACTICE' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                    {mode === 'PRACTICE' ? 'Luyện tập' : 'Kiểm tra'}
                </div>
            )}
         </div>
      </div>

      {renderPart1()}
      {renderPart2()}
      {renderPart3()}

      {/* Footer Actions */}
      {!isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-20 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <button
             onClick={handleAttemptSubmit}
             className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
           >
             <CheckCircle className="w-5 h-5" /> Nộp bài
           </button>
        </div>
      )}

      {/* Confirmation Modal - Replaces window.confirm */}
      {!isSubmitted && showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-yellow-100 p-3 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nộp bài ngay?</h3>
              <p className="text-gray-600 mb-6">
                 {mode === 'ASSESSMENT' 
                    ? `Bạn còn ${Math.ceil(timeLeft / 60)} phút. Bạn có chắc chắn muốn kết thúc bài làm không?` 
                    : "Bạn có chắc chắn muốn nộp bài và xem kết quả?"}
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Kiểm tra lại
                </button>
                <button 
                  onClick={confirmManualSubmit}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Nộp bài
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal Overlay */}
      {isSubmitted && showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header with Score */}
            <div className={`p-8 text-center text-white ${calculateScore() >= 8 || mode === 'PRACTICE' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
               <div className="text-6xl font-black mb-2 drop-shadow-md">{calculateScore()}<span className="text-3xl opacity-80 font-medium">/10</span></div>
               <h3 className="text-2xl font-bold">
                 {mode === 'PRACTICE' 
                    ? "Hoàn thành luyện tập!" 
                    : calculateScore() >= 8 ? "Xuất sắc! 🎉" : "Chưa đạt yêu cầu 😢"
                 }
               </h3>
               <p className="opacity-90 mt-1">
                 {mode === 'PRACTICE' 
                    ? "Bạn đã làm rất tốt." 
                    : calculateScore() >= 8 ? "Bạn đã vượt qua bài kiểm tra này." : "Bạn cần đạt 8.0 điểm để mở bài tiếp theo."
                 }
               </p>
            </div>

            {/* Actions */}
            <div className="p-6 space-y-3 bg-white">
                {/* Primary Action */}
                <button 
                  onClick={() => onFinish(calculateScore())}
                  className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                    ${(calculateScore() >= 8 || mode === 'PRACTICE') 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-slate-700 hover:bg-slate-800'
                    }`}
                >
                  {(calculateScore() >= 8 || mode === 'PRACTICE') ? (
                    <><ArrowRight className="w-6 h-6" /> {mode === 'PRACTICE' ? "Chọn bài khác" : "Học bài tiếp theo"}</>
                  ) : (
                    <><RotateCcw className="w-6 h-6" /> Làm lại bài này</>
                  )}
                </button>

                {/* Secondary Actions Grid */}
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => setShowResultModal(false)}
                     className="py-3 px-4 rounded-lg font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                   >
                      <ListChecks className="w-5 h-5" /> Xem lại bài
                   </button>
                   
                   {mode === 'ASSESSMENT' && (
                     <button
                        onClick={handleShare}
                        className="py-3 px-4 rounded-lg font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                     >
                        <Share2 className="w-5 h-5" /> Chia sẻ
                     </button>
                   )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
