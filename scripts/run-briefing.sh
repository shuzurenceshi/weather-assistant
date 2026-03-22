#!/bin/bash
# 天气播报启动脚本

# QQ邮箱配置
export SMTP_USER="7961566@qq.com"
export SMTP_PASS="wvdwcnbfjqkhcadb"

# 刿alia化脚本路径
SCRIPT_DIR="/root/projects/myapp/weather-assistant/scripts"

# 运行 Python 脚本
cd "$SCRIPT_DIR"
python3 daily-briefing.py
