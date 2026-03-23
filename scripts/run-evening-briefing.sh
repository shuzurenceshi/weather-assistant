#!/bin/bash
# 晚间播报启动脚本
export SMTP_USER="7961566@qq.com"
export SMTP_PASS="bxdmwoxuiceobjjg"

cd /root/projects/myapp/weather-assistant/scripts
python3 evening-briefing.py
