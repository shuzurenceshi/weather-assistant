#!/bin/bash
# 天气预警管理脚本
# 用于查看订阅用户和手动触发预警

SCRIPT_DIR="/root/projects/myapp/weather-assistant/scripts"
USERS_FILE="$SCRIPT_DIR/alert-users.json"

show_help() {
    echo "天气预警管理工具"
    echo ""
    echo "用法: $0 <命令>"
    echo ""
    echo "命令:"
    echo "  list          查看所有订阅用户"
    echo "  count         显示订阅用户数量"
    echo "  run           手动执行预警检查"
    echo "  add           添加订阅用户（交互式）"
    echo "  cron-install  安装定时任务"
    echo "  cron-remove   移除定时任务"
    echo "  cron-status   查看定时任务状态"
    echo "  log           查看预警日志"
    echo ""
}

list_users() {
    echo "=== 订阅用户列表 ==="
    if [ -f "$USERS_FILE" ]; then
        python3 << 'EOF'
import json
with open('/root/projects/myapp/weather-assistant/scripts/alert-users.json', 'r') as f:
    users = json.load(f)
    
print(f"共 {len(users)} 个订阅用户\n")
for i, u in enumerate(users, 1):
    status = "✅ 启用" if u.get('enabled') else "❌ 禁用"
    alerts = ', '.join(u.get('alerts', []))
    print(f"{i}. {u['email']}")
    print(f"   位置: {u['location']} ({u['lat']}, {u['lon']})")
    print(f"   状态: {status}")
    print(f"   预警类型: {alerts}")
    print()
EOF
    else
        echo "用户配置文件不存在"
    fi
}

count_users() {
    if [ -f "$USERS_FILE" ]; then
        count=$(python3 -c "import json; print(len(json.load(open('$USERS_FILE'))))")
        enabled=$(python3 -c "import json; print(len([u for u in json.load(open('$USERS_FILE')) if u.get('enabled')]))")
        echo "📊 订阅统计"
        echo "  总用户数: $count"
        echo "  已启用: $enabled"
        echo "  未启用: $((count - enabled))"
    else
        echo "0"
    fi
}

run_alert() {
    echo "🚀 执行天气预警检查..."
    cd "$SCRIPT_DIR"
    export SMTP_USER="7961566@qq.com"
    export SMTP_PASS="wvdwcnbfjqkhcadb"
    python3 weather-alert.py
}

add_user() {
    echo "➕ 添加订阅用户"
    read -p "邮箱: " email
    read -p "位置 (如: 河北石家庄): " location
    read -p "纬度 (如: 38.04): " lat
    read -p "经度 (如: 114.51): " lon
    
    python3 << EOF
import json

users = []
try:
    with open('$USERS_FILE', 'r') as f:
        users = json.load(f)
except:
    pass

users.append({
    'email': '$email',
    'location': '$location',
    'lat': $lat,
    'lon': $lon,
    'enabled': True,
    'alerts': ['rain', 'wind', 'temperature', 'severe']
})

with open('$USERS_FILE', 'w') as f:
    json.dump(users, f, indent=2, ensure_ascii=False)

print('✅ 用户已添加')
EOF
}

install_cron() {
    echo "⏰ 安装定时任务..."
    
    # 每天早上 7:00 发送早间播报
    # 每 3 小时检查一次天气预警
    (crontab -l 2>/dev/null | grep -v "weather-assistant"; cat << 'CRON'
# 天气助理定时任务
0 7 * * * /root/projects/myapp/weather-assistant/scripts/run-briefing.sh >> /var/log/weather-assistant.log 2>&1
0 */3 * * * /root/projects/myapp/weather-assistant/scripts/run-alert.sh >> /var/log/weather-assistant.log 2>&1
CRON
    ) | crontab -
    
    echo "✅ 定时任务已安装"
    echo ""
    echo "时间表:"
    echo "  - 早间播报: 每天 07:00"
    echo "  - 天气预警: 每 3 小时"
}

remove_cron() {
    echo "🗑️ 移除定时任务..."
    crontab -l 2>/dev/null | grep -v "weather-assistant" | crontab -
    echo "✅ 定时任务已移除"
}

cron_status() {
    echo "📋 当前定时任务:"
    echo ""
    crontab -l 2>/dev/null | grep -E "weather|briefing|alert" || echo "无相关定时任务"
    echo ""
    
    if [ -f "/var/log/weather-assistant.log" ]; then
        echo "📄 最近日志 (最后 10 行):"
        tail -10 /var/log/weather-assistant.log
    else
        echo "暂无日志文件"
    fi
}

view_log() {
    LOG_FILE="/var/log/weather-assistant.log"
    if [ -f "$LOG_FILE" ]; then
        echo "📄 天气预警日志 (最后 50 行):"
        echo ""
        tail -50 "$LOG_FILE"
    else
        echo "暂无日志文件"
    fi
}

# 主逻辑
case "${1:-help}" in
    list)   list_users ;;
    count)  count_users ;;
    run)    run_alert ;;
    add)    add_user ;;
    cron-install)  install_cron ;;
    cron-remove)   remove_cron ;;
    cron-status)   cron_status ;;
    log)    view_log ;;
    *)      show_help ;;
esac
