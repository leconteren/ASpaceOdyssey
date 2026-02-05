import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/guide/env-and-mode.html
// Vercel 注入的环境变量在 process.env 中，不是 .env 文件
// 所以我们需要直接从 process.env 读取
export default defineConfig(() => {
    // 优先使用 process.env (Vercel)，备用 import.meta.env (本地开发)
    const geminiKey = process.env.VITE_GEMINI_API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 在构建时将环境变量注入到客户端代码
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
