const nodemailer = require('nodemailer');
const https = require('https');

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

// 用户配置 - 从配置文件读取
const users = require('./alert-users.json');

// 获取天气数据
async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation',
    hourly: 'precipitation_probability,precipitation',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '2',
  });

  return new Promise((resolve, reject) => {
    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    console.log('请求:', url);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.log('响应:', data.substring(0, 500));
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.log('请求错误:', e);
      reject(e);
    });
  });
}

// 检查天气预警
function checkAlerts(weather) {
  const alerts = [];
  const current = weather.current;
  const hourly = weather.hourly;
  
  // 暴雨预警
  if (current.precipitation > 20) {
    alerts.push({
      type: '暴雨预警',
      level: 'orange',
      message: `当前降水量已达 ${current.precipitation}mm，请注意防涝，减少外出！`,
    });
  }
  
  // 大风预警
  if (current.wind_speed_10m > 50) {
    alerts.push({
      type: '大风预警',
      level: 'yellow',
      message: `当前风速 ${current.wind_speed_10m}km/h，外出请注意安全！`,
    });
  }
  
  // 高温预警
  if (current.temperature_2m > 38) {
    alerts.push({
      type: '高温预警',
      level: 'red',
      message: `当前气温 ${current.temperature_2m}°C，请避免户外活动，注意防暑！`,
    });
  }
  
  // 寒潮预警
  if (current.temperature_2m < -5) {
    alerts.push({
      type: '寒潮预警',
      level: 'orange',
      message: `当前气温 ${current.temperature_2m}°C，请注意防寒保暖！`,
    });
  }
  
  // 未来2小时降雨提醒
  const currentHour = new Date().getHours();
  const nextRain = hourly.precipitation_probability.slice(currentHour, currentHour + 2);
  if (nextRain.some(p => p > 70)) {
    alerts.push({
      type: '降雨提醒',
      level: 'yellow',
      message: `未来2小时降水概率较高，出门请带伞！`,
    });
  }
  
  return alerts;
}

// 发送预警邮件
async function sendAlertEmail(user, alert, location) {
  const levelEmoji = alert.level === 'red' ? '🚨' : alert.level === 'orange' ? '⚠️' : '⚡';
  
  const info = await transporter.sendMail({
    from: '"天气助理" <7961566@qq.com>',
    to: user.email,
    subject: `${levelEmoji}【天气预警】${alert.type} - ${location}`,
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
          .alert-box { background: ${alert.level === 'red' ? '#ffebee' : alert.level === 'orange' ? '#fff3cd' : '#e8f5e9'}; 
                       border-left: 4px solid ${alert.level === 'red' ? '#f44336' : alert.level === 'orange' ? '#ffc107' : '#4caf50'}; 
                       padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">${levelEmoji}</div>
            <div class="title">${alert.type}</div>
            <div class="location">📍 ${location}</div>
          </div>
          <div class="content">
            <div class="alert-box">
              ${alert.message}
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
  
  console.log(`✅ 邮件已发送到 ${user.email}: ${info.messageId}`);
}

// 主函数
async function main() {
  console.log('🌤️ 天气预警检查开始...');
  console.log(`📅 ${new Date().toLocaleString('zh-CN')}\n`);
  
  for (const user of users) {
    if (!user.enabled) continue;
    
    console.log(`\n检查用户: ${user.email}`);
    console.log(`位置: ${user.location} (${user.lat}, ${user.lon})`);
    
    try {
      const weather = await fetchWeather(user.lat, user.lon);
      const alerts = checkAlerts(weather);
      
      if (alerts.length === 0) {
        console.log('✓ 无预警');
        continue;
      }
      
      console.log(`⚠️ 发现 ${alerts.length} 条预警`);
      
      for (const alert of alerts) {
        await sendAlertEmail(user, alert, user.location);
      }
      
    } catch (error) {
      console.error(`❌ 获取天气失败:`, error.message);
    }
  }
  
  console.log('\n✅ 天气预警检查完成');
}

main().catch(console.error);
