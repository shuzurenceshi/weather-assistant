'use client';

import { DailyWeather, getWeatherIcon, getWeatherDescription } from '@/lib/weather';

interface DailyForecastProps {
  daily: DailyWeather;
}

export default function DailyForecast({ daily }: DailyForecastProps) {
  const days = daily.time.slice(0, 7); // 显示7天
  
  const getDayName = (dateStr: string, index: number) => {
    if (index === 0) return '今天';
    if (index === 1) return '明天';
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  };
  
  return (
    <div className="weather-card">
      <h3 className="text-gray-800 font-medium mb-3 flex items-center gap-2">
        <span>📆</span> 7天温度趋势
      </h3>
      
      <div className="space-y-2">
        {days.map((time, i) => {
          const high = Math.round(daily.temperature_2m_max[i]);
          const low = Math.round(daily.temperature_2m_min[i]);
          const code = daily.weather_code[i];
          const rainProb = daily.precipitation_probability_max[i];
          
          // 计算温度条的比例（假设范围 -10 到 40）
          const minRange = -10;
          const maxRange = 45;
          const range = maxRange - minRange;
          const leftPercent = ((low - minRange) / range) * 100;
          const widthPercent = ((high - low) / range) * 100;
          
          return (
            <div key={time} className="flex items-center gap-3 py-2">
              {/* 日期 */}
              <div className="w-14 text-sm text-gray-600 flex-shrink-0">
                {getDayName(time, i)}
              </div>
              
              {/* 天气图标 */}
              <span className="text-2xl w-10 text-center">
                {getWeatherIcon(code, true)}
              </span>
              
              {/* 降水概率 */}
              <div className="w-10 text-xs text-blue-500 text-center">
                {rainProb > 20 ? `${rainProb}%` : ''}
              </div>
              
              {/* 温度条 */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm text-blue-500 w-8 text-right">{low}°</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full relative">
                  <div
                    className="absolute h-full bg-gradient-to-r from-blue-400 to-orange-400 rounded-full"
                    style={{
                      left: `${Math.max(0, leftPercent)}%`,
                      width: `${Math.min(100 - leftPercent, widthPercent)}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-orange-500 w-8">{high}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
