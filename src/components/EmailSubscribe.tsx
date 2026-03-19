'use client';

import { useState } from 'react';

interface EmailSubscribeProps {
  onSave: (email: string, alerts: string[]) => void;
  savedEmail?: string;
  savedAlerts?: string[];
}

export default function EmailSubscribe({ onSave, savedEmail, savedAlerts }: EmailSubscribeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState(savedEmail || '');
  const [alerts, setAlerts] = useState<string[]>(savedAlerts || ['rain', 'wind', 'temperature', 'severe']);
  const [saved, setSaved] = useState(!!savedEmail);
  
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
  
  const handleSave = () => {
    if (email && alerts.length > 0) {
      onSave(email, alerts);
      setSaved(true);
      setIsOpen(false);
    }
  };
  
  if (saved && !isOpen) {
    return (
      <div className="weather-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div>
              <div className="text-sm text-gray-500">预警订阅已开启</div>
              <div className="text-gray-800">{email}</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="text-blue-500 text-sm"
          >
            修改
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="weather-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="text-left">
            <div className="text-gray-800 font-medium">预警订阅</div>
            <div className="text-xs text-gray-500">恶劣天气邮件提醒</div>
          </div>
        </div>
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
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
          
          <button
            onClick={handleSave}
            disabled={!email || alerts.length === 0}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开启预警
          </button>
          
          <p className="text-xs text-gray-400 text-center">
            仅在恶劣天气时发送提醒，不会发送垃圾邮件
          </p>
        </div>
      )}
    </div>
  );
}
