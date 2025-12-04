import React, { useState, useEffect } from 'react';
import { QuizData, QuizMode } from '../types';
import { CheckCircle, ArrowLeft, Eye, EyeOff, Lightbulb, Clock, Check, X, AlertCircle, XCircle, Share2, RotateCcw, ArrowRight, ListChecks, Trophy } from 'lucide-react';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
      if (userAns && userAns === correctAns) {
        score += 0.5;
      }
    });

    return Math.max(0, Math.min(score, 10));
  };

  const handleAttemptSubmit = () => {
    setShowConfirmModal(true);
  };

  const confirmManualSubmit = () => {
    setShowConfirmModal(false);
    setIsSubmitted(true);
    setShowResultModal(true);
  };

  const handleAutoSubmit = () => {
    setIsSubmitted(true);
    setShowResultModal(true);
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

  const cleanOptionText = (text: string) => {
    return text.replace(/^[A-Da-d0-9]+[.:)]\s*/, '').trim();
  };

  const shouldShowResult = (isAnswered: boolean) => {
    return isSubmitted || (mode === 'PRACTICE' && instantFeedback && isAnswered);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Improved Explanation Rendering
  const renderExplanation = (text?: string) => {
    if (!text) return null;
    return (
      <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex gap-4 animate-in fade-in duration-300 shadow-sm">
         <div className="bg-white p-2 rounded-full border border-indigo-100 shadow-sm h-fit shrink-0 text-indigo-600">
            <Lightbulb className="w-5 h-5" />
         </div>
         <div className="flex-1">
            <h5 className="font-bold text-indigo-900 text-sm mb-1 uppercase tracking-wide">Giải thích chi tiết</h5>
            <p className="text-slate-700 text-sm leading-relaxed">{text}</p>
         </div>
      </div>
    );
  };

  const renderPart1 = () => (
    <section className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
        <h3 className="text-lg font-bold text-blue-900">Phần 1: Trắc nghiệm (3.0 điểm)</h3>
        <p className="text-sm text-blue-700">12 câu hỏi - 0.25 điểm/câu</p>
      </div>
      <div className="grid gap-6">
        {quizData.part1.map((q, idx) => {
          const userVal = part1Answers[q.id];
          const isAnswered = userVal !== undefined;
          const showResult = shouldShowResult(isAnswered);
          const isCorrect = userVal === q.correctAnswerIndex;
          
          return (
            <div key={q.id} className={`p-5 rounded-xl border-2 transition-all duration-300 ${showResult ? (isCorrect ? 'border-green-200 bg-green-50/20' : 'border-red-200 bg-red-50/20') : 'border-slate-100 bg-white shadow-sm'}`}>
              <div className="flex gap-3">
                <span className="font-bold text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded text-sm h-fit">Câu {idx + 1}</span>
                <p className="font-medium text-slate-800 text-lg leading-snug">{q.question}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 ml-0 md:ml-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = userVal === optIdx;
                  const isThisCorrect = q.correctAnswerIndex === optIdx;
                  
                  let btnClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-300';
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
                        btnClass = 'bg-slate-50 border-slate-100 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isSubmitted || (mode === 'PRACTICE' && instantFeedback && isAnswered)}
                      onClick={() => setPart1Answers(prev => ({ ...prev, [q.id]: optIdx }))}
                      className={`text-left px-4 py-3.5 rounded-xl border-2 text-sm transition-all flex justify-between items-center group ${btnClass}`}
                    >
                      <div className="flex items-center gap-3 w-full">
                         <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
                             showResult 
                                ? (isThisCorrect || isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500')
                                : (isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600')
                         }`}>
                             {String.fromCharCode(65 + optIdx)}
                         </span>
                         <span className="leading-snug">{cleanOptionText(opt)}</span>
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
    <section className="space-y-6 mt-12">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg shadow-sm">
        <h3 className="text-lg font-bold text-purple-900">Phần 2: Đúng / Sai (4.0 điểm)</h3>
        <p className="text-sm text-purple-700">4 câu hỏi lớn - Mỗi ý đúng 0.25 điểm</p>
      </div>
      {quizData.part2.map((q, idx) => (
        <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-semibold text-slate-800 mb-5 flex gap-3 text-lg">
            <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-lg text-sm h-fit font-bold whitespace-nowrap">Câu {idx + 1}</span>
            <span>{q.stem}</span>
          </h4>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Mệnh đề</th>
                  <th className="px-4 py-4 w-24 text-center">Đúng</th>
                  <th className="px-4 py-4 w-24 text-center">Sai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {q.statements.map((s) => {
                  const key = `${q.id}-${s.id}`;
                  const val = part2Answers[key];
                  const isAnswered = val !== undefined && val !== null;
                  const showResult = shouldShowResult(isAnswered);
                  const isMatch = val === s.isTrue;
                  
                  return (
                    <React.Fragment key={s.id}>
                      <tr className={`bg-white hover:bg-slate-50 transition-colors ${showResult ? (isMatch ? 'bg-green-50/40' : 'bg-red-50/40') : ''}`}>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          <div className="flex items-start gap-3">
                            {showResult && (
                              <div className="mt-0.5 shrink-0">
                                {isMatch ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                              </div>
                            )}
                            <span className={`text-base ${showResult && !isMatch ? 'text-red-900' : ''}`}>{s.statement}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center relative">
                          <div className="flex justify-center">
                            <input
                              type="radio"
                              name={`p2-${key}`}
                              disabled={isSubmitted || (mode === 'PRACTICE' && instantFeedback && isAnswered)}
                              checked={val === true}
                              onChange={() => setPart2Answers(prev => ({ ...prev, [key]: true }))}
                              className={`w-6 h-6 text-blue-600 accent-blue-600 cursor-pointer disabled:cursor-not-allowed transition-transform active:scale-95 ${
                                showResult && s.isTrue && !isMatch ? 'ring-4 ring-green-200 rounded-full' : ''
                              }`}
                            />
                          </div>
                          {showResult && s.isTrue && !isMatch && (
                             <span className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 rounded-full whitespace-nowrap shadow-sm">Đáp án</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center relative">
                          <div className="flex justify-center">
                            <input
                              type="radio"
                              name={`p2-${key}`}
                              disabled={isSubmitted || (mode === 'PRACTICE' && instantFeedback && isAnswered)}
                              checked={val === false}
                              onChange={() => setPart2Answers(prev => ({ ...prev, [key]: false }))}
                              className={`w-6 h-6 text-blue-600 accent-blue-600 cursor-pointer disabled:cursor-not-allowed transition-transform active:scale-95 ${
                                 showResult && !s.isTrue && !isMatch ? 'ring-4 ring-green-200 rounded-full' : ''
                              }`}
                            />
                          </div>
                           {showResult && !s.isTrue && !isMatch && (
                             <span className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 rounded-full whitespace-nowrap shadow-sm">Đáp án</span>
                          )}
                        </td>
                      </tr>
                      {showResult && s.explanation && (
                        <tr>
                          <td colSpan={3} className="px-6 py-2 border-b-0">
                             <div className="-mt-2 mb-4">
                               {renderExplanation(s.explanation)}
                             </div>
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
    <section className="space-y-6 mt-12">
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm">
        <h3 className="text-lg font-bold text-orange-900">Phần 3: Trả lời ngắn (3.0 điểm)</h3>
        <p className="text-sm text-orange-700">6 câu hỏi - 0.5 điểm/câu</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizData.part3.map((q, idx) => {
          const val = part3Answers[q.id] || '';
          const isMatch = val.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
          const [revealed, setRevealed] = useState(false);
          const showResult = isSubmitted || revealed;

          return (
            <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="mb-4">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Câu {idx + 1}</span>
                <p className="font-medium text-slate-800 mt-3 text-lg">{q.question}</p>
              </div>
              <div className="mt-auto">
                <div className="relative">
                  <input
                    type="text"
                    disabled={isSubmitted || (revealed && instantFeedback)}
                    value={val}
                    placeholder="Nhập kết quả..."
                    onChange={(e) => setPart3Answers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    className={`w-full p-4 pr-12 rounded-xl border-2 outline-none transition-all text-lg font-medium ${
                      showResult
                        ? isMatch
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-red-500 bg-red-50 text-red-900'
                        : 'border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500'
                    }`}
                  />
                  {showResult && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isMatch ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-3 h-8">
                   {mode === 'PRACTICE' && !isSubmitted && !revealed && (
                    <button 
                      onClick={() => setRevealed(true)}
                      className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-bold whitespace-nowrap transition-colors"
                    >
                      Kiểm tra
                    </button>
                  )}
                  {showResult && !isMatch && (
                    <div className="text-sm font-bold flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                      <ArrowLeft className="w-4 h-4" /> Đáp án đúng: <span className="text-lg">{q.correctAnswer}</span>
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
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b shadow-sm mb-6 -mx-4 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:shadow-none sm:border-none sm:mb-8 gap-3">
         <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
           <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 group">
              <div className="bg-white p-1.5 rounded-full border shadow-sm group-hover:border-slate-300 transition-colors">
                 <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline font-medium">Quay lại</span>
           </button>
           <h2 className="text-xl font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[300px]">{quizData.topic}</h2>
         </div>

         <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Timer Display for Assessment Mode */}
            {mode === 'ASSESSMENT' && !isSubmitted && (
               <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-1.5 rounded-xl border shadow-sm ${timeLeft < 300 ? 'text-red-600 bg-red-50 border-red-200 animate-pulse' : 'text-slate-700 bg-white border-slate-200'}`}>
                   <Clock className="w-5 h-5" />
                   {formatTime(timeLeft)}
               </div>
            )}

            {mode === 'PRACTICE' && !isSubmitted && (
              <button 
                onClick={() => setInstantFeedback(!instantFeedback)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${instantFeedback ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
              >
                {instantFeedback ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="hidden sm:inline">Xem đáp án</span>
              </button>
            )}

            {isSubmitted ? (
               <>
                 <div className="flex items-center gap-2 bg-yellow-400 text-yellow-950 px-4 py-1.5 rounded-xl font-bold whitespace-nowrap shadow-sm border border-yellow-500/20">
                    <Trophy className="w-4 h-4" />
                    <span>Điểm: {calculateScore()}/10</span>
                </div>
                {!showResultModal && (
                   <button 
                     onClick={() => setShowResultModal(true)}
                     className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md"
                   >
                     Xem kết quả
                   </button>
                )}
               </>
            ) : (
                <div className={`text-sm font-bold px-4 py-1.5 rounded-xl whitespace-nowrap hidden sm:block border ${mode === 'PRACTICE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {mode === 'PRACTICE' ? 'Chế độ Luyện tập' : 'Chế độ Kiểm tra'}
                </div>
            )}
         </div>
      </div>

      {renderPart1()}
      {renderPart2()}
      {renderPart3()}

      {/* Footer Actions */}
      {!isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t p-4 z-20 flex justify-center shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.1)]">
           <button
             onClick={handleAttemptSubmit}
             className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg"
           >
             <CheckCircle className="w-6 h-6" /> Nộp bài
           </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {!isSubmitted && showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 p-4 rounded-full mb-5 shadow-inner">
                <AlertCircle className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Nộp bài ngay?</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                 {mode === 'ASSESSMENT' 
                    ? `Bạn vẫn còn ${Math.ceil(timeLeft / 60)} phút. Hãy kiểm tra kỹ trước khi nộp nhé!` 
                    : "Bạn có chắc chắn muốn nộp bài và xem kết quả chi tiết không?"}
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Kiểm tra lại
                </button>
                <button 
                  onClick={confirmManualSubmit}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative">
            {/* Modal Header with Score */}
            <div className={`p-10 text-center text-white relative overflow-hidden ${calculateScore() >= 8 || mode === 'PRACTICE' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               
               <div className="relative z-10">
                 <div className="inline-block p-4 rounded-full bg-white/20 backdrop-blur-sm mb-4 border border-white/30 shadow-inner">
                    <Trophy className="w-12 h-12 text-white" />
                 </div>
                 <div className="text-7xl font-black mb-2 drop-shadow-lg tracking-tight">{calculateScore()}<span className="text-4xl opacity-80 font-bold">/10</span></div>
                 <h3 className="text-2xl font-bold mb-2">
                   {mode === 'PRACTICE' 
                      ? "Hoàn thành luyện tập!" 
                      : calculateScore() >= 8 ? "Xuất sắc! 🎉" : "Chưa đạt yêu cầu 😢"
                   }
                 </h3>
                 <p className="opacity-90 font-medium">
                   {mode === 'PRACTICE' 
                      ? "Bạn đã làm rất tốt. Hãy xem lại giải thích chi tiết." 
                      : calculateScore() >= 8 ? "Bạn đã nắm vững kiến thức bài này." : "Cần đạt tối thiểu 8.0 điểm."
                   }
                 </p>
               </div>
            </div>

            {/* Actions */}
            <div className="p-6 space-y-3 bg-white">
                {/* Primary Action */}
                <button 
                  onClick={() => onFinish(calculateScore())}
                  className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3
                    ${(calculateScore() >= 8 || mode === 'PRACTICE') 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                        : 'bg-slate-700 hover:bg-slate-800 shadow-slate-300'
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
                     className="py-3.5 px-4 rounded-xl font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                   >
                      <ListChecks className="w-5 h-5" /> Xem lời giải
                   </button>
                   
                   {mode === 'ASSESSMENT' && (
                     <button
                        onClick={handleShare}
                        className="py-3.5 px-4 rounded-xl font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
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