'use client';

import { useState } from 'react';

interface Subscriber {
  email: string;
  location: string;
  lat: number;
  lon: number;
  enabled: boolean;
  alerts: string[];
  createdAt?: string;
}

const ADMIN_PASSWORD = 'weather@2024';

const alertNames: Record<string, string> = {
  rain: '降雨',
  wind: '大风',
  temperature: '温度',
  severe: '极端天气',
};

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 新订阅表单
  const [newEmail, setNewEmail] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLon, setNewLon] = useState('');

  const login = async () => {
    if (password === ADMIN_PASSWORD) {
      setToken(password);
      loadSubscribers(password);
    } else {
      setError('密码错误');
    }
  };

  const loadSubscribers = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('https://weather-subscribers.shuzurenceshi.workers.dev/api/subscribers', {
        headers: { Authorization: `Bearer ${authToken}` },
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
      const res = await fetch('https://weather-subscribers.shuzurenceshi.workers.dev/api/subscribers/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
        alert('添加成功！');
        loadSubscribers(token);
        setNewEmail('');
        setNewLocation('');
        setNewLat('');
        setNewLon('');
      }
    } catch (e) {
      alert('添加失败');
    }
  };

  const deleteSubscriber = async (email: string) => {
    if (!confirm(`确定要删除 ${email} 的订阅吗？`)) return;

    try {
      const res = await fetch('/api/subscribers/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        alert('删除成功！');
        loadSubscribers(token);
      }
    } catch (e) {
      alert('删除失败');
    }
  };

  const logout = () => {
    setToken('');
    setPassword('');
    setSubscribers([]);
  };

  // 登录页面
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">🌤️ 天气助理管理</h1>
            <p className="text-gray-500">请输入管理密码</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">🔐 管理密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && login()}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                placeholder="请输入密码"
              />
            </div>
            <button
              onClick={login}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              登 录
            </button>
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-indigo-500 hover:underline">
              ← 返回天气首页
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 管理仪表盘
  const activeCount = subscribers.filter((s) => s.enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">🌤️ 订阅管理</h1>
          <button
            onClick={logout}
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30"
          >
            退出
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center text-white">
            <div className="text-4xl font-bold">{subscribers.length}</div>
            <div className="text-white/80 text-sm">总订阅数</div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center text-white">
            <div className="text-4xl font-bold">{activeCount}</div>
            <div className="text-white/80 text-sm">已启用</div>
          </div>
        </div>

        {/* 添加新订阅 */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-4">➕ 添加新订阅</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="p-3 rounded-lg bg-white/90 focus:outline-none"
              placeholder="邮箱地址"
            />
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="p-3 rounded-lg bg-white/90 focus:outline-none"
              placeholder="位置 (如: 河北石家庄)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="number"
              step="0.01"
              value={newLat}
              onChange={(e) => setNewLat(e.target.value)}
              className="p-3 rounded-lg bg-white/90 focus:outline-none"
              placeholder="纬度"
            />
            <input
              type="number"
              step="0.01"
              value={newLon}
              onChange={(e) => setNewLon(e.target.value)}
              className="p-3 rounded-lg bg-white/90 focus:outline-none"
              placeholder="经度"
            />
          </div>
          <button
            onClick={addSubscriber}
            className="w-full py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100"
          >
            添加订阅
          </button>
        </div>

        {/* 订阅列表 */}
        <div className="bg-white rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 mb-4">📋 订阅用户列表</h3>

          {loading ? (
            <div className="text-center text-gray-500 py-8">加载中...</div>
          ) : subscribers.length === 0 ? (
            <div className="text-center text-gray-500 py-8">暂无订阅用户</div>
          ) : (
            <div className="space-y-4">
              {subscribers.map((s, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-xl p-4 flex justify-between items-start"
                >
                  <div>
                    <div className="font-medium text-gray-800">{s.email}</div>
                    <div className="text-gray-500 text-sm">
                      📍 {s.location} ({s.lat}, {s.lon})
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.alerts.map((a) => (
                        <span
                          key={a}
                          className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs"
                        >
                          {alertNames[a] || a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        s.enabled
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {s.enabled ? '✅ 启用' : '❌ 禁用'}
                    </span>
                    <button
                      onClick={() => deleteSubscriber(s.email)}
                      className="bg-red-50 text-red-500 px-3 py-1 rounded-lg text-sm hover:bg-red-100"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部链接 */}
        <div className="text-center mt-6">
          <a href="/" className="text-white/80 hover:text-white">
            ← 返回天气首页
          </a>
        </div>
      </div>
    </div>
  );
}
