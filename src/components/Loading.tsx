'use client';

export default function Loading() {
  return (
    <div className="min-h-screen weather-bg-sunny flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl mb-4 animate-bounce">🌤️</div>
        <div className="text-xl font-medium">正在获取天气数据...</div>
        <div className="text-sm opacity-70 mt-2">请稍候</div>
      </div>
    </div>
  );
}
