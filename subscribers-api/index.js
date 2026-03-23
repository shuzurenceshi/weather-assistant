/**
 * 订阅用户管理 API
 * 使用 Cloudflare KV 持久化存储
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || 'weather@2024';
    const KV = env.SUBSCRIBERS_KV;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    function checkAuth(request) {
      const auth = request.headers.get('Authorization');
      if (!auth) return false;
      const token = auth.replace('Bearer ', '');
      return token === ADMIN_PASSWORD;
    }

    // 获取订阅列表（从服务器文件读取）
    async function getSubscribers() {
      try {
        // 优先从 KV 读取
        if (KV) {
          const data = await KV.get('subscribers', 'json');
          if (data) return data;
        }
        // 备用：硬编码默认数据
        return getDefaultSubscribers();
      } catch (e) {
        return getDefaultSubscribers();
      }
    }

    // 保存订阅列表
    async function saveSubscribers(subscribers) {
      if (KV) {
        await KV.put('subscribers', JSON.stringify(subscribers));
      }
      // 同时写入服务器文件（通过内部 API 或直接文件操作）
      // 这里 KV 是主要存储
    }

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

    // 主页
    if (path === '/' || path === '/index.html') {
      return new Response(getAdminPage(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders }
      });
    }

    // 登录
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

    // 获取订阅列表
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
        subscribers
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 添加订阅
    if (path === '/api/subscribers/add' && request.method === 'POST') {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: '未授权' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const body = await request.json();
      
      // 检查必填字段
      if (!body.email || !body.location) {
        return new Response(JSON.stringify({ error: '请填写邮箱和位置' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const newSubscriber = {
        email: body.email,
        location: body.location,
        lat: body.lat || 0,
        lon: body.lon || 0,
        enabled: true,
        alerts: body.alerts || ["rain", "wind", "temperature", "severe"],
        createdAt: new Date().toISOString().split('T')[0]
      };

      let subscribers = await getSubscribers();
      
      // 检查是否已存在
      if (subscribers.some(s => s.email === newSubscriber.email)) {
        return new Response(JSON.stringify({ error: '该邮箱已订阅' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      subscribers.push(newSubscriber);
      await saveSubscribers(subscribers);

      return new Response(JSON.stringify({ 
        success: true, 
        message: '订阅已添加',
        subscriber: newSubscriber 
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 删除订阅
    if (path === '/api/subscribers/delete' && request.method === 'POST') {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: '未授权' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const body = await request.json();
      let subscribers = await getSubscribers();
      const originalLength = subscribers.length;
      subscribers = subscribers.filter(s => s.email !== body.email);

      if (subscribers.length === originalLength) {
        return new Response(JSON.stringify({ error: '未找到该订阅' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      await saveSubscribers(subscribers);

      return new Response(JSON.stringify({ success: true, message: '订阅已删除' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // 测试发送（给指定邮箱发送测试邮件）
    if (path === '/api/test-email' && request.method === 'POST') {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: '未授权' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const body = await request.json();
      const email = body.email;
      
      if (!email) {
        return new Response(JSON.stringify({ error: '请提供邮箱地址' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 返回测试命令
      return new Response(JSON.stringify({ 
        success: true, 
        message: '测试邮件功能需要在服务器执行',
        command: `ssh root@server "cd /root/projects/myapp/weather-assistant/scripts && python3 test-email.py ${email}"`
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

function getAdminPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>天气助理 - 订阅管理</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            overflow-x: hidden;
        }
        .container {
            padding: 20px;
            padding-bottom: 40px;
            max-width: 600px;
            margin: 0 auto;
        }
        .card {
            background: white;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            color: white;
        }
        .header h1 { font-size: 24px; margin-bottom: 8px; }
        .header p { opacity: 0.8; font-size: 14px; }
        
        .stats {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }
        .stat-card {
            flex: 1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
        }
        .stat-card .number { font-size: 28px; font-weight: bold; }
        .stat-card .label { font-size: 12px; opacity: 0.9; }
        
        .form-title { font-weight: 600; margin-bottom: 12px; color: #333; }
        .form-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .form-row input {
            flex: 1;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
        }
        .form-row input:focus { outline: none; border-color: #667eea; }
        
        .btn {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary { background: #667eea; color: white; }
        .btn-primary:hover { background: #5a6fd6; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: #f0f0f0; color: #333; }
        .btn-secondary:hover { background: #e0e0e0; }
        .btn-danger { background: #fee; color: #c00; }
        
        .subscriber-list { max-height: 300px; overflow-y: auto; }
        .subscriber-item {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 8px;
        }
        .subscriber-item .email { font-weight: 500; color: #333; }
        .subscriber-item .location { font-size: 12px; color: #666; margin-top: 4px; }
        .subscriber-item .actions { 
            display: flex; 
            gap: 8px; 
            margin-top: 8px; 
        }
        .subscriber-item .actions button {
            padding: 6px 12px;
            font-size: 12px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
        }
        
        .loading { text-align: center; padding: 20px; color: #666; }
        .error { background: #fee; color: #c00; padding: 10px; border-radius: 8px; margin-bottom: 12px; }
        .success { background: #efe; color: #060; padding: 10px; border-radius: 8px; margin-bottom: 12px; }
        
        .login-form input {
            width: 100%;
            padding: 14px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            margin-bottom: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌤️ 天气助理</h1>
            <p>订阅管理后台</p>
        </div>

        <!-- 登录表单 -->
        <div id="loginSection" class="card">
            <div class="form-title">🔐 管理员登录</div>
            <div id="loginError" class="error" style="display:none"></div>
            <input type="password" id="password" placeholder="请输入管理密码">
            <button class="btn btn-primary" onclick="login()">登录</button>
        </div>

        <!-- 管理面板 -->
        <div id="adminSection" style="display:none">
            <!-- 统计 -->
            <div class="stats">
                <div class="stat-card">
                    <div class="number" id="totalCount">0</div>
                    <div class="label">总订阅</div>
                </div>
                <div class="stat-card">
                    <div class="number" id="activeCount">0</div>
                    <div class="label">已启用</div>
                </div>
            </div>

            <!-- 添加订阅 -->
            <div class="card">
                <div class="form-title">➕ 添加订阅</div>
                <div id="addError" class="error" style="display:none"></div>
                <div id="addSuccess" class="success" style="display:none"></div>
                <div class="form-row">
                    <input type="email" id="newEmail" placeholder="邮箱地址">
                </div>
                <div class="form-row">
                    <input type="text" id="newLocation" placeholder="位置（如：石家庄）">
                </div>
                <button class="btn btn-primary" id="addBtn" onclick="addSubscriber()">添加订阅</button>
            </div>

            <!-- 订阅列表 -->
            <div class="card">
                <div class="form-title">📋 订阅列表</div>
                <div id="subscriberList" class="subscriber-list">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API = '';
        let token = '';

        async function login() {
            const pwd = document.getElementById('password').value;
            try {
                const res = await fetch(API + '/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: pwd })
                });
                const data = await res.json();
                if (data.success) {
                    token = data.token;
                    localStorage.setItem('adminToken', token);
                    showAdmin();
                } else {
                    document.getElementById('loginError').textContent = data.error || '密码错误';
                    document.getElementById('loginError').style.display = 'block';
                }
            } catch (e) {
                document.getElementById('loginError').textContent = '网络错误';
                document.getElementById('loginError').style.display = 'block';
            }
        }

        function showAdmin() {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('adminSection').style.display = 'block';
            loadSubscribers();
        }

        async function loadSubscribers() {
            try {
                const res = await fetch(API + '/api/subscribers', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();
                if (data.success) {
                    document.getElementById('totalCount').textContent = data.count;
                    document.getElementById('activeCount').textContent = 
                        data.subscribers.filter(s => s.enabled).length;
                    renderList(data.subscribers);
                }
            } catch (e) {
                document.getElementById('subscriberList').innerHTML = 
                    '<div class="error">加载失败</div>';
            }
        }

        function renderList(subscribers) {
            if (subscribers.length === 0) {
                document.getElementById('subscriberList').innerHTML = 
                    '<div class="loading">暂无订阅</div>';
                return;
            }
            
            const html = subscribers.map(s => \`
                <div class="subscriber-item">
                    <div class="email">\${s.email}</div>
                    <div class="location">📍 \${s.location}</div>
                    <div class="actions">
                        <button class="btn-secondary" onclick="testEmail('\${s.email}')">测试</button>
                        <button class="btn-danger" onclick="deleteSubscriber('\${s.email}')">删除</button>
                    </div>
                </div>
            \`).join('');
            
            document.getElementById('subscriberList').innerHTML = html;
        }

        async function addSubscriber() {
            const email = document.getElementById('newEmail').value.trim();
            const location = document.getElementById('newLocation').value.trim();
            
            if (!email || !location) {
                document.getElementById('addError').textContent = '请填写邮箱和位置';
                document.getElementById('addError').style.display = 'block';
                return;
            }

            document.getElementById('addError').style.display = 'none';
            document.getElementById('addSuccess').style.display = 'none';
            document.getElementById('addBtn').disabled = true;
            document.getElementById('addBtn').textContent = '查找位置...';

            try {
                // 先获取经纬度
                const geoRes = await fetch(
                    'https://geocoding-api.open-meteo.com/v1/search?name=' + 
                    encodeURIComponent(location) + '&count=1&language=zh'
                );
                const geoData = await geoRes.json();
                
                let lat = 0, lon = 0, fullLocation = location;
                if (geoData.results && geoData.results.length > 0) {
                    const r = geoData.results[0];
                    lat = r.latitude;
                    lon = r.longitude;
                    fullLocation = r.admin1 ? r.admin1 + r.name : r.name;
                }

                // 添加订阅
                const res = await fetch(API + '/api/subscribers/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        email: email,
                        location: fullLocation,
                        lat: lat,
                        lon: lon
                    })
                });
                const data = await res.json();
                
                if (data.success) {
                    document.getElementById('addSuccess').textContent = 
                        '添加成功！位置: ' + fullLocation;
                    document.getElementById('addSuccess').style.display = 'block';
                    document.getElementById('newEmail').value = '';
                    document.getElementById('newLocation').value = '';
                    loadSubscribers();
                } else {
                    document.getElementById('addError').textContent = data.error || '添加失败';
                    document.getElementById('addError').style.display = 'block';
                }
            } catch (e) {
                document.getElementById('addError').textContent = '添加失败: ' + e.message;
                document.getElementById('addError').style.display = 'block';
            } finally {
                document.getElementById('addBtn').disabled = false;
                document.getElementById('addBtn').textContent = '添加订阅';
            }
        }

        async function deleteSubscriber(email) {
            if (!confirm('确定删除 ' + email + ' ?')) return;
            
            try {
                const res = await fetch(API + '/api/subscribers/delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (data.success) {
                    loadSubscribers();
                } else {
                    alert(data.error || '删除失败');
                }
            } catch (e) {
                alert('删除失败');
            }
        }

        async function testEmail(email) {
            if (!confirm('发送测试邮件到 ' + email + ' ?')) return;
            
            try {
                const res = await fetch(API + '/api/test-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                alert(data.message || '测试功能已触发');
            } catch (e) {
                alert('请求失败');
            }
        }

        // 自动登录
        const savedToken = localStorage.getItem('adminToken');
        if (savedToken) {
            token = savedToken;
            showAdmin();
        }

        // 回车登录
        document.getElementById('password').addEventListener('keypress', e => {
            if (e.key === 'Enter') login();
        });
    </script>
</body>
</html>`;
}
