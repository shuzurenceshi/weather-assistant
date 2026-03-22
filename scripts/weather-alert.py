#!/usr/bin/env python3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import urllib.request
import sys
import os
from datetime import datetime

# 从环境变量读取配置
SMTP_USER = os.environ.get('SMTP_USER', '7961566@qq.com')
SMTP_PASS = os.environ.get('SMTP_PASS', '')

if not SMTP_PASS:
    print("❌ 错误: 请设置环境变量 SMTP_PASS")
    sys.exit(1)

def send_email(to_email, alert_type, message, location):
    """发送预警邮件"""
    try:
        # 创建邮件
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = f'【天气预警】{alert_type} - {location}'
        
        # 邮件内容
        level_emoji = '🚨' if '高温' in alert_type or '暴雨' in alert_type else '⚠️'
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; }}
                .header {{ text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }}
                .icon {{ font-size: 48px; }}
                .title {{ color: #333; font-size: 24px; margin-top: 10px; }}
                .alert-box {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin: 15px 0; }}
                .footer {{ text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon">{level_emoji}</div>
                    <div class="title">{alert_type}</div>
                    <div style="color: #666; font-size: 14px;">📍 {location}</div>
                </div>
                <div class="content">
                    <div class="alert-box">
                        {message}
                    </div>
                </div>
                <div class="footer">
                    此邮件由天气助理自动发送<br>
                    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))
        
        # 发送
        with smtplib.SMTP_SSL('smtp.qq.com', 465) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
        
        print(f"✅ 邮件已发送到 {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ 发送邮件失败: {e}")
        return False

def fetch_weather(lat, lon):
    """获取天气数据"""
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation&hourly=precipitation_probability,precipitation&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max&timezone=auto&forecast_days=2"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"❌ 获取天气失败: {e}")
        return None

def check_alerts(weather):
    """检查天气预警"""
    alerts = []
    current = weather.get('current', {})
    hourly = weather.get('hourly', {})
    
    temp = current.get('temperature_2m', 0)
    precipitation = current.get('precipitation', 0)
    wind_speed = current.get('wind_speed_10m', 0)
    
    # 暴雨预警
    if precipitation > 20:
        alerts.append({
            'type': '暴雨预警',
            'message': f'当前降水量已达 {precipitation}mm，请注意防涝，减少外出！'
        })
    
    # 大风预警
    if wind_speed > 50:
        alerts.append({
            'type': '大风预警',
            'message': f'当前风速 {wind_speed}km/h，外出请注意安全！'
        })
    
    # 高温预警
    if temp > 38:
        alerts.append({
            'type': '高温预警',
            'message': f'当前气温 {temp}°C，请避免户外活动，注意防暑！'
        })
    
    # 寒潮预警
    if temp < -5:
        alerts.append({
            'type': '寒潮预警',
            'message': f'当前气温 {temp}°C，请注意防寒保暖！'
        })
    
    # 未来2小时降雨提醒
    current_hour = datetime.now().hour
    rain_probs = hourly.get('precipitation_probability', [])
    if len(rain_probs) > current_hour + 2:
        next_rain = rain_probs[current_hour:current_hour+2]
        if any(p > 70 for p in next_rain):
            alerts.append({
                'type': '降雨提醒',
                'message': '未来2小时降水概率较高，出门请带伞！'
            })
    
    return alerts

def main():
    print(f"🌤️ 天气预警检查开始...")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # 读取用户配置
    try:
        with open('/root/projects/myapp/weather-assistant/scripts/alert-users.json', 'r') as f:
            users = json.load(f)
    except Exception as e:
        print(f"❌ 无法读取用户配置: {e}")
        sys.exit(1)
    
    for user in users:
        if not user.get('enabled', False):
            continue
        
        email = user['email']
        location = user['location']
        lat = user['lat']
        lon = user['lon']
        
        print(f"\n检查用户: {email}")
        print(f"位置: {location} ({lat}, {lon})")
        
        weather = fetch_weather(lat, lon)
        if not weather:
            print("❌ 获取天气失败")
            continue
        
        alerts = check_alerts(weather)
        
        if not alerts:
            print("✓ 无预警")
            continue
        
        print(f"⚠️ 发现 {len(alerts)} 条预警")
        
        for alert in alerts:
            send_email(email, alert['type'], alert['message'], location)
    
    print(f"\n✅ 天气预警检查完成")

if __name__ == '__main__':
    main()
