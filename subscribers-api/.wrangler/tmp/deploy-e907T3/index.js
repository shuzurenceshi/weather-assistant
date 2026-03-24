var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.js
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "weather@2024";
    const KV = env.SUBSCRIBERS_KV;
    const SMTP_USER = env.SMTP_USER || "7961566@qq.com";
    const SMTP_PASS = env.SMTP_PASS || "bxdmwoxuiceobjjg";
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    function checkAuth(request2) {
      const auth = request2.headers.get("Authorization");
      if (!auth) return false;
      const token = auth.replace("Bearer ", "");
      return token === ADMIN_PASSWORD;
    }
    __name(checkAuth, "checkAuth");
    async function getSubscribers() {
      if (KV) {
        const data = await KV.get("subscribers", "json");
        if (data) return data;
      }
      return [];
    }
    __name(getSubscribers, "getSubscribers");
    async function saveSubscribers(subscribers) {
      if (KV) {
        await KV.put("subscribers", JSON.stringify(subscribers));
      }
    }
    __name(saveSubscribers, "saveSubscribers");
    if (path === "/" || path === "/index.html") {
      return new Response(getAdminPage(), {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders }
      });
    }
    if (path === "/api/login" && request.method === "POST") {
      const body = await request.json();
      if (body.password === ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ success: true, token: ADMIN_PASSWORD }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      return new Response(JSON.stringify({ success: false, error: "\u5BC6\u7801\u9519\u8BEF" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/subscribers") {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const subscribers = await getSubscribers();
      return new Response(JSON.stringify({
        success: true,
        count: subscribers.length,
        subscribers
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/subscribers/add" && request.method === "POST") {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const body = await request.json();
      if (!body.email || !body.location) {
        return new Response(JSON.stringify({ error: "\u8BF7\u586B\u5199\u90AE\u7BB1\u548C\u4F4D\u7F6E" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const newSubscriber = {
        email: body.email,
        location: body.location,
        lat: body.lat || 0,
        lon: body.lon || 0,
        enabled: true,
        alerts: body.alerts || ["rain", "wind", "temperature", "severe"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      };
      let subscribers = await getSubscribers();
      if (subscribers.some((s) => s.email === newSubscriber.email)) {
        return new Response(JSON.stringify({ error: "\u8BE5\u90AE\u7BB1\u5DF2\u8BA2\u9605" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      subscribers.push(newSubscriber);
      await saveSubscribers(subscribers);
      return new Response(JSON.stringify({
        success: true,
        message: "\u8BA2\u9605\u5DF2\u6DFB\u52A0",
        subscriber: newSubscriber
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/subscribers/delete" && request.method === "POST") {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const body = await request.json();
      let subscribers = await getSubscribers();
      subscribers = subscribers.filter((s) => s.email !== body.email);
      await saveSubscribers(subscribers);
      return new Response(JSON.stringify({ success: true, message: "\u8BA2\u9605\u5DF2\u5220\u9664" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/public/subscribe" && request.method === "POST") {
      const body = await request.json();
      if (!body.email || !body.location) {
        return new Response(JSON.stringify({ error: "\u8BF7\u586B\u5199\u90AE\u7BB1\u548C\u4F4D\u7F6E" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return new Response(JSON.stringify({ error: "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1\u5730\u5740" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const newSubscriber = {
        email: body.email.toLowerCase(),
        location: body.location,
        lat: body.lat || 0,
        lon: body.lon || 0,
        enabled: true,
        alerts: body.alerts || ["rain", "wind", "temperature", "severe"],
        createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        source: "website"
      };
      let subscribers = await getSubscribers();
      const existingIndex = subscribers.findIndex((s) => s.email === newSubscriber.email);
      if (existingIndex >= 0) {
        subscribers[existingIndex] = { ...subscribers[existingIndex], ...newSubscriber };
        await saveSubscribers(subscribers);
        return new Response(JSON.stringify({
          success: true,
          message: "\u8BA2\u9605\u4FE1\u606F\u5DF2\u66F4\u65B0",
          subscriber: { email: newSubscriber.email, location: newSubscriber.location }
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      subscribers.push(newSubscriber);
      await saveSubscribers(subscribers);
      return new Response(JSON.stringify({
        success: true,
        message: "\u8BA2\u9605\u6210\u529F",
        subscriber: { email: newSubscriber.email, location: newSubscriber.location }
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/public/unsubscribe" && request.method === "POST") {
      const body = await request.json();
      if (!body.email) {
        return new Response(JSON.stringify({ error: "\u8BF7\u63D0\u4F9B\u90AE\u7BB1\u5730\u5740" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      let subscribers = await getSubscribers();
      const initialLength = subscribers.length;
      subscribers = subscribers.filter((s) => s.email.toLowerCase() !== body.email.toLowerCase());
      if (subscribers.length === initialLength) {
        return new Response(JSON.stringify({ error: "\u8BE5\u90AE\u7BB1\u672A\u8BA2\u9605" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      await saveSubscribers(subscribers);
      return new Response(JSON.stringify({
        success: true,
        message: "\u9000\u8BA2\u6210\u529F"
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (path === "/api/test-email" && request.method === "POST") {
      if (!checkAuth(request)) {
        return new Response(JSON.stringify({ error: "\u672A\u6388\u6743" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const body = await request.json();
      const email = body.email;
      if (!email) {
        return new Response(JSON.stringify({ error: "\u8BF7\u63D0\u4F9B\u90AE\u7BB1\u5730\u5740" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      return new Response(JSON.stringify({
        success: true,
        message: "\u6D4B\u8BD5\u90AE\u4EF6\u5DF2\u8BF7\u6C42\uFF0C\u8BF7\u7A0D\u540E\u68C0\u67E5\u90AE\u7BB1",
        note: "\u90AE\u4EF6\u5C06\u4ECE\u670D\u52A1\u5668\u53D1\u9001"
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    return new Response("Not Found", { status: 404 });
  }
};
function getAdminPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>\u5929\u6C14\u52A9\u7406 - \u8BA2\u9605\u7BA1\u7406</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            overflow-x: hidden;
        }
        .container { padding: 20px; max-width: 600px; margin: 0 auto; }
        .card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 20px 0; color: white; }
        .header h1 { font-size: 24px; margin-bottom: 8px; }
        .header p { opacity: 0.8; font-size: 14px; }
        .stats { display: flex; gap: 12px; margin-bottom: 16px; }
        .stat-card { flex: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 12px; text-align: center; }
        .stat-card .number { font-size: 28px; font-weight: bold; }
        .stat-card .label { font-size: 12px; opacity: 0.9; }
        .form-title { font-weight: 600; margin-bottom: 12px; color: #333; }
        .form-row { margin-bottom: 8px; }
        .form-row input { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 14px; }
        .form-row input:focus { outline: none; border-color: #667eea; }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 8px; }
        .btn-primary { background: #667eea; color: white; }
        .btn-primary:hover { background: #5a6fd6; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: #f0f0f0; color: #333; }
        .btn-danger { background: #fee; color: #c00; }
        .btn-success { background: #efe; color: #060; }
        .subscriber-list { max-height: 300px; overflow-y: auto; }
        .subscriber-item { background: #f8f9fa; border-radius: 12px; padding: 12px; margin-bottom: 8px; }
        .subscriber-item .email { font-weight: 500; color: #333; }
        .subscriber-item .location { font-size: 12px; color: #666; margin-top: 4px; }
        .subscriber-item .actions { display: flex; gap: 8px; margin-top: 8px; }
        .subscriber-item .actions button { flex: 1; padding: 8px; font-size: 12px; border-radius: 6px; border: none; cursor: pointer; }
        .loading { text-align: center; padding: 20px; color: #666; }
        .error { background: #fee; color: #c00; padding: 10px; border-radius: 8px; margin-bottom: 12px; }
        .success { background: #efe; color: #060; padding: 10px; border-radius: 8px; margin-bottom: 12px; }
        .login-form input { width: 100%; padding: 14px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 16px; margin-bottom: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>\u{1F324}\uFE0F \u5929\u6C14\u52A9\u7406</h1>
            <p>\u8BA2\u9605\u7BA1\u7406\u540E\u53F0</p>
        </div>

        <div id="loginSection" class="card">
            <div class="form-title">\u{1F510} \u7BA1\u7406\u5458\u767B\u5F55</div>
            <div id="loginError" class="error" style="display:none"></div>
            <input type="password" id="password" placeholder="\u8BF7\u8F93\u5165\u7BA1\u7406\u5BC6\u7801">
            <button class="btn btn-primary" onclick="login()">\u767B\u5F55</button>
        </div>

        <div id="adminSection" style="display:none">
            <div class="stats">
                <div class="stat-card">
                    <div class="number" id="totalCount">0</div>
                    <div class="label">\u603B\u8BA2\u9605</div>
                </div>
                <div class="stat-card">
                    <div class="number" id="activeCount">0</div>
                    <div class="label">\u5DF2\u542F\u7528</div>
                </div>
            </div>

            <div class="card">
                <div class="form-title">\u2795 \u6DFB\u52A0\u8BA2\u9605</div>
                <div id="addError" class="error" style="display:none"></div>
                <div id="addSuccess" class="success" style="display:none"></div>
                <div class="form-row">
                    <input type="email" id="newEmail" placeholder="\u90AE\u7BB1\u5730\u5740">
                </div>
                <div class="form-row">
                    <input type="text" id="newLocation" placeholder="\u4F4D\u7F6E\uFF08\u5982\uFF1A\u5E7F\u5DDE\uFF09">
                </div>
                <button class="btn btn-primary" id="addBtn" onclick="addSubscriber()">\u6DFB\u52A0\u8BA2\u9605</button>
            </div>

            <div class="card">
                <div class="form-title">\u{1F4CB} \u8BA2\u9605\u5217\u8868</div>
                <div id="subscriberList" class="subscriber-list">
                    <div class="loading">\u52A0\u8F7D\u4E2D...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let token = '';

        async function login() {
            const pwd = document.getElementById('password').value;
            try {
                const res = await fetch('/api/login', {
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
                    document.getElementById('loginError').textContent = data.error || '\u5BC6\u7801\u9519\u8BEF';
                    document.getElementById('loginError').style.display = 'block';
                }
            } catch (e) {
                document.getElementById('loginError').textContent = '\u7F51\u7EDC\u9519\u8BEF: ' + e.message;
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
                const res = await fetch('/api/subscribers', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await res.json();
                if (data.success) {
                    document.getElementById('totalCount').textContent = data.count;
                    document.getElementById('activeCount').textContent = data.subscribers.filter(s => s.enabled).length;
                    renderList(data.subscribers);
                }
            } catch (e) {
                document.getElementById('subscriberList').innerHTML = '<div class="error">\u52A0\u8F7D\u5931\u8D25: ' + e.message + '</div>';
            }
        }

        function renderList(subscribers) {
            if (subscribers.length === 0) {
                document.getElementById('subscriberList').innerHTML = '<div class="loading">\u6682\u65E0\u8BA2\u9605</div>';
                return;
            }
            const html = subscribers.map(s => \`
                <div class="subscriber-item">
                    <div class="email">\${s.email}</div>
                    <div class="location">\u{1F4CD} \${s.location}</div>
                    <div class="actions">
                        <button class="btn-success" onclick="testEmail('\${s.email}')">\u{1F4E7} \u6D4B\u8BD5</button>
                        <button class="btn-danger" onclick="deleteSubscriber('\${s.email}')">\u{1F5D1}\uFE0F \u5220\u9664</button>
                    </div>
                </div>
            \`).join('');
            document.getElementById('subscriberList').innerHTML = html;
        }

        async function addSubscriber() {
            const email = document.getElementById('newEmail').value.trim();
            const location = document.getElementById('newLocation').value.trim();
            
            if (!email || !location) {
                document.getElementById('addError').textContent = '\u8BF7\u586B\u5199\u90AE\u7BB1\u548C\u4F4D\u7F6E';
                document.getElementById('addError').style.display = 'block';
                return;
            }

            document.getElementById('addError').style.display = 'none';
            document.getElementById('addSuccess').style.display = 'none';
            document.getElementById('addBtn').disabled = true;
            document.getElementById('addBtn').textContent = '\u5904\u7406\u4E2D...';

            try {
                // \u83B7\u53D6\u7ECF\u7EAC\u5EA6
                let lat = 0, lon = 0, fullLocation = location;
                try {
                    const geoRes = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(location) + '&count=1&language=zh');
                    const geoData = await geoRes.json();
                    if (geoData.results && geoData.results.length > 0) {
                        const r = geoData.results[0];
                        lat = r.latitude;
                        lon = r.longitude;
                        fullLocation = (r.admin1 || '') + r.name;
                    }
                } catch (geoErr) {
                    console.log('\u5730\u7406\u7F16\u7801\u5931\u8D25\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u5750\u6807');
                }

                // \u6DFB\u52A0\u8BA2\u9605
                const res = await fetch('/api/subscribers/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ email, location: fullLocation, lat, lon })
                });
                const data = await res.json();
                
                if (data.success) {
                    document.getElementById('addSuccess').textContent = '\u2705 \u6DFB\u52A0\u6210\u529F: ' + fullLocation;
                    document.getElementById('addSuccess').style.display = 'block';
                    document.getElementById('newEmail').value = '';
                    document.getElementById('newLocation').value = '';
                    loadSubscribers();
                } else {
                    document.getElementById('addError').textContent = data.error || '\u6DFB\u52A0\u5931\u8D25';
                    document.getElementById('addError').style.display = 'block';
                }
            } catch (e) {
                document.getElementById('addError').textContent = '\u6DFB\u52A0\u5931\u8D25: ' + e.message;
                document.getElementById('addError').style.display = 'block';
            } finally {
                document.getElementById('addBtn').disabled = false;
                document.getElementById('addBtn').textContent = '\u6DFB\u52A0\u8BA2\u9605';
            }
        }

        async function deleteSubscriber(email) {
            if (!confirm('\u786E\u5B9A\u5220\u9664 ' + email + ' ?')) return;
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
                    loadSubscribers();
                } else {
                    alert(data.error || '\u5220\u9664\u5931\u8D25');
                }
            } catch (e) {
                alert('\u5220\u9664\u5931\u8D25: ' + e.message);
            }
        }

        async function testEmail(email) {
            if (!confirm('\u53D1\u9001\u6D4B\u8BD5\u90AE\u4EF6\u5230 ' + email + ' ?')) return;
            
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '\u53D1\u9001\u4E2D...';
            
            try {
                const res = await fetch('/api/test-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ email })
                });
                const data = await res.json();
                alert(data.message || '\u6D4B\u8BD5\u5DF2\u89E6\u53D1');
            } catch (e) {
                alert('\u8BF7\u6C42\u5931\u8D25: ' + e.message);
            } finally {
                btn.disabled = false;
                btn.textContent = '\u{1F4E7} \u6D4B\u8BD5';
            }
        }

        // \u81EA\u52A8\u767B\u5F55
        const savedToken = localStorage.getItem('adminToken');
        if (savedToken) {
            token = savedToken;
            showAdmin();
        }

        // \u56DE\u8F66\u767B\u5F55
        document.getElementById('password').addEventListener('keypress', e => {
            if (e.key === 'Enter') login();
        });
    <\/script>
</body>
</html>`;
}
__name(getAdminPage, "getAdminPage");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
