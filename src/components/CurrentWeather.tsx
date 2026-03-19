'use client';

import { CurrentWeather } from '@/lib/weather';
import { getWeatherDescription, getWeatherIcon, getWindDirection } from '@/lib/weather';

interface CurrentWeatherCardProps {
  current: CurrentWeather;
  location: string;
  dailyHigh: number;
  dailyLow: number;
}

export default function CurrentWeatherCard({ current, location, dailyHigh, dailyLow }: CurrentWeatherCardProps) {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  
  return (
    <div className="weather-card text-center">
      {/* 位置 */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-lg">📍</span>
        <span className="text-gray-700 font-medium">{location}</span>
      </div>
      
      {/* 天气图标和温度 */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-6xl">{getWeatherIcon(current.weather_code, isDay)}</span>
        <div>
          <div className="text-5xl font-bold text-gray-800">
            {Math.round(current.temperature_2m)}°
          </div>
          <div className="text-sm text-gray-500">
            {dailyHigh}° / {dailyLow}°
          </div>
        </div>
      </div>
      
      {/* 天气描述 */}
      <div className="text-lg text-gray-700 mb-4">
        {getWeatherDescription(current.weather_code)}
        {current.apparent_temperature !== current.temperature_2m && (
          <span className="text-gray-500 ml-2">
            · 体感 {Math.round(current.apparent_temperature)}°
          </span>
        )}
      </div>
      
      {/* 详细数据 */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-500">湿度</div>
          <div className="font-medium">{current.relative_humidity_2m}%</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-500">风速</div>
          <div className="font-medium">{Math.round(current.wind_speed_10m)}km/h</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-500">风向</div>
          <div className="font-medium">{getWindDirection(current.wind_direction_10m)}风</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-500">气压</div>
          <div className="font-medium">{Math.round(current.pressure_msl)}hPa</div>
        </div>
      </div>
    </div>
  );
}
