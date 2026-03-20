#!/usr/bin/env python3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime

SMTP_USER = os.environ.get('SMTP_USER', '7961566@qq.com')
SMTP_PASS = os.environ.get('SMTP_PASS', '')

if not SMTP_PASS:
    print("❌ 错误: 请设置环境变量 SMTP_PASS")
    exit(1)

def send_test_email():
    msg = MIMEMultipart('alternative')
    msg['From'] = SMTP_USER
    msg['To'] = SMTP_USER
    msg['Subject'] = '天气助理测试邮件'
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .icon { font-size: 48px; }
            .title { color: #333; font-size: 24px; margin-top: 10px; }
            .content { padding: 20px 0; line-height: 1.6; }
            .success { color: #4caf50; font-weight: bold; font-size: 18px; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">🌤️</div>
                <div class="title">天气助理测试邮件</div>
            </div>
            <div class="content">
                <p class="success">✅ 邮件预警功能配置成功！</p>
                <p>如果您收到这封邮件，说明邮件发送功能正常工作。</p>
                <p>当检测到恶劣天气时，您将收到预警邮件。</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p><strong>监控位置：</strong>河北石家庄</p>
                <p><strong>预警类型：</strong></p>
                <ul>
                    <li>🌧️ 暴雨预警（降水量 > 20mm）</li>
                    <li>💨 大风预警（风速 > 50km/h）</li>
                    <li>🔥 高温预警（气温 > 38°C）</li>
                    <li>❄️ 寒潮预警（气温 < -5°C）</li>
                    <li>☔ 降雨提醒（未来2小时降水概率 > 70%）</li>
                </ul>
            </div>
            <div class="footer">
                此邮件由天气助理自动发送<br>
                """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))
    
    with smtplib.SMTP_SSL('smtp.qq.com', 465) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [SMTP_USER], msg.as_string())
    
    print("✅ 测试邮件已发送到 7961566@qq.com")
    print("📬 请检查您的 QQ 邮箱收件箱")

if __name__ == '__main__':
    send_test_email()
