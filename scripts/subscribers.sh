#!/bin/bash
# 天气预警订阅管理 - 简化版

API="https://weather-subscribers.shuzurenceshi.workers.dev"
TOKEN="weather@2024"

case "$1" in
    list)
        echo "📋 订阅列表:"
        curl -s "$API/api/subscribers" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for s in data['subscribers']:
    print(f\"📧 {s['email']}\")
    print(f\"   📍 {s['location']}\")
    print(f\"   状态: {'✅' if s['enabled'] else '❌'}\")
    print()
"
        ;;
    add)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "用法: $0 add 邮箱 位置"
            exit 1
        fi
        email="$2"
        location="$3"
        
        # 获取经纬度
        geo=$(curl -s "https://geocoding-api.open-meteo.com/v1/search?name=$location&count=1&language=zh")
        lat=$(echo "$geo" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['results'][0]['latitude'] if d.get('results') else 0)")
        lon=$(echo "$geo" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['results'][0]['longitude'] if d.get('results') else 0)")
        full=$(echo "$geo" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d['results'][0] if d.get('results') else {}; print((r.get('admin1','') + r.get('name','')) or '$location')")
        
        echo "📍 位置: $full ($lat, $lon)"
        
        result=$(curl -s -X POST "$API/api/subscribers/add" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "{\"email\":\"$email\",\"location\":\"$full\",\"lat\":$lat,\"lon\":$lon}")
        
        echo "$result" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('✅ 添加成功!' if d.get('success') else f\"❌ {d.get('error', '失败')}\")"
        
        # 同步到本地
        curl -s "$API/api/subscribers" -H "Authorization: Bearer $TOKEN" | \
            python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['subscribers'], indent=2, ensure_ascii=False))" \
            > /root/projects/myapp/weather-assistant/scripts/alert-users.json
        ;;
    delete)
        if [ -z "$2" ]; then
            echo "用法: $0 delete 邮箱"
            exit 1
        fi
        curl -s -X POST "$API/api/subscribers/delete" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "{\"email\":\"$2\"}" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('✅ 删除成功!' if d.get('success') else f\"❌ {d.get('error', '失败')}\")"
        
        # 同步到本地
        curl -s "$API/api/subscribers" -H "Authorization: Bearer $TOKEN" | \
            python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['subscribers'], indent=2, ensure_ascii=False))" \
            > /root/projects/myapp/weather-assistant/scripts/alert-users.json
        ;;
    sync)
        curl -s "$API/api/subscribers" -H "Authorization: Bearer $TOKEN" | \
            python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['subscribers'], indent=2, ensure_ascii=False))" \
            > /root/projects/myapp/weather-assistant/scripts/alert-users.json
        echo "✅ 已同步到本地文件"
        cat /root/projects/myapp/weather-assistant/scripts/alert-users.json
        ;;
    count)
        curl -s "$API/api/subscribers" -H "Authorization: Bearer $TOKEN" | \
            python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"📊 总订阅: {d['count']}\")"
        ;;
    *)
        echo "天气预警订阅管理"
        echo ""
        echo "用法: $0 <命令>"
        echo ""
        echo "命令:"
        echo "  list          列出所有订阅"
        echo "  add 邮箱 位置  添加订阅"
        echo "  delete 邮箱   删除订阅"
        echo "  sync          同步云端数据到本地"
        echo "  count         显示订阅数量"
        echo ""
        echo "示例:"
        echo "  $0 list"
        echo "  $0 add user@example.com 石家庄"
        echo "  $0 delete test@test.com"
        ;;
esac
