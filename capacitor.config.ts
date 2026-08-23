import type { CapacitorConfig } from '@capacitor/cli'

const allowMixedContent =
  process.env.CAPACITOR_ALLOW_MIXED_CONTENT === 'true'

const config: CapacitorConfig = {
  appId: 'com.chengyang.functionbase',
  appName: '函数知识库',
  webDir: 'dist',
  android: {
    // 平板看代码时允许双指缩放。
    zoomEnabled: true,

    // 只在本地 HTTP 开发时由 setup-android.ps1 打开。
    // 正式部署 HTTPS 后保持 false。
    allowMixedContent,
    initialFocus: false,
  },
}

export default config
