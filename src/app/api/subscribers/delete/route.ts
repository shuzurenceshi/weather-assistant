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

// POST - 删除订阅
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const email = body.email;

    // 读取现有数据
    let subscribers: any[] = [];
    try {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      subscribers = JSON.parse(data);
    } catch (e) {
      return NextResponse.json({ error: '无法读取订阅数据' }, { status: 500 });
    }

    // 过滤掉要删除的用户
    const newSubscribers = subscribers.filter(s => s.email !== email);
    
    if (newSubscribers.length === subscribers.length) {
      return NextResponse.json({ error: '未找到该订阅' }, { status: 404 });
    }

    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(newSubscribers, null, 2));

    return NextResponse.json({ success: true, message: '订阅已删除' });
  } catch (e) {
    console.error('删除订阅失败:', e);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
