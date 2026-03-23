#!/bin/bash
# 天气预警订阅管理工具 - 命令行版

API_URL="https://weather-subscribers.shuzurenceshi.workers.dev"
PASSWORD="weather@2024"

# 登录获取 token
login() {
    curl -s -X POST "$API_URL/api/login" \
        -H "Content-Type: application/json" \
        -d "{\"password\":\"$PASSWORD\"}" | jq -r '.token'
}

# 列出所有订阅
list_subscribers() {
    echo "📋 订阅用户列表"
    echo "================"
    curl -s "$API_URL/api/subscribers" \
        -H "Authorization: Bearer $PASSWORD" | jq -r '
        .subscribers[] | 
        "📧 \(.email)\n   📍 \(.location) (\(.lat), \(.lon))\n   状态: \(if .enabled then "✅ 启用" else "❌ 禁用" end)\n   类型: \(.alerts | join(\", \"))\n"
    '
}

# 添加订阅
add_subscriber() {
    local email=$1
    local location=$2
    
    if [ -z "$email" ] || [ -z "$location" ]; then
        echo "用法: $0 add <邮箱> <位置>"
        exit 1
    fi
    
    echo "🔍 查找位置: $location"
    
    # 获取经纬度
    geo_data=$(curl -s "https://geocoding-api.open-meteo.com/v1/search?name=$(urlencode "$location")&count=1&language=zh")
    
    lat=$(echo "$geo_data" | jq -r '.results[0].latitude // 0')
    lon=$(echo "$geo_data" | jq -r '.results[0].longitude // 0')
    full_name=$(echo "$geo_data" | jq -r '.results[0].admin1 // ""' | tr -d '"')
    name=$(echo "$geo_data" | jq -r '.results[0].name // ""' | tr -d '"')
    
    if [ "$lat" = "null" ] || [ "$lat" = "0" ]; then
        echo "❌ 无法找到位置: $location"
        exit 1
    fi
    
    full_location="${full_name}${name}"
    echo "📍 找到: $full_location ($lat, $lon)"
    
    # 添加订阅
    result=$(curl -s -X POST "$API_URL/api/subscribers/add" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PASSWORD" \
        -d "{\"email\":\"$email\",\"location\":\"$full_location\",\"lat\":$lat,\"lon\":$lon}")
    
    if echo "$result" | jq -e '.success' > /dev/null; then
        echo "✅ 添加成功！"
        # 同步到本地文件
        sync_to_local
    else
        echo "❌ 添加失败: $(echo "$result" | jq -r '.error // "未知错误"')"
    fi
}

# 删除订阅
delete_subscriber() {
    local email=$1
    
    if [ -z "$email" ]; then
        echo "用法: $0 delete <邮箱>"
        exit 1
    fi
    
    echo "🗑️ 删除订阅: $email"
    
    result=$(curl -s -X POST "$API_URL/api/subscribers/delete" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PASSWORD" \
        -d "{\"email\":\"$email\"}")
    
    if echo "$result" | jq -e '.success' > /dev/null; then
        echo "✅ 删除成功！"
        sync_to_local
    else
        echo "❌ 删除失败: $(echo "$result" | jq -r '.error // "未知错误"')"
    fi
}

# 同步到本地文件
sync_to_local() {
    echo "🔄 同步到本地文件..."
    curl -s "$API_URL/api/subscribers" \
        -H "Authorization: Bearer $PASSWORD" | \
        jq '.subscribers' > /root/projects/myapp/weather-assistant/scripts/alert-users.json
    echo "✅ 同步完成"
}

# 测试发送邮件
test_email() {
    local email=$1
    echo "📧 测试邮件发送到: $email"
    echo "（需要在服务器上手动执行 SMTP 测试）"
}

# 帮助信息
show_help() {
    echo "天气预警订阅管理工具"
    echo ""
    echo "用法: $0 <命令> [参数]"
    echo ""
    echo "命令:"
    echo "  list              列出所有订阅"
    echo "  add <邮箱> <位置>  添加新订阅"
    echo "  delete <邮箱>     删除订阅"
    echo "  sync              同步云端数据到本地"
    echo "  count             显示订阅数量"
    echo ""
    echo "示例:"
    echo "  $0 list"
    echo "  $0 add user@example.com 石家庄"
    echo "  $0 delete user@example.com"
}

# URL 编码函数
urlencode() {
    local string="$1"
    local length="${#string}"
    for (( i = 0; i < length; i++ )); do
        local c="${string:i:1}"
        case $c in
            [a-zA-Z0-9.~_-]) printf "$c" ;;
            *) printf '%s' "$c" | xxd -p -c1 | while read x; do printf '%%%s' "$x"; done ;;
        esac
    done
}

# 主逻辑
case "${1:-help}" in
    list)   list_subscribers ;;
    add)    add_subscriber "$2" "$3" ;;
    delete) delete_subscriber "$2" ;;
    sync)   sync_to_local ;;
    count)  
        count=$(curl -s "$API_URL/api/subscribers" -H "Authorization: Bearer $PASSWORD" | jq '.count')
        echo "📊 当前订阅数: $count"
        ;;
    *)      show_help ;;
esac
