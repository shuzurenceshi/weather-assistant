#!/bin/bash
# 同步 KV 数据到本地
curl -s https://weather-subscribers.shuzurenceshi.workers.dev/api/subscribers \
  -H "Authorization: Bearer weather@2024" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('subscribers',[]), indent=2, ensure_ascii=False))" \
  > /root/projects/myapp/weather-assistant/scripts/alert-users.json 2>/dev/null

export SMTP_USER="7961566@qq.com"
export SMTP_PASS="bxdmwoxuiceobjjg"
cd /root/projects/myapp/weather-assistant/scripts
python3 evening-briefing.py
