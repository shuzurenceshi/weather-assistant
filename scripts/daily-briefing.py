#!/usr/bin/env python3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import urllib.request
import os
from datetime import datetime

# 从环境变量读取配置
SMTP_USER = os.environ.get('SMTP_USER', '7961566@qq.com')
SMTP_PASS = os.environ.get('SMTP_PASS', '')

if not SMTP_PASS:
    print("❌ 错误: 请设置环境变量 SMTP_PASS")
    exit(1)

def send_morning_briefing(email, location, weather_data):
    """发送早间/中午天气播报邮件"""
    current = weather_data.get('current', {})
    daily = weather_data.get('daily', {})
    hourly = weather_data.get('hourly', {})
    
    # 当前天气
    temp = current.get('temperature_2m', 0)
    weather_code = current.get('weather_code', 0)
    feels_like = current.get('apparent_temperature', 0)
    humidity = current.get('relative_humidity_2m', 0)
    wind = current.get('wind_speed_10m', 0)
    
    # 今日温度范围
    high = daily.get('temperature_2m_max', [0])[0]
    low = daily.get('temperature_2m_min', [0])[0]
    
    # 紫外线指数
    uv_index = daily.get('uv_index_max', [0])[0]
    
    # 天气描述
    weather_map = {
        0: ('☀️', '晴朗'),
        1: ('🌤️', '晴间多云'),
        2: ('⛅', '多云'),
        3: ('☁️', '阴天'),
        45: ('🌫️', '雾'),
        48: ('🌫️', '雾凇'),
        51: ('🌧️', '小雨'),
        53: ('🌧️', '中雨'),
        55: ('🌧️', '大雨'),
        61: ('🌧️', '小雨'),
        63: ('🌧️', '中雨'),
        65: ('🌧️', '大雨'),
        71: ('🌨️', '小雪'),
        73: ('🌨️', '中雪'),
        75: ('🌨️', '大雪'),
        80: ('🌦️', '阵雨'),
        95: ('⛈️', '雷暴'),
    }
    icon, weather_name = weather_map.get(weather_code, ('🌤️', '未知'))
    
    # 降水概率
    current_hour = datetime.now().hour
    rain_prob = 0
    if len(hourly.get('precipitation_probability', [])) > current_hour:
        rain_prob = hourly['precipitation_probability'][current_hour]
    
    # 判断是早上还是中午
    hour = datetime.now().hour
    if hour < 12:
        greeting = "早上好"
        period = "今日天气"
    else:
        greeting = "中午好"
        period = "午后天气"
    
    # 创建邮件
    msg = MIMEMultipart('alternative')
    msg['From'] = SMTP_USER
    msg['To'] = email
    msg['Subject'] = f'🌤️ {greeting}！{location}天气播报'
    
    # HTML 内容
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; }}
            .header {{ text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }}
            .greeting {{ font-size: 28px; color: #333; }}
            .date {{ color: #666; font-size: 14px; margin-top: 5px; }}
            .weather-main {{ text-align: center; padding: 25px 0; }}
            .icon {{ font-size: 64px; }}
            .temp {{ font-size: 48px; color: #333; font-weight: bold; }}
            .weather-name {{ font-size: 18px; color: #666; }}
            .details {{ background: #f8f9fa; border-radius: 12px; padding: 15px; margin: 15px 0; }}
            .detail-item {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }}
            .detail-item:last-child {{ border-bottom: none; }}
            .label {{ color: #666; }}
            .value {{ color: #333; font-weight: 500; }}
            .advice {{ background: #e3f2fd; border-radius: 8px; padding: 12px; margin-top: 15px; }}
            .advice-text {{ color: #1565c0; font-size: 14px; }}
            .footer {{ text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="greeting">{greeting}！</div>
                <div class="date">{datetime.now().strftime('%Y年%m月%d日 %H:%M')}</div>
            </div>
            
            <div class="weather-main">
                <div class="icon">{icon}</div>
                <div class="temp">{temp}°C</div>
                <div class="weather-name">{weather_name}</div>
                <div style="color: #888; font-size: 14px;">📍 {location}</div>
            </div>
            
            <div class="details">
                <div class="detail-item">
                    <span class="label">🌡️ 今日温度</span>
                    <span class="value">{low}°C ~ {high}°C</span>
                </div>
                <div class="detail-item">
                    <span class="label">🤗 体感温度</span>
                    <span class="value">{feels_like}°C</span>
                </div>
                <div class="detail-item">
                    <span class="label">💧 湿度</span>
                    <span class="value">{humidity}%</span>
                </div>
                <div class="detail-item">
                    <span class="label">💨 风力</span>
                    <span class="value">{wind} km/h</span>
                </div>
                <div class="detail-item">
                    <span class="label">☀️ 紫外线</span>
                    <span class="value">{uv_index:.1f}</span>
                </div>
                <div class="detail-item">
                    <span class="label">☔ 降水概率</span>
                    <span class="value">{rain_prob}%</span>
                </div>
            </div>
            
            <div class="advice">
                <div class="advice-text">💡 点击访问 weather-assistant-aem.pages.dev 查看详细48小时预报</div>
            </div>
            
            <div class="footer">
                此邮件由天气助理自动发送<br>
                祝您有美好的一天！ ☀️
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    
    # 发送
    with smtplib.SMTP_SSL('smtp.qq.com', 465) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [email], msg.as_string())
    
    print(f"✅ 天气播报已发送到 {email}")
    return True

def fetch_weather(lat, lon):
    """获取天气数据"""
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max&timezone=auto&forecast_days=1"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"❌ 获取天气失败: {e}")
        return None

def main():
    print(f"🌤️ 天气播报开始...")
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
        
        send_morning_briefing(email, location, weather)
    
    print(f"\n✅ 天气播报完成")

if __name__ == '__main__':
    main()
