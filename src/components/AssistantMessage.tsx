'use client';

interface AssistantMessageProps {
  message: string;
}

export default function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="weather-card">
      <div className="flex items-start gap-3">
        {/* 助理头像 */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl flex-shrink-0">
          🤖
        </div>
        
        {/* 消息内容 */}
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">天气助理</div>
          <div className="assistant-bubble text-sm leading-relaxed">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}
