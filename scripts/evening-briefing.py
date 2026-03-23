#!/usr/bin/env python3
"""
晚间天气播报 - 每天18:00发送
发送未来12小时天气预报
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import urllib.request
import os
from datetime import datetime, timedelta

SMTP_USER = os.environ.get('SMTP_USER', '7961566@qq.com')
SMTP_PASS = os.environ.get('SMTP_PASS', '')

if not SMTP_PASS:
    print("❌ 错误: 请设置环境变量 SMTP_PASS")
    exit(1)

def send_evening_briefing(email, location, weather_data):
    """发送晚间天气播报邮件"""
    hourly = weather_data.get('hourly', {})
    daily = weather_data.get('daily', {})
    
    # 获取未来12小时数据
    current_hour = datetime.now().hour
    hours_to_show = 12
    
    # 构建小时预报
    hourly_forecast = []
    for i in range(hours_to_show):
        hour_index = current_hour + i
        if hour_index < len(hourly.get('time', [])):
            time_str = hourly['time'][hour_index][-5:]  # HH:MM
            temp = hourly.get('temperature_2m', [0])[hour_index]
            rain_prob = hourly.get('precipitation_probability', [0])[hour_index]
            weather_code = hourly.get('weather_code', [0])[hour_index]
            
            # 天气图标
            weather_map = {
                0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
                45: '🌫️', 48: '🌫️',
                51: '🌧️', 53: '🌧️', 55: '🌧️',
                61: '🌧️', 63: '🌧️', 65: '🌧️',
                71: '🌨️', 73: '🌨️', 75: '🌨️',
                80: '🌦️', 95: '⛈️',
            }
            icon = weather_map.get(weather_code, '🌤️')
            
            hourly_forecast.append({
                'time': time_str,
                'temp': temp,
                'rain': rain_prob,
                'icon': icon
            })
    
    # 明天天气
    tomorrow_high = daily.get('temperature_2m_max', [0, 0])[1] if len(daily.get('temperature_2m_max', [])) > 1 else 0
    tomorrow_low = daily.get('temperature_2m_min', [0, 0])[1] if len(daily.get('temperature_2m_min', [])) > 1 else 0
    tomorrow_code = daily.get('weather_code', [0, 0])[1] if len(daily.get('weather_code', [])) > 1 else 0
    
    weather_map = {
        0: ('☀️', '晴朗'), 1: ('🌤️', '晴间多云'), 2: ('⛅', '多云'), 3: ('☁️', '阴天'),
        45: ('🌫️', '雾'), 48: ('🌫️', '雾凇'),
        51: ('🌧️', '小雨'), 53: ('🌧️', '中雨'), 55: ('🌧️', '大雨'),
        61: ('🌧️', '小雨'), 63: ('🌧️', '中雨'), 65: ('🌧️', '大雨'),
        71: ('🌨️', '小雪'), 73: ('🌨️', '中雪'), 75: ('🌨️', '大雪'),
        80: ('🌦️', '阵雨'), 95: ('⛈️', '雷暴'),
    }
    tomorrow_icon, tomorrow_name = weather_map.get(tomorrow_code, ('🌤️', '未知'))
    
    # 创建邮件
    msg = MIMEMultipart('alternative')
    msg['From'] = SMTP_USER
    msg['To'] = email
    msg['Subject'] = f'🌙 晚间天气播报 - {location}'
    
    # 构建小时预报 HTML
    hourly_html = ''
    for h in hourly_forecast:
        rain_color = '#2196F3' if h['rain'] > 50 else '#4CAF50' if h['rain'] > 20 else '#9E9E9E'
        hourly_html += f'''
        <div style="display:inline-block;text-align:center;padding:10px;margin:5px;background:#f5f5f5;border-radius:10px;">
            <div style="font-size:12px;color:#666;">{h['time']}</div>
            <div style="font-size:24px;">{h['icon']}</div>
            <div style="font-size:16px;font-weight:bold;">{h['temp']}°</div>
            <div style="font-size:11px;color:{rain_color};">💧{h['rain']}%</div>
        </div>'''
    
    html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 25px; }}
            .header {{ text-align: center; padding-bottom: 15px; border-bottom: 1px solid #eee; }}
            .title {{ font-size: 22px; color: #333; }}
            .time {{ color: #666; font-size: 13px; margin-top: 5px; }}
            .location {{ color: #888; font-size: 12px; }}
            .section {{ margin: 20px 0; }}
            .section-title {{ font-size: 15px; color: #333; font-weight: 600; margin-bottom: 10px; }}
            .hourly {{ text-align: center; white-space: nowrap; overflow-x: auto; }}
            .tomorrow {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 15px; text-align: center; }}
            .footer {{ text-align: center; padding-top: 15px; border-top: 1px solid #eee; color: #999; font-size: 11px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="title">🌙 晚间天气播报</div>
                <div class="time">{datetime.now().strftime('%Y年%m月%d日 %H:%M')}</div>
                <div class="location">📍 {location}</div>
            </div>
            
            <div class="section">
                <div class="section-title">📊 未来12小时预报</div>
                <div class="hourly">
                    {hourly_html}
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📅 明日天气</div>
                <div class="tomorrow">
                    <div style="font-size: 32px;">{tomorrow_icon}</div>
                    <div style="font-size: 16px; margin: 8px 0;">{tomorrow_name}</div>
                    <div style="font-size: 14px;">{tomorrow_low}°C ~ {tomorrow_high}°C</div>
                </div>
            </div>
            
            <div class="footer">
                此邮件由天气助理自动发送<br>
                祝您晚安！ 🌙
            </div>
        </div>
    </body>
    </html>
    '''
    
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    
    # 发送
    with smtplib.SMTP_SSL('smtp.qq.com', 465) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [email], msg.as_string())
    
    print(f"✅ 晚间播报已发送到 {email}")
    return True

def fetch_weather(lat, lon):
    """获取天气数据"""
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=2"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"❌ 获取天气失败: {e}")
        return None

def main():
    print(f"🌙 晚间天气播报开始...")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # 读取用户配置
    try:
        with open('/root/projects/myapp/weather-assistant/scripts/alert-users.json', 'r') as f:
            users = json.load(f)
    except Exception as e:
        print(f"❌ 无法读取用户配置: {e}")
        return
    
    for user in users:
        if not user.get('enabled', False):
            continue
        
        email = user['email']
        location = user['location']
        lat = user['lat']
        lon = user['lon']
        
        print(f"发送给: {email}")
        print(f"位置: {location}")
        
        weather = fetch_weather(lat, lon)
        if not weather:
            print("❌ 获取天气失败")
            continue
        
        send_evening_briefing(email, location, weather)
    
    print(f"\n✅ 晚间播报完成")

if __name__ == '__main__':
    main()
