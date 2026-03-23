#!/bin/bash
# 同步网页订阅数据到本地

echo "开始同步订阅数据..."

API_URL="https://weather-subscribers.shuzurenceshi.workers.dev/api/subscribers"
LOCAL_FILE="/root/projects/myapp/weather-assistant/scripts/alert-users.json"

# 获取远程数据
response=$(curl -s -H "Authorization: Bearer weather@2024" "$API_URL")
if [ $? -ne 0 ]; then
    echo "❌ 无法连接 API"
    exit 1
fi

# 解析 JSON
subscribers=$(echo "$response" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin)
    print(json.dumps(data.get('subscribers', []), indent=2, ensure_ascii=False))
except Exception as e:
    print(f'解析失败: {e}')
    exit 1
" | python3 -c "
import sys, json
data = json.loads(sys.stdin)
print(json.dumps(data.get('subscribers', []), indent=2, ensure_ascii=False))
")

# 保存到本地
echo "$subscribers" > "$LOCAL_FILE"

echo "✅ 同步完成！"
echo ""
echo "当前订阅列表:"
cat "$LOCAL_FILE"
