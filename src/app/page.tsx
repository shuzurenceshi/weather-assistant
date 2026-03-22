'use client';

import { useState, useEffect } from 'react';
import { WeatherData, getWeatherTheme, generateAssistantMessage } from '@/lib/weather';
import { fetchWeather, fetchLocationName } from '@/lib/api';
import CurrentWeatherCard from '@/components/CurrentWeather';
import AssistantMessage from '@/components/AssistantMessage';
import HourlyForecast from '@/components/HourlyForecast';
import DailyForecast from '@/components/DailyForecast';
import ClothingAdvice from '@/components/ClothingAdvice';
import TravelIndex from '@/components/TravelIndex';
import WeatherAlert from '@/components/WeatherAlert';
import EmailSubscribe from '@/components/EmailSubscribe';
import MorningBriefing from '@/components/MorningBriefing';
import Loading from '@/components/Loading';
import LocationError from '@/components/LocationError';

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState('定位中...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assistantMessage, setAssistantMessage] = useState('');
  
  // 邮件订阅状态
  const [savedEmail, setSavedEmail] = useState<string | undefined>();
  const [savedAlerts, setSavedAlerts] = useState<string[] | undefined>();
  
  useEffect(() => {
    // 从 localStorage 读取保存的订阅信息
    const email = localStorage.getItem('weather-alert-email');
    const alerts = localStorage.getItem('weather-alert-types');
    if (email) setSavedEmail(email);
    if (alerts) setSavedAlerts(JSON.parse(alerts));
    
    // 获取天气数据
    loadWeather();
  }, []);
  
  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 获取位置
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5分钟缓存
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // 并行获取天气和位置名
      const [weatherData, locationName] = await Promise.all([
        fetchWeather(latitude, longitude),
        fetchLocationName(latitude, longitude),
      ]);
      
      setWeather(weatherData);
      setLocation(locationName);
      setAssistantMessage(generateAssistantMessage(weatherData));
      
    } catch (err: any) {
      console.error('获取天气失败:', err);
      if (err.code === 1) {
        setError('定位权限被拒绝，请在浏览器设置中开启');
      } else if (err.code === 2) {
        setError('无法获取位置信息，请检查网络');
      } else if (err.code === 3) {
        setError('获取位置超时，请重试');
      } else {
        setError(err.message || '获取天气数据失败');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveSubscription = (email: string, alerts: string[]) => {
    localStorage.setItem('weather-alert-email', email);
    localStorage.setItem('weather-alert-types', JSON.stringify(alerts));
    setSavedEmail(email);
    setSavedAlerts(alerts);
  };
  
  if (loading) {
    return <Loading />;
  }
  
  if (error) {
    return <LocationError error={error} onRetry={loadWeather} />;
  }
  
  if (!weather) {
    return <LocationError error="未知错误" onRetry={loadWeather} />;
  }
  
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  const bgTheme = getWeatherTheme(weather.current.weather_code, isDay);
  
  return (
    <main className={`min-h-screen ${bgTheme} p-4 pb-20`}>
      <div className="max-w-md mx-auto">
        {/* 预警信息 */}
        <WeatherAlert data={weather} />
        
        {/* 当前天气 */}
        <CurrentWeatherCard
          current={weather.current}
          location={location}
          dailyHigh={Math.round(weather.daily.temperature_2m_max[0])}
          dailyLow={Math.round(weather.daily.temperature_2m_min[0])}
        />
        
        {/* 早间播报 */}
        <MorningBriefing data={weather} location={location} />
        
        {/* 助理消息 */}
        <AssistantMessage message={assistantMessage} />
        
        {/* 48小时预报 */}
        <HourlyForecast hourly={weather.hourly} />
        
        {/* 7天温度趋势 */}
        <DailyForecast daily={weather.daily} />
        
        {/* 穿衣建议 */}
        <ClothingAdvice current={weather.current} />
        
        {/* 出行指数 */}
        <TravelIndex data={weather} />
        
        {/* 预警订阅 */}
        <EmailSubscribe
          onSave={handleSaveSubscription}
          savedEmail={savedEmail}
          savedAlerts={savedAlerts}
        />
        
        {/* 底部信息 */}
        <div className="text-center text-white/60 text-xs mt-4">
          📍 {location} · 数据来源: Open-Meteo · 更新时间: {new Date(weather.current.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          <br />
          <a href="https://weather-subscribers.shuzurenceshi.workers.dev" className="text-white/80 hover:text-white underline">
            订阅管理
          </a>
        </div>
      </div>
    </main>
  );
}
