'use client';

interface LocationErrorProps {
  error: string;
  onRetry: () => void;
}

export default function LocationError({ error, onRetry }: LocationErrorProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="weather-card text-center max-w-md">
        <div className="text-6xl mb-4">😢</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">获取位置失败</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-sm text-gray-500 mb-4">
          请确保已开启浏览器定位权限，或手动输入城市名
        </p>
        <button
          onClick={onRetry}
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium"
        >
          重试
        </button>
      </div>
    </div>
  );
}
