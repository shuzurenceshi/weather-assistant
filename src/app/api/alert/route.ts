import { NextRequest, NextResponse } from 'next/server';

// 邮件发送 API（使用 Resend）
export async function POST(request: NextRequest) {
  try {
    const { email, type, message, location } = await request.json();
    
    // 这里需要配置 Resend API Key
    // const resend = new Resend(process.env.RESEND_API_KEY);
    
    // 发送邮件
    // await resend.emails.send({
    //   from: 'weather-alert@yourdomain.com',
    //   to: email,
    //   subject: `【天气预警】${type} - ${location}`,
    //   html: `
    //     <h2>天气预警通知</h2>
    //     <p><strong>类型：</strong>${type}</p>
    //     <p><strong>位置：</strong>${location}</p>
    //     <p><strong>详情：</strong>${message}</p>
    //     <hr />
    //     <p>此邮件由天气助理自动发送</p>
    //   `,
    // });
    
    console.log('发送预警邮件:', { email, type, message, location });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
