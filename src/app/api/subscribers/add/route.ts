import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';

const ADMIN_PASSWORD = 'weather@2024';
const SUBSCRIBERS_FILE = '/root/projects/myapp/weather-assistant/scripts/alert-users.json';

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  const token = auth.replace('Bearer ', '');
  return token === ADMIN_PASSWORD;
}

// POST - 添加订阅
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newSubscriber = {
      email: body.email,
      location: body.location,
      lat: body.lat,
      lon: body.lon,
      enabled: true,
      alerts: body.alerts || ['rain', 'wind', 'temperature', 'severe'],
    };

    // 读取现有数据
    let subscribers: any[] = [];
    try {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      subscribers = JSON.parse(data);
    } catch (e) {
      // 文件不存在，使用空数组
    }

    // 检查是否已存在
    if (subscribers.some(s => s.email === newSubscriber.email)) {
      return NextResponse.json({ error: '该邮箱已订阅' }, { status: 400 });
    }

    subscribers.push(newSubscriber);
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));

    return NextResponse.json({ success: true, message: '订阅已添加' });
  } catch (e) {
    console.error('添加订阅失败:', e);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}
