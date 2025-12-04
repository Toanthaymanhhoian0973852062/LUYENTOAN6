
import React, { useState, useEffect } from 'react';
import { CURRICULUM, getNextLessonId } from './data/curriculum';
import { generateQuiz, generateMathNews } from './services/geminiService';
import { QuizRunner } from './components/QuizRunner';
import { NewsCard } from './components/NewsCard';
import { ChatSupport } from './components/ChatSupport';
import { AppScreen, UserProgress, QuizData, QuizMode, MathNews } from './types';
import { BookOpen, Lock, CheckCircle, PlayCircle, Star, Loader2, Trophy, AlertCircle, Unlock, Sparkles, List, X } from 'lucide-react';

const STORAGE_KEY = 'math6_kntt_progress';
const NEWS_CACHE_KEY = 'math6_kntt_news_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [mode, setMode] = useState<QuizMode>('ASSESSMENT');
  const [progress, setProgress] = useState<UserProgress>({ scores: {} });
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // News state
  const [news, setNews] = useState<MathNews | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);

  // TOC State
  const [showTOC, setShowTOC] = useState(false);

  // Load progress and news on mount
  useEffect(() => {
    // 1. Load Progress
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse progress", e);
      }
    }

    // 2. Load News with Caching Strategy
    const loadNews = async () => {
      // Try to load from cache first
      const cachedNewsRaw = localStorage.getItem(NEWS_CACHE_KEY);
      if (cachedNewsRaw) {
        try {
          const cached = JSON.parse(cachedNewsRaw);
          const now = Date.now();
          // Check if cache is valid (less than 24 hours old)
          if (now - cached.timestamp < CACHE_DURATION) {
            setNews(cached.data);
            return; // Exit, use cached data
          }
        } catch (e) {
          console.error("Cache invalid", e);
        }
      }

      // If no cache or expired, fetch new data
      setNewsLoading(true);
      try {
        const data = await generateMathNews();
        setNews(data);
        // Save to cache
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: data
        }));
      } catch (e) {
        console.error("Failed to fetch news", e);
        // Fallback content if API fails (Quota Exceeded)
        setNews({
            title: "Hệ thống đang bận",
            content: "Hiện tại máy chủ AI đang quá tải. Bạn vẫn có thể làm bài tập bình thường nhé!",
            imageUrl: undefined
        });
      } finally {
        setNewsLoading(false);
      }
    };

    loadNews();
  }, []);

  // Save progress on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const handleLessonSelect = async (lessonId: string, title: string) => {
    if (mode === 'ASSESSMENT' && isLocked(lessonId)) {
      alert("Bạn cần hoàn thành bài trước với điểm số >= 8.0 để mở bài này!");
      return;
    }

    setScreen(AppScreen.LOADING);
    setActiveLessonId(lessonId);
    setError(null);

    try {
      const data = await generateQuiz(title, "Toán Lớp 6 - Kết nối tri thức");
      setQuizData(data);
      setScreen(AppScreen.QUIZ);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Không thể tạo đề thi. Vui lòng thử lại sau.";
      if (err.message && err.message.includes("quota")) {
        errorMessage = "Hệ thống AI đang hết hạn mức phục vụ. Vui lòng quay lại sau 1-2 phút.";
      }
      setError(errorMessage);
      setScreen(AppScreen.DASHBOARD);
    }
  };

  const handleQuizFinish = (score: number) => {
    // Only save progress in Assessment mode
    if (mode === 'ASSESSMENT' && activeLessonId) {
      setProgress(prev => {
        const currentBest = prev.scores[activeLessonId] || 0;
        return {
          ...prev,
          scores: {
            ...prev.scores,
            [activeLessonId]: Math.max(currentBest, score)
          }
        };
      });
    }
    setScreen(AppScreen.DASHBOARD);
    setQuizData(null);
    setActiveLessonId(null);
  };

  const isLocked = (lessonId: string) => {
    // Lesson 1.1 is always unlocked
    if (lessonId === 'l1.1') return false;
    
    // Find previous lesson
    let prevLessonId: string | null = null;
    let found = false;
    for (const chapter of CURRICULUM) {
      for (const lesson of chapter.lessons) {
        if (lesson.id === lessonId) {
          found = true;
          break;
        }
        prevLessonId = lesson.id;
      }
      if (found) break;
    }

    if (!prevLessonId) return false;
    const prevScore = progress.scores[prevLessonId] || 0;
    return prevScore < 8.0;
  };

  const getLessonStatus = (lessonId: string) => {
    // In practice mode, everything is unlocked
    if (mode === 'PRACTICE') return 'UNLOCKED';

    if (isLocked(lessonId)) return 'LOCKED';
    const score = progress.scores[lessonId];
    if (score === undefined) return 'UNLOCKED';
    if (score >= 8.0) return 'PASSED';
    return 'FAILED';
  };

  const scrollToChapter = (chapterId: string) => {
    setShowTOC(false);
    const element = document.getElementById(`chapter-${chapterId}`);
    if (element) {
      // The sticky header offset is roughly 140px, but scroll-margin-top handles it better
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (screen === AppScreen.LOADING) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Đang tạo đề thi thông minh...</h2>
        <p className="text-slate-500 mt-2 text-center max-w-md">Hệ thống AI đang soạn 12 câu trắc nghiệm, 4 câu đúng sai và 6 câu trả lời ngắn dành riêng cho bạn.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter relative">
      {screen === AppScreen.QUIZ && quizData ? (
        <div className="p-4">
           <QuizRunner 
            quizData={quizData} 
            mode={mode}
            onFinish={handleQuizFinish} 
            onBack={() => setScreen(AppScreen.DASHBOARD)}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg text-white shadow-blue-200 shadow-md">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 leading-tight">Toán 6 KNTT Master</h1>
                    <p className="text-xs text-slate-500">Luyện tập & Đánh giá năng lực</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {mode === 'ASSESSMENT' && (
                    <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span>{(Object.values(progress.scores) as number[]).filter(s => s >= 8).length} bài đạt</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setShowTOC(true)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    title="Mục lục"
                  >
                    <List className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Mode Switcher Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-lg">
                 <button 
                   onClick={() => setMode('ASSESSMENT')}
                   className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'ASSESSMENT' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   <BookOpen className="w-4 h-4" /> Theo Lộ Trình
                 </button>
                 <button 
                   onClick={() => setMode('PRACTICE')}
                   className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'PRACTICE' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   <Sparkles className="w-4 h-4" /> Luyện Tự Do
                 </button>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 pb-32">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                 <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}

            {/* Math News Card */}
            <NewsCard news={news} loading={newsLoading} />

            {mode === 'PRACTICE' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex gap-3 text-indigo-800 text-sm mb-6">
                <Unlock className="w-5 h-5 shrink-0" />
                <p>
                  Trong chế độ <strong>Luyện Tự Do</strong>, tất cả các bài học đều được mở. 
                  Bạn có thể xem đáp án ngay lập tức khi làm bài. Kết quả sẽ không được lưu vào lộ trình chính.
                </p>
              </div>
            )}

            {CURRICULUM.map((chapter) => (
              <div key={chapter.id} className="space-y-4">
                <h2 
                  id={`chapter-${chapter.id}`}
                  className="text-lg font-bold text-slate-800 sticky top-[138px] bg-slate-50/95 py-3 backdrop-blur-sm z-0 border-b border-slate-100 scroll-mt-48"
                >
                  {chapter.title}
                </h2>
                <div className="grid gap-3">
                  {chapter.lessons.map((lesson) => {
                    const status = getLessonStatus(lesson.id);
                    const score = progress.scores[lesson.id];
                    
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonSelect(lesson.id, lesson.title)}
                        disabled={status === 'LOCKED'}
                        className={`group w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden
                          ${status === 'LOCKED' 
                            ? 'bg-gray-50 border-gray-200 opacity-70 cursor-not-allowed' 
                            : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-4 relative z-10">
                          <div className="flex-1">
                            <h3 className={`font-semibold ${status === 'LOCKED' ? 'text-gray-500' : 'text-slate-800'}`}>
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              {mode === 'ASSESSMENT' && status === 'PASSED' && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle className="w-3 h-3" /> Đạt: {score}/10
                                </span>
                              )}
                              {mode === 'ASSESSMENT' && status === 'FAILED' && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                                  <Star className="w-3 h-3" /> Điểm cao nhất: {score}/10
                                </span>
                              )}
                              {status === 'UNLOCKED' && (
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${mode === 'PRACTICE' ? 'text-indigo-700 bg-indigo-100' : 'text-blue-700 bg-blue-100'}`}>
                                  <PlayCircle className="w-3 h-3" /> {mode === 'PRACTICE' ? 'Luyện tập' : 'Sẵn sàng'}
                                </span>
                              )}
                               {status === 'LOCKED' && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                  <Lock className="w-3 h-3" /> Bị khóa
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className={`p-3 rounded-full ${
                            mode === 'ASSESSMENT' && status === 'PASSED' ? 'bg-green-100 text-green-600' :
                            status === 'LOCKED' ? 'bg-gray-200 text-gray-400' :
                            mode === 'PRACTICE' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors' :
                            'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors'
                          }`}>
                             {status === 'LOCKED' ? <Lock className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <div className="text-center text-slate-400 text-sm py-8">
               Chương trình học bám sát SGK Kết Nối Tri Thức Với Cuộc Sống
            </div>
          </main>

          {/* Table of Contents Modal */}
          {showTOC && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div 
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity" 
                onClick={() => setShowTOC(false)}
              />
              <div className="relative w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <List className="w-5 h-5 text-blue-600" /> Mục Lục
                  </h3>
                  <button 
                    onClick={() => setShowTOC(false)}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {CURRICULUM.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => scrollToChapter(chapter.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium text-sm transition-all border border-transparent hover:border-blue-100 group"
                    >
                      <span className="block text-xs font-bold text-slate-400 group-hover:text-blue-500 mb-0.5">
                        {chapter.title.split(':')[0]}
                      </span>
                      {chapter.title.split(':')[1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Chat Bot Widget - Always available */}
      <ChatSupport />
    </div>
  );
}
