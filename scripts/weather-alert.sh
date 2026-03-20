#!/bin/bash

# 天气预警脚本 - 使用 curl 获取天气数据

# QQ邮箱配置
SMTP_USER="7961566@qq.com"
SMTP_PASS="wvdwcnbfjqkhcadb"

# 用户配置文件
USERS_FILE="/root/weather-assistant/scripts/alert-users.json"
LOG_FILE="/var/log/weather-alert.log"

# 读取用户配置
users=$(cat "$USERS_FILE" 2>/dev/null)

if [ -z "$users" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 无法读取用户配置" >> "$LOG_FILE"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🌤️ 天气预警检查开始..." >> "$LOG_FILE"

# 遍历用户
echo "$users" | jq -c '.[] | .email' | while read -r email; do
    # 获取用户信息
    lat=$(echo "$users" | jq -r --argjson ".[] | select(.email == \"$email\") | .lat" 2>/dev/null)
    lon=$(echo "$users" | jq -r --argjson ".[] | select(.email == \"$email\") | .lon" 2>/dev/null)
    location=$(echo "$users" | jq -r --argjson ".[] | select(.email == \"$email\") | .location" 2>/dev/null)
    enabled=$(echo "$users" | jq -r --argjson ".[] | select(.email == \"$email\") | .enabled" 2>/dev/null)
    
    if [ "$enabled" != "true" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 用户 $email 已禁用，跳过" >> "$LOG_FILE"
        continue
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查用户: $email ($location)" >> "$LOG_FILE"
    
    # 获取天气数据
    weather=$(curl -s --max-time 30 "http://api.open-meteo.com/v1/forecast?latitude=$lat&longitude=$lon&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation&hourly=precipitation_probability,precipitation&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max&timezone=auto&forecast_days=2" 2>/dev/null)
    
    if [ -z "$weather" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 获取天气失败" >> "$LOG_FILE"
        continue
    fi
    
    # 检查预警
    temp=$(echo "$weather" | jq -r '.current.temperature_2m // 1' | 2>/dev/null)
    precipitation=$(echo "$weather" | jq -r '.current.precipitation // 1' | 2>/dev/null)
    wind_speed=$(echo "$weather" | jq -r '.current.wind_speed_10m // 1' | 2>/dev/null)
    
    # 暴雨预警
    if (( $(echo "$precipitation > 20" | bc -l) )); then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ 暴雨预警 - 降水量 ${precipitation}mm" >> "$LOG_FILE"
        # 发送邮件（使用 sendEmail 函数）
    sendEmail "$email" "暴雨预警" "当前降水量已达 ${precipitation}mm，请注意防涝，减少外出！" "$location" &
    fi
    
    # 大风预警
    if (( $(echo "$wind_speed > 50" | bc -l) )); then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ 大风预警 - 风速 ${wind_speed}km/h" >> "$LOG_FILE"
        sendEmail "$email" "大风预警" "当前风速 ${wind_speed}km/h，外出请注意安全！" "$location" &
    fi
    
    # 高温预警
    if (( $(echo "$temp > 38" | bc -l) )); then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚨 高温预警 - 温度 ${temp}°C" >> "$LOG_FILE"
        sendEmail "$email" "高温预警" "当前气温 ${temp}°C，请避免户外活动，注意防暑！" "$location" &
    fi
    
    # 寒潮预警
    if (( $(echo "$temp < -5" | bc -l) )); then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ 寒潮预警 - 温度 ${temp}°C" >> "$LOG_FILE"
        sendEmail "$email" "寒潮预警" "当前气温 ${temp}°C，请注意防寒保暖！" "$location" &
    fi
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ 检查完成" >> "$LOG_FILE"
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 天气预警检查完成" >> "$LOG_FILE"

# 发送邮件函数
sendEmail() {
    local to="$1"
    local type="$2"
    local message="$3"
    local location="$4"
    
    local subject="【天气预警】${type} - ${location}"
    
    # 使用 curl 发送邮件（通过 QQ 邮箱 SMTP）
    # 这里需要使用 Python 或 Node 来实际发送邮件
    # 暂时只记录日志
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📧 发送邮件到 $to: $subject" >> "$LOG_FILE"
}
