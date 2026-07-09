# Python 后端

这个后端使用 Python 标准库和 SQLite，不需要安装第三方依赖。

## 启动

在 VS Code 终端执行：

```powershell
Set-Location "D:\Codex Project\calorie-site"
$env:CALORIE_COLLAB_PASSWORD="你的共创密码"
& "C:\Users\小莉莉\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" backend/app.py
```

如果你自己安装了 Python 3，也可以用 `python backend/app.py`。不要用当前机器上的 `py`，它可能指向 Python 2.7。

默认地址：

```text
http://127.0.0.1:8787
```

如果不设置 `CALORIE_COLLAB_PASSWORD`，默认密码是：

```text
calorie-admin
```

正式部署时必须改掉默认密码。

## 数据库

SQLite 文件会自动创建在：

```text
backend/calorie_site.sqlite3
```

保存内容包括：

- 自定义食物
- 自定义运动消耗
- 每日热量差值记录

## 热量差值公式

```text
热量差值 = 摄入热量 × 食物热效应系数 - 基础代谢 × 日常系数 - 运动消耗
```

当前基础代谢公式使用 Mifflin-St Jeor：

```text
男性: 10 × 体重kg + 6.25 × 身高cm - 5 × 年龄 + 5
女性: 10 × 体重kg + 6.25 × 身高cm - 5 × 年龄 - 161
```
