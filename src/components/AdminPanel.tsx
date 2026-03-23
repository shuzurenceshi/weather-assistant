'use client';

import { useState } from 'react';

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

export default function AdminPanel() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newEmail, setNewEmail] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [searching, setSearching] = useState(false);

  const login = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        loadSubscribers();
      } else {
        setError('密码错误');
      }
    } catch (e) {
      setError('网络错误，请重试');
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
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const addSubscriber = async () => {
    setError('');
    setSuccess('');
    
    if (!newEmail.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (!newLocation.trim()) {
      setError('请输入位置');
      return;
    }
    
    setSearching(true);
    
    try {
      // 获取经纬度
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(newLocation)}&count=1&language=zh`
      );
      const geoData = await geoRes.json();
      
      let lat = 0, lon = 0, fullLocation = newLocation;
      if (geoData.results && geoData.results.length > 0) {
        const r = geoData.results[0];
        lat = r.latitude;
        lon = r.longitude;
        fullLocation = r.admin1 ? `${r.admin1}${r.name}` : r.name;
      }
      
      const res = await fetch(`${API_URL}/api/subscribers/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          location: fullLocation,
          lat,
          lon,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadSubscribers();
        setNewEmail('');
        setNewLocation('');
        setSuccess(`✓ 添加成功: ${fullLocation}`);
      } else {
        setError(data.error || '添加失败');
      }
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setSearching(false);
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
      } else {
        alert(data.error || '删除失败');
      }
    } catch (e) {
      alert('网络错误');
    }
  };

  const testEmail = async (email: string) => {
    if (!confirm(`发送测试邮件到 ${email}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_PASSWORD}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      alert(data.message || '测试已触发');
    } catch (e) {
      alert('网络错误');
    }
  };

  const closePanel = () => {
    setShowAdmin(false);
    setIsLoggedIn(false);
    setPassword('');
    setError('');
    setSuccess('');
  };

  // 登录弹窗
  if (showAdmin && !isLoggedIn) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closePanel}
        />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 w-[90%] max-w-xs z-50 shadow-xl">
          <h3 className="text-base font-bold mb-3 text-center">🔐 管理登录</h3>
          {error && (
            <div className="bg-red-50 text-red-500 text-xs p-2 rounded-lg mb-2 text-center">
              {error}
            </div>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="请输入密码"
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm mb-3 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={closePanel}
              className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600"
            >
              取消
            </button>
            <button
              onClick={login}
              className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium"
            >
              登录
            </button>
          </div>
        </div>
      </>
    );
  }

  // 管理面板
  if (showAdmin && isLoggedIn) {
    const activeCount = subscribers.filter(s => s.enabled).length;
    
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closePanel}
        />
        <div 
          className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-2xl z-50 shadow-xl flex flex-col max-w-md mx-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex justify-between items-center p-4 border-b shrink-0">
            <h3 className="text-base font-bold">📋 订阅管理</h3>
            <button
              onClick={closePanel}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* 统计 */}
          <div className="flex gap-3 p-4 border-b shrink-0">
            <div className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{subscribers.length}</div>
              <div className="text-xs opacity-90">总订阅</div>
            </div>
            <div className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{activeCount}</div>
              <div className="text-xs opacity-90">已启用</div>
            </div>
          </div>

          {/* 添加订阅 */}
          <div className="p-4 border-b shrink-0">
            <div className="text-sm font-semibold mb-2">➕ 添加订阅</div>
            
            {error && (
              <div className="bg-red-50 text-red-500 text-xs p-2 rounded-lg mb-2">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 text-xs p-2 rounded-lg mb-2">{success}</div>
            )}
            
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="邮箱地址"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="位置（如：石家庄）"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={addSubscriber}
              disabled={searching}
              className="w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 active:bg-blue-600"
            >
              {searching ? '处理中...' : '添加订阅'}
            </button>
          </div>

          {/* 订阅列表 */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="text-sm font-semibold mb-2">📋 订阅列表</div>
            
            {loading ? (
              <div className="text-center text-gray-400 py-8">加载中...</div>
            ) : subscribers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">暂无订阅</div>
            ) : (
              <div className="space-y-2">
                {subscribers.map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{s.email}</div>
                        <div className="text-xs text-gray-500 truncate">📍 {s.location}</div>
                      </div>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        s.enabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {s.enabled ? '✓' : '×'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => testEmail(s.email)}
                        className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium"
                      >
                        测试邮件
                      </button>
                      <button
                        onClick={() => deleteSubscriber(s.email)}
                        className="flex-1 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded text-xs font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // 浮动按钮
  return (
    <button
      onClick={() => setShowAdmin(true)}
      className="fixed bottom-6 right-6 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl z-30 active:scale-95 transition-transform"
      style={{ touchAction: 'manipulation' }}
    >
      ⚙️
    </button>
  );
}
