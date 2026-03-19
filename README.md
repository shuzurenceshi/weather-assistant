# 天气助理

一个智能的个人天气助理，提供48小时实时天气、穿衣建议、出行指导和恶劣天气预警。

## 功能

- 🌤️ **48小时实时天气** - 逐小时天气、温度、降水概率
- 🤖 **智能助理对话** - 像朋友一样告诉你天气
- 👕 **穿衣建议** - 基于温度和天气的穿搭推荐
- 🚗 **出行指数** - 紫外线、能见度、风力综合评估
- ⚠️ **恶劣天气预警** - 邮件提醒暴雨、大风、高温等

## 技术栈

- Next.js 14 + TypeScript
- Tailwind CSS
- Open-Meteo API（天气数据）
- Cloudflare Pages（部署）

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 部署

自动部署到 Cloudflare Pages。

## 数据来源

天气数据来自 [Open-Meteo](https://open-meteo.com/)，免费且无需 API Key。
