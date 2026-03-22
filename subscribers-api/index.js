/**
 * 订阅用户查看 API
 * 带密码保护的订阅管理页面
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 配置
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'weather2024';
    const SUBSCRIBERS_KV = env.SUBSCRIBERS_KV;

    // CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 验证密码
    function checkAuth(request) {
      const auth = request.headers.get('Authorization');
      if (!auth) return false;
      const token = auth.replace('Bearer ', '');
      return token === ADMIN_PASSWORD;
    }

    // 获取订阅用户（从 KV 或默认文件）
    async function getSubscribers() {
      if (SUBSCRIBERS_KV) {
        const data = await SUBSCRIBERS_KV.get('subscribers', 'json');
        return data || getDefaultSubscribers();
      }
      return getDefaultSubscribers();
    }

    // 默认订阅用户（硬编码备份）
    function getDefaultSubscribers() {
      return [
        {
          email: "7961566@qq.com",
          location: "河北石家庄",
          lat: 38.04,
          lon: 114.51,
          enabled: true,
          alerts: ["rain", "wind", "temperature", "severe"],
          createdAt: "2024-03-23"
        }
      ];
    }

    // 主页 - 登录页面
    if (path === '/' || path === '/index.html') {
      return new Response(getLoginPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
      });
    }

    // 验证登录
    if (path === '/api/login' && request.method === 'POST') {
      const body = await request.json();
      if (body.password === ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ success: true, token: ADMIN_PASSWORD }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      return new Response(JSON.stringify({ success: false, error: '密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 获取订阅列表（需认证）
    if (path === '/api/subscribers') {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: '未授权' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const subscribers = await getSubscribers();
      return new Response(JSON.stringify({
        success: true,
        count: subscribers.length,
        subscribers: subscribers
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 添加订阅（需认证）
    if (path === '/api/subscribers/add' && request.method === 'POST') {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: '未授权' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const body = await request.json();
      const newSubscriber = {
        email: body.email,
        location: body.location,
        lat: body.lat,
        lon: body.lon,
        enabled: true,
        alerts: body.alerts || ["rain", "wind", "temperature", "severe"],
        createdAt: new Date().toISOString().split('T')[0]
      };

      let subscribers = await getSubscribers();
      subscribers.push(newSubscriber);

      if (SUBSCRIBERS_KV) {
        await SUBSCRIBERS_KV.put('subscribers', JSON.stringify(subscribers));
      }

      return new Response(JSON.stringify({ success: true, message: '订阅已添加' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 删除订阅（需认证）
    if (path === '/api/subscribers/delete' && request.method === 'POST') {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: '未授权' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const body = await request.json();
      let subscribers = await getSubscribers();
      subscribers = subscribers.filter(s => s.email !== body.email);

      if (SUBSCRIBERS_KV) {
        await SUBSCRIBERS_KV.put('subscribers', JSON.stringify(subscribers));
      }

      return new Response(JSON.stringify({ success: true, message: '订阅已删除' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

function getLoginPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>天气助理 - 订阅管理</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 800px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
        }
        .login-form {
            max-width: 400px;
            margin: 0 auto;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }
        input[type="password"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        .error {
            background: #ffe0e0;
            color: #c00;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .dashboard {
            display: none;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }
        .stat-card .number {
            font-size: 36px;
            font-weight: bold;
        }
        .stat-card .label {
            font-size: 14px;
            opacity: 0.9;
        }
        .subscriber-list {
            margin-top: 20px;
        }
        .subscriber-item {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .subscriber-info h3 {
            color: #333;
            margin-bottom: 5px;
        }
        .subscriber-info p {
            color: #666;
            font-size: 14px;
        }
        .subscriber-info .tags {
            margin-top: 8px;
        }
        .tag {
            display: inline-block;
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 12px;
            margin-right: 5px;
        }
        .status {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .status.active {
            background: #e8f5e9;
            color: #2e7d32;
        }
        .status.inactive {
            background: #ffebee;
            color: #c62828;
        }
        .btn-delete {
            background: #ffebee;
            color: #c62828;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        }
        .btn-delete:hover {
            background: #ffcdd2;
        }
        .add-form {
            background: #f0f4ff;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }
        .add-form h3 {
            margin-bottom: 15px;
            color: #333;
        }
        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
        }
        .form-row input, .form-row select {
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
        }
        .logout-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌤️ 天气助理订阅管理</h1>
            <p>查看和管理所有订阅用户</p>
        </div>

        <!-- 登录表单 -->
        <div id="loginForm" class="login-form">
            <div id="loginError" class="error">密码错误，请重试</div>
            <div class="form-group">
                <label>🔐 管理密码</label>
                <input type="password" id="password" placeholder="请输入管理密码">
            </div>
            <button onclick="login()">登 录</button>
        </div>

        <!-- 订阅仪表盘 -->
        <div id="dashboard" class="dashboard">
            <button class="logout-btn" onclick="logout()">退出登录</button>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="number" id="totalCount">0</div>
                    <div class="label">总订阅数</div>
                </div>
                <div class="stat-card">
                    <div class="number" id="activeCount">0</div>
                    <div class="label">已启用</div>
                </div>
            </div>

            <div class="add-form">
                <h3>➕ 添加新订阅</h3>
                <div class="form-row">
                    <input type="email" id="newEmail" placeholder="邮箱地址">
                    <input type="text" id="newLocation" placeholder="位置 (如: 河北石家庄)">
                </div>
                <div class="form-row">
                    <input type="number" id="newLat" placeholder="纬度" step="0.01">
                    <input type="number" id="newLon" placeholder="经度" step="0.01">
                </div>
                <button onclick="addSubscriber()">添加订阅</button>
            </div>

            <h3>📋 订阅用户列表</h3>
            <div id="subscriberList" class="subscriber-list">
                <!-- 动态加载 -->
            </div>
        </div>
    </div>

    <script>
        let token = '';

        async function login() {
            const password = document.getElementById('password').value;
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const data = await res.json();
                if (data.success) {
                    token = data.token;
                    localStorage.setItem('token', token);
                    showDashboard();
                } else {
                    document.getElementById('loginError').style.display = 'block';
                }
            } catch (e) {
                document.getElementById('loginError').style.display = 'block';
            }
        }

        async function showDashboard() {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            await loadSubscribers();
        }

        async function loadSubscribers() {
            try {
                const res = await fetch('/api/subscribers', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();
                if (data.success) {
                    document.getElementById('totalCount').textContent = data.count;
                    document.getElementById('activeCount').textContent = 
                        data.subscribers.filter(s => s.enabled).length;
                    renderSubscribers(data.subscribers);
                }
            } catch (e) {
                console.error('加载失败', e);
            }
        }

        function renderSubscribers(subscribers) {
            const list = document.getElementById('subscriberList');
            list.innerHTML = subscribers.map(s => \`
                <div class="subscriber-item">
                    <div class="subscriber-info">
                        <h3>\${s.email}</h3>
                        <p>📍 \${s.location} (\${s.lat}, \${s.lon})</p>
                        <div class="tags">
                            \${s.alerts.map(a => \`<span class="tag">\${getAlertName(a)}</span>\`).join('')}
                        </div>
                    </div>
                    <div>
                        <span class="status \${s.enabled ? 'active' : 'inactive'}">
                            \${s.enabled ? '✅ 已启用' : '❌ 已禁用'}
                        </span>
                        <button class="btn-delete" onclick="deleteSubscriber('\${s.email}')">删除</button>
                    </div>
                </div>
            \`).join('');
        }

        function getAlertName(alert) {
            const names = {
                rain: '降雨',
                wind: '大风',
                temperature: '温度',
                severe: '极端天气'
            };
            return names[alert] || alert;
        }

        async function addSubscriber() {
            const email = document.getElementById('newEmail').value;
            const location = document.getElementById('newLocation').value;
            const lat = parseFloat(document.getElementById('newLat').value);
            const lon = parseFloat(document.getElementById('newLon').value);

            if (!email || !location || isNaN(lat) || isNaN(lon)) {
                alert('请填写完整信息');
                return;
            }

            try {
                const res = await fetch('/api/subscribers/add', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ email, location, lat, lon })
                });
                const data = await res.json();
                if (data.success) {
                    alert('添加成功！');
                    loadSubscribers();
                    document.getElementById('newEmail').value = '';
                    document.getElementById('newLocation').value = '';
                    document.getElementById('newLat').value = '';
                    document.getElementById('newLon').value = '';
                }
            } catch (e) {
                alert('添加失败');
            }
        }

        async function deleteSubscriber(email) {
            if (!confirm('确定要删除 ' + email + ' 的订阅吗？')) return;
            
            try {
                const res = await fetch('/api/subscribers/delete', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (data.success) {
                    alert('删除成功！');
                    loadSubscribers();
                }
            } catch (e) {
                alert('删除失败');
            }
        }

        function logout() {
            token = '';
            localStorage.removeItem('token');
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
        }

        // 自动登录
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            token = savedToken;
            showDashboard();
        }

        // 回车登录
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
    </script>
</body>
</html>`;
}
