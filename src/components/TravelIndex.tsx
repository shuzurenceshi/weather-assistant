'use client';

import { WeatherData, getTravelIndex } from '@/lib/weather';

interface TravelIndexProps {
  data: WeatherData;
}

export default function TravelIndex({ data }: TravelIndexProps) {
  const { overall, details } = getTravelIndex(data);
  
  const getLevelColor = (level: 'good' | 'medium' | 'bad') => {
    switch (level) {
      case 'good': return 'bg-green-50 text-green-700';
      case 'medium': return 'bg-yellow-50 text-yellow-700';
      case 'bad': return 'bg-red-50 text-red-700';
    }
  };
  
  const getLevelDot = (level: 'good' | 'medium' | 'bad') => {
    switch (level) {
      case 'good': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'bad': return 'bg-red-500';
    }
  };
  
  return (
    <div className="weather-card">
      <h3 className="text-gray-800 font-medium mb-3 flex items-center gap-2">
        <span>🚗</span> 出行指数
      </h3>
      
      {/* 综合评价 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 mb-4 text-center">
        <div className="text-lg font-medium">{overall}</div>
      </div>
      
      {/* 详细指标 */}
      <div className="grid grid-cols-2 gap-3">
        {details.map((detail, i) => (
          <div
            key={i}
            className={`rounded-xl p-3 ${getLevelColor(detail.level)}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${getLevelDot(detail.level)}`}></span>
              <span className="text-xs opacity-70">{detail.label}</span>
            </div>
            <div className="font-medium">{detail.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
