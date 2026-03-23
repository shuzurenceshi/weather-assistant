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
  
  // 新订阅
  const [newEmail, setNewEmail] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [searching, setSearching] = useState(false);

  const login = async () => {
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
        setError('');
      } else {
        setError('密码错误');
      }
    } catch (e) {
      setError('网络错误');
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
    if (!newEmail || !newLocation) {
      setError('请填写邮箱和位置');
      return;
    }
    
    setSearching(true);
    setError('');
    setSuccess('');
    
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
          email: newEmail,
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
        setSuccess(`添加成功！位置: ${fullLocation}`);
      } else {
        setError(data.error || '添加失败');
      }
    } catch (e) {
      setError('添加失败');
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
      }
    } catch (e) {
      alert('删除失败');
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
      alert(data.message || '测试功能已触发');
    } catch (e) {
      alert('请求失败');
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
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAdmin(false); setError(''); }}
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
    const activeCount = subscribers.filter(s => s.enabled).length;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-md my-4 shadow-2xl">
          {/* 头部 */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-bold">📋 订阅管理</h3>
            <button
              onClick={() => setShowAdmin(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* 统计 */}
          <div className="flex gap-3 p-4 border-b">
            <div className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{subscribers.length}</div>
              <div className="text-xs opacity-90">总订阅</div>
            </div>
            <div className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{activeCount}</div>
              <div className="text-xs opacity-90">已启用</div>
            </div>
          </div>

          {/* 添加订阅 */}
          <div className="p-4 border-b">
            <div className="text-sm font-semibold mb-3">➕ 添加订阅</div>
            
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-2 rounded-lg mb-2">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-2 rounded-lg mb-2">{success}</div>
            )}
            
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="邮箱地址"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
            />
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="位置（如：石家庄）"
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
            />
            <button
              onClick={addSubscriber}
              disabled={searching}
              className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {searching ? '查找位置中...' : '添加订阅'}
            </button>
          </div>

          {/* 订阅列表 */}
          <div className="p-4">
            <div className="text-sm font-semibold mb-3">📋 订阅列表</div>
            
            {loading ? (
              <div className="text-center text-gray-500 py-4">加载中...</div>
            ) : subscribers.length === 0 ? (
              <div className="text-center text-gray-500 py-4">暂无订阅</div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {subscribers.map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{s.email}</div>
                        <div className="text-xs text-gray-500">📍 {s.location}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.enabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {s.enabled ? '启用' : '禁用'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => testEmail(s.email)}
                        className="flex-1 py-1 bg-gray-200 rounded text-xs"
                      >
                        测试
                      </button>
                      <button
                        onClick={() => deleteSubscriber(s.email)}
                        className="flex-1 py-1 bg-red-100 text-red-600 rounded text-xs"
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
      </div>
    );
  }

  // 小图标按钮
  return (
    <button
      onClick={() => setShowAdmin(true)}
      className="fixed bottom-4 right-4 w-12 h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center text-xl z-40 active:scale-95 transition-transform"
      title="订阅管理"
    >
      ⚙️
    </button>
  );
}
