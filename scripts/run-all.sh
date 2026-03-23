#!/bin/bash

# 设置环境变量
export SMTP_USER="7961566@qq.com"
export SMTP_PASS="bxdmwoxuiceobjjg"

cd /root/weather-assistant
python3 scripts/daily-briefing.py
python3 scripts/weather-alert.py
