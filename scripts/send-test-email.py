#!/usr/bin/env python3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys
from datetime import datetime

SMTP_USER = '7961566@qq.com'
SMTP_PASS = 'bxdmwoxuiceobjjg'

def send_test_email(to_email):
    msg = MIMEMultipart('alternative')
    msg['From'] = SMTP_USER
    msg['To'] = to_email
    msg['Subject'] = '🌤️ 天气助理 - 测试邮件'
    
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
            .content { padding: 20px 0; line-height: 1.6; color: #333; }
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
                <p class="success">✅ 邮件发送成功！</p>
                <p>如果您收到这封邮件，说明天气预警邮件功能已正常配置。</p>
                <p>当检测到恶劣天气（暴雨、大风、高温等）时，您将收到预警通知。</p>
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
        server.sendmail(SMTP_USER, [to_email], msg.as_string())
    
    print(f"✅ 测试邮件已发送到 {to_email}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python3 send-test-email.py <邮箱地址>")
        sys.exit(1)
    
    email = sys.argv[1]
    try:
        send_test_email(email)
    except Exception as e:
        print(f"❌ 发送失败: {e}")
        sys.exit(1)
