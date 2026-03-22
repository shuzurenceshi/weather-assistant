'use client';

import { useState, useEffect } from 'react';

interface Subscriber {
  email: string;
  location: string;
  lat: number;
  lon: number;
  enabled: boolean;
  alerts: string[];
}

const API_URL = 'https://weather-subscribers.shuzurenceshi.workers.dev';
const ADMIN_PASSWORD = 'weather@2024';

const alertNames: Record<string, string> = {
  rain: '降雨',
  wind: '大风',
  temperature: '温度',
  severe: '极端天气',
};

export default function AdminPanel() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 新订阅
  const [newEmail, setNewEmail] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLon, setNewLon] = useState('');

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      loadSubscribers();
      setError('');
    } else {
      setError('密码错误');
    }
  };

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/subscribers`, {
        headers: { Authorization: `Bearer ${ADMIN_PASSWORD}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers);
      }
    } catch (e) {
      console.error('加载失败', e);
    } finally {
      setLoading(false);
    }
  };

  const addSubscriber = async () => {
    if (!newEmail || !newLocation || !newLat || !newLon) {
      alert('请填写完整信息');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/subscribers/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({
          email: newEmail,
          location: newLocation,
          lat: parseFloat(newLat),
          lon: parseFloat(newLon),
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadSubscribers();
        setNewEmail('');
        setNewLocation('');
        setNewLat('');
        setNewLon('');
        alert('添加成功！');
      } else {
        alert(data.error || '添加失败');
      }
    } catch (e) {
      alert('添加失败');
    }
  };

  const deleteSubscriber = async (email: string) => {
    if (!confirm(`确定删除 ${email}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/subscribers/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        loadSubscribers();
      }
    } catch (e) {
      alert('删除失败');
    }
  };

  // 登录弹窗
  if (showAdmin && !isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
          <h3 className="text-lg font-bold mb-4">🔐 管理员登录</h3>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && login()}
            placeholder="请输入密码"
            className="w-full px-4 py-3 border rounded-xl mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdmin(false)}
              className="flex-1 py-2 border rounded-xl"
            >
              取消
            </button>
            <button
              onClick={login}
              className="flex-1 py-2 bg-blue-500 text-white rounded-xl"
            >
              登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 管理面板
  if (showAdmin && isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">📋 订阅管理 ({subscribers.length})</h3>
            <button
              onClick={() => setShowAdmin(false)}
              className="text-gray-500 text-xl"
            >
              ✕
            </button>
          </div>

          {/* 添加新订阅 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="text-sm font-medium mb-2">➕ 添加订阅</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="邮箱"
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="位置"
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="number"
                step="0.01"
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                placeholder="纬度"
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={newLon}
                onChange={(e) => setNewLon(e.target.value)}
                placeholder="经度"
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <button
              onClick={addSubscriber}
              className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              添加
            </button>
          </div>

          {/* 订阅列表 */}
          <div className="max-h-60 overflow-auto space-y-2">
            {loading ? (
              <div className="text-center text-gray-500 py-4">加载中...</div>
            ) : subscribers.length === 0 ? (
              <div className="text-center text-gray-500 py-4">暂无订阅</div>
            ) : (
              subscribers.map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{s.email}</div>
                    <div className="text-xs text-gray-500">
                      📍 {s.location}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {s.alerts.map((a) => (
                        <span key={a} className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-xs">
                          {alertNames[a]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSubscriber(s.email)}
                    className="text-red-500 text-xs"
                  >
                    删除
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 小图标按钮
  return (
    <button
      onClick={() => setShowAdmin(true)}
      className="fixed bottom-4 right-4 w-12 h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center text-xl z-40"
      title="订阅管理"
    >
      ⚙️
    </button>
  );
}
