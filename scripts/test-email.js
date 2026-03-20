const nodemailer = require('nodemailer');

// QQ邮箱配置
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: true,
  auth: {
    user: '7961566@qq.com',
    pass: 'wvdwcnbfjqkhcadb',
  },
});

// 发送测试邮件
async function sendTestEmail() {
  const info = await transporter.sendMail({
    from: '"天气助理" <7961566@qq.com>',
    to: '7961566@qq.com',
    subject: '🌤️ 天气助理测试邮件',
    html: `
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
          .success { color: #4caf50; font-weight: bold; }
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
            <p class="success">✅ 達件预警功能配置成功！</p>
            <p>如果您收到这封邮件，说明邮件发送功能正常工作。</p>
            <p>当检测到恶劣天气时，您将收到预警邮件。</p>
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
  
  console.log('✅ 测试邮件发送成功:', info.messageId);
  console.log('📬 请检查您的收件箱');
}

sendTestEmail();
