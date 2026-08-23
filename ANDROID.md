# Android / 平板运行

现有 React + Vite 前端使用 Capacitor 打包成 Android，
不重写页面和业务逻辑。

## 第一次创建 Android 工程

在项目根目录执行：

```powershell
.\scripts\setup-android.ps1
```

脚本会：

1. 自动寻找电脑局域网 IPv4。
2. 创建 `.env.android`。
3. 安装 Capacitor。
4. 构建 Vite。
5. 首次生成 `android/`。
6. 同步 Web 文件到 Android。
7. 打开 Android Studio。

如果自动识别到的 IP 不对：

```powershell
.\scripts\setup-android.ps1 `
  -ApiBaseUrl "http://192.168.1.123:3000"
```

## 运行后端

另开一个终端：

```powershell
cd server
npm run dev
```

实体 Android 平板与电脑必须处于同一局域网。

## 后续前端改完后

```powershell
npm run android:sync
npm run android:open
```

也可以直接：

```powershell
npm run android:run
```

## 正式发布

正式发布时把 `.env.android` 改成 HTTPS API：

```env
VITE_API_BASE_URL=https://api.example.com
```

然后重新：

```powershell
npm run android:sync
```
