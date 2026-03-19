'use client';

import { HourlyWeather, getWeatherIcon, getWeatherDescription } from '@/lib/weather';

interface HourlyForecastProps {
  hourly: HourlyWeather;
}

export default function HourlyForecast({ hourly }: HourlyForecastProps) {
  const now = new Date();
  const currentHour = now.getHours();
  
  // 取未来48小时
  const startIndex = hourly.time.findIndex(t => {
    const time = new Date(t);
    return time.getHours() === currentHour && time.getDate() === now.getDate();
  });
  
  const displayHours = startIndex >= 0 ? 48 : 24;
  const hours = hourly.time.slice(startIndex >= 0 ? startIndex : 0, startIndex >= 0 ? startIndex + displayHours : displayHours);
  const temps = hourly.temperature_2m.slice(startIndex >= 0 ? startIndex : 0, startIndex >= 0 ? startIndex + displayHours : displayHours);
  const codes = hourly.weather_code.slice(startIndex >= 0 ? startIndex : 0, startIndex >= 0 ? startIndex + displayHours : displayHours);
  const rainProb = hourly.precipitation_probability.slice(startIndex >= 0 ? startIndex : 0, startIndex >= 0 ? startIndex + displayHours : displayHours);
  
  return (
    <div className="weather-card">
      <h3 className="text-gray-800 font-medium mb-3 flex items-center gap-2">
        <span>📅</span> 48小时预报
      </h3>
      
      <div className="scroll-container overflow-x-auto">
        <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
          {hours.map((time, i) => {
            const date = new Date(time);
            const hour = date.getHours();
            const isNow = i === 0;
            const isDay = hour >= 6 && hour < 18;
            const showDate = hour === 0 || (i === 0 && hour !== 0);
            
            return (
              <div
                key={time}
                className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${
                  isNow ? 'bg-blue-500 text-white' : 'bg-gray-50'
                }`}
              >
                {showDate && (
                  <div className={`text-xs ${isNow ? 'text-blue-100' : 'text-gray-400'} mb-1`}>
                    {date.getMonth() + 1}/{date.getDate()}
                  </div>
                )}
                <div className="text-sm font-medium">{hour}:00</div>
                <span className="text-2xl my-1">{getWeatherIcon(codes[i], isDay)}</span>
                <div className="text-sm font-bold">{Math.round(temps[i])}°</div>
                {rainProb[i] > 20 && (
                  <div className={`text-xs ${isNow ? 'text-blue-100' : 'text-blue-500'} mt-1`}>
                    💧{rainProb[i]}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
