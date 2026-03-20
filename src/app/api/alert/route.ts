import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// 创建邮件发送器
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || '7961566@qq.com',
    pass: process.env.SMTP_PASS || 'wvdwcnbfjqkhcadb',
  },
});

interface AlertRequest {
  email: string;
  type: string;
  message: string;
  location: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, type, message, location }: AlertRequest = await request.json();
    
    // 发送邮件
    const info = await transporter.sendMail({
      from: `"天气助理" <${process.env.SMTP_FROM || '7961566@qq.com'}>`,
      to: email,
      subject: `【天气预警】${type} - ${location}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
            .icon { font-size: 48px; }
            .title { color: #333; font-size: 24px; margin-top: 10px; }
            .content { padding: 20px 0; }
            .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .location { color: #666; font-size: 14px; }
            .time { color: #999; font-size: 12px; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">⚠️</div>
              <div class="title">天气预警通知</div>
              <div class="location">📍 ${location}</div>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>预警类型：</strong>${type}<br><br>
                <strong>详细信息：</strong><br>
                ${message}
              </div>
            </div>
            <div class="footer">
              此邮件由天气助理自动发送<br>
              ${new Date().toLocaleString('zh-CN')}
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log('预警邮件发送成功:', info.messageId);
    
    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId 
    });
  } catch (error: any) {
    console.error('发送预警邮件失败:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
