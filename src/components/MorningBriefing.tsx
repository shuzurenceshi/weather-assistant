'use client';

import { WeatherData, getWeatherDescription, getWeatherIcon } from '@/lib/weather';

interface MorningBriefingProps {
  data: WeatherData;
  location: string;
}

export default function MorningBriefing({ data, location }: MorningBriefingProps) {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  
  // 今日天气 - 使用当前实时天气
  const todayHigh = Math.round(daily.temperature_2m_max[0]);
  const todayLow = Math.round(daily.temperature_2m_min[0]);
  const todayWeather = getWeatherDescription(current.weather_code);
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  const todayIcon = getWeatherIcon(current.weather_code, isDay);
  
  // 紫外线指数
  const uvIndex = daily.uv_index_max[0];
  const uvLevel = uvIndex < 3 ? '低' : uvIndex < 6 ? '中等' : uvIndex < 8 ? '高' : '很高';
  const uvAdvice = uvIndex < 3 ? '无需特别防护' : uvIndex < 6 ? '建议涂抹防晒霜' : '避免长时间户外活动';
  
  // 降水概率
  const maxRainProb = daily.precipitation_probability_max[0];
  
  // 最佳出行时段（找降水概率最低的时段）
  const currentHour = new Date().getHours();
  const morningHours = hourly.time.slice(currentHour, currentHour + 12).map((t, i) => ({
    hour: new Date(t).getHours(),
    prob: hourly.precipitation_probability[currentHour + i] || 0,
  }));
  const bestHour = morningHours.reduce((min, h) => h.prob < min.prob ? h : min, morningHours[0]);
  
  // 生成早间播报文案
  const generateBriefing = () => {
    const parts: string[] = [];
    
    // 问候语
    const hour = new Date().getHours();
    if (hour < 9) {
      parts.push('早上好！');
    } else if (hour < 12) {
      parts.push('上午好！');
    } else {
      parts.push('下午好！');
    }
    
    // 位置和日期
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
    parts.push(`今天是${dateStr}，${location}。`);
    
    // 天气概况
    parts.push(`今日${todayWeather}，气温${todayLow}°C到${todayHigh}°C。`);
    
    // 降水提醒
    if (maxRainProb > 50) {
      parts.push(`今天降水概率${maxRainProb}%，建议带伞出行。`);
    } else if (maxRainProb > 30) {
      parts.push(`今天有可能下雨，建议备一把伞。`);
    }
    
    // 紫外线提醒
    if (uvIndex >= 6) {
      parts.push(`紫外线指数${uvLevel}，${uvAdvice}。`);
    }
    
    // 最佳出行时段
    if (bestHour.prob < 30 && bestHour.hour > currentHour) {
      parts.push(`${bestHour.hour}点前后天气较好，适合外出。`);
    }
    
    return parts.join('');
  };
  
  return (
    <div className="weather-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🌅</span>
        <h3 className="text-gray-800 font-medium">早间天气播报</h3>
      </div>
      
      {/* 播报内容 */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 mb-4">
        <p className="text-gray-700 leading-relaxed text-sm">
          {generateBriefing()}
        </p>
      </div>
      
      {/* 今日概览 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <span className="text-3xl">{todayIcon}</span>
          <div className="text-sm text-gray-600 mt-1">{todayWeather}</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-500">{todayHigh}°</div>
          <div className="text-sm text-gray-600">最高温</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-500">{todayLow}°</div>
          <div className="text-sm text-gray-600">最低温</div>
        </div>
      </div>
      
      {/* 详细指标 */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">☀️</span>
          <div>
            <div className="text-xs text-gray-500">紫外线</div>
            <div className="text-sm font-medium">{uvLevel} ({uvIndex.toFixed(1)})</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <div>
            <div className="text-xs text-gray-500">降水概率</div>
            <div className="text-sm font-medium">{maxRainProb}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
