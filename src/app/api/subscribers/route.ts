import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = 'weather@2024';
const SUBSCRIBERS_FILE = '/root/projects/myapp/weather-assistant/scripts/alert-users.json';

// 默认订阅用户
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

// 验证认证
function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  const token = auth.replace('Bearer ', '');
  return token === ADMIN_PASSWORD;
}

// GET - 获取订阅列表
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const fs = await import('fs');
    const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
    const subscribers = JSON.parse(data);
    return NextResponse.json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  } catch (e) {
    // 文件不存在时返回默认数据
    const subscribers = getDefaultSubscribers();
    return NextResponse.json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  }
}
