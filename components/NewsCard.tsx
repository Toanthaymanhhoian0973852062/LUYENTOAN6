import React from 'react';
import { MathNews } from '../types';
import { Sparkles, ImageIcon } from 'lucide-react';

interface NewsCardProps {
  news: MathNews | null;
  loading: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, loading }) => {
  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8 animate-pulse">
        <div className="h-48 bg-gray-200 flex items-center justify-center">
             <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
        <div className="p-6 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div className="w-full bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md group">
       <div className="relative h-48 sm:h-64 bg-indigo-50 overflow-hidden">
         {news.imageUrl ? (
            <img 
              src={news.imageUrl} 
              alt={news.title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
            />
         ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-indigo-300 bg-indigo-50">
               <Sparkles className="w-12 h-12 mb-2" />
               <span className="text-sm font-medium">Toán học diệu kỳ</span>
            </div>
         )}
         <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3" /> Góc Khám Phá
         </div>
       </div>
       <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{news.title}</h3>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{news.content}</p>
       </div>
    </div>
  );
};