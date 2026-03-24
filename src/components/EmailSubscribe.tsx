'use client';

import { useState } from 'react';

interface EmailSubscribeProps {
  currentLocation?: string;
  latitude?: number;
  longitude?: number;
}

const API_URL = 'https://subscribers-api.weather-assistant.workers.dev';

export default function EmailSubscribe({ currentLocation, latitude, longitude }: EmailSubscribeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(currentLocation || '');
  const [alerts, setAlerts] = useState<string[]>(['rain', 'wind', 'temperature', 'severe']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUnsubscribe, setIsUnsubscribe] = useState(false);
  
  const alertOptions = [
    { id: 'rain', label: '降雨预警', icon: '🌧️' },
    { id: 'wind', label: '大风预警', icon: '💨' },
    { id: 'temperature', label: '温度突变', icon: '🌡️' },
    { id: 'severe', label: '恶劣天气', icon: '⛈️' },
  ];
  
  const toggleAlert = (id: string) => {
    setAlerts(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };
  
  const handleSubscribe = async () => {
    if (!email || !location) {
      setMessage({ type: 'error', text: '请填写邮箱和位置' });
      return;
    }
    if (alerts.length === 0) {
      setMessage({ type: 'error', text: '请至少选择一种预警类型' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      // 获取经纬度
      let lat = latitude || 0;
      let lon = longitude || 0;
      let fullLocation = location;
      
      if (!lat || !lon) {
        try {
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=zh`);
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            const r = geoData.results[0];
            lat = r.latitude;
            lon = r.longitude;
            fullLocation = (r.admin1 || '') + r.name;
          }
        } catch (geoErr) {
          console.log('地理编码失败，使用默认坐标');
        }
      } else {
        fullLocation = location;
      }
      
      // 调用公开订阅 API
      const res = await fetch(`${API_URL}/api/public/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          location: fullLocation,
          lat,
          lon,
          alerts
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '✅ 订阅成功！恶劣天气时将收到邮件提醒' });
        setEmail('');
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || '订阅失败，请稍后重试' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: '网络错误: ' + err.message });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUnsubscribe = async () => {
    if (!email) {
      setMessage({ type: 'error', text: '请填写要退订的邮箱' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await fetch(`${API_URL}/api/public/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: '✅ 已退订，不再接收天气预警' });
        setEmail('');
        setTimeout(() => {
          setIsOpen(false);
          setIsUnsubscribe(false);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.error || '退订失败' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: '网络错误: ' + err.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="weather-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📧</span>
          <div className="text-left">
            <div className="text-gray-800 font-medium">天气预警订阅</div>
            <div className="text-xs text-gray-500">恶劣天气邮件提醒</div>
          </div>
        </div>
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* 切换订阅/退订 */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setIsUnsubscribe(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isUnsubscribe ? 'bg-white shadow text-blue-600' : 'text-gray-500'
              }`}
            >
              订阅
            </button>
            <button
              onClick={() => setIsUnsubscribe(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isUnsubscribe ? 'bg-white shadow text-red-500' : 'text-gray-500'
              }`}
            >
              退订
            </button>
          </div>
          
          {/* 消息提示 */}
          {message && (
            <div className={`p-3 rounded-xl text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {message.text}
            </div>
          )}
          
          <div>
            <label className="text-sm text-gray-600 mb-2 block">邮箱地址 *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {!isUnsubscribe && (
            <>
              <div>
                <label className="text-sm text-gray-600 mb-2 block">所在城市 *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="如：广州、北京、上海"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-2 block">预警类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {alertOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => toggleAlert(option.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        alerts.includes(option.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span className="text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          
          <button
            onClick={isUnsubscribe ? handleUnsubscribe : handleSubscribe}
            disabled={loading || !email || (!isUnsubscribe && (!location || alerts.length === 0))}
            className={`w-full py-3 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              isUnsubscribe ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? '处理中...' : isUnsubscribe ? '确认退订' : '立即订阅'}
          </button>
          
          <p className="text-xs text-gray-400 text-center">
            {isUnsubscribe 
              ? '退订后将不再收到任何天气预警邮件'
              : '仅在恶劣天气时发送提醒，不会发送垃圾邮件'}
          </p>
        </div>
      )}
    </div>
  );
}
