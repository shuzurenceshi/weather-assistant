'use client';

// 简化版：直接跳转到独立管理页面
export default function AdminPanel() {
  return (
    <a
      href="https://weather-subscribers.shuzurenceshi.workers.dev"
      target="_blank"
      className="fixed bottom-6 right-6 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl z-30 active:scale-95 transition-transform no-underline"
      style={{ textDecoration: 'none', touchAction: 'manipulation' }}
    >
      ⚙️
    </a>
  );
}
