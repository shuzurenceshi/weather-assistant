'use client';

import { getClothingAdvice, CurrentWeather } from '@/lib/weather';

interface ClothingAdviceProps {
  current: CurrentWeather;
}

export default function ClothingAdvice({ current }: ClothingAdviceProps) {
  const advice = getClothingAdvice(
    current.temperature_2m,
    current.wind_speed_10m,
    current.weather_code
  );
  
  return (
    <div className="weather-card">
      <h3 className="text-gray-800 font-medium mb-3 flex items-center gap-2">
        <span>👕</span> 穿衣建议
      </h3>
      
      <div className="flex items-center gap-4">
        {/* 穿衣图标 */}
        <div className="text-5xl">
          {current.temperature_2m >= 25 ? '🩳' : 
           current.temperature_2m >= 15 ? '👕' :
           current.temperature_2m >= 5 ? '🧥' : '🧥'}
        </div>
        
        {/* 建议列表 */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {advice.map((item, i) => (
              <span
                key={i}
                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* 场景建议 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-2xl mb-1">🏢</div>
            <div className="text-xs text-gray-500">通勤</div>
            <div className="text-sm text-green-600">✓ 适宜</div>
          </div>
          <div>
            <div className="text-2xl mb-1">🏃</div>
            <div className="text-xs text-gray-500">运动</div>
            <div className={`text-sm ${current.precipitation > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {current.precipitation > 0 ? '△ 注意' : '✓ 适宜'}
            </div>
          </div>
          <div>
            <div className="text-2xl mb-1">💕</div>
            <div className="text-xs text-gray-500">约会</div>
            <div className="text-sm text-green-600">✓ 适宜</div>
          </div>
        </div>
      </div>
    </div>
  );
}
