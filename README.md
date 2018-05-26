# nodejs_chat
基于nodejs和websocket的点对点聊天系统
# 使用流程
## 获得对方id
信息传输使用json，连接服务器成功后发送
{"action":"get_new_id"}
获取匹配信息，得到服务器返回
{"action":"new_id","value":"id"}
后保存此id。
## 发送信息
格式：
{"action":"send_message","value":"信息",to_id":"对方id"}
## 接收信息
格式：
{"action":"new_message","value":"新信息"}