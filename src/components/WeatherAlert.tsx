'use client';

import { WeatherData, checkWeatherAlert } from '@/lib/weather';

interface WeatherAlertProps {
  data: WeatherData;
}

export default function WeatherAlert({ data }: WeatherAlertProps) {
  const alert = checkWeatherAlert(data);
  
  if (!alert) return null;
  
  const bgColor = alert.type === 'red' 
    ? 'bg-red-500' 
    : alert.type === 'orange' 
    ? 'bg-orange-500' 
    : 'bg-yellow-500';
  
  return (
    <div className={`${bgColor} text-white rounded-2xl p-4 mb-4 warning-pulse`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">⚠️</span>
        <div className="flex-1">
          <div className="font-bold mb-1">
            {alert.type === 'red' ? '🚨 紧急预警' : '⚠️ 天气预警'}
          </div>
          <div className="text-sm opacity-90">{alert.message}</div>
        </div>
      </div>
    </div>
  );
}
