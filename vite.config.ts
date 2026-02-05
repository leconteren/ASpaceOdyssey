import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 环境变量读取优先级：
// 1. process.env (Vercel/CI 注入)
// 2. loadEnv (本地 .env 文件)
// 3. 空字符串
function getEnvVar(key: string, envFromFile: Record<string, string>): string {
  return process.env[key] || envFromFile[key] || '';
}

export default defineConfig(({ mode }) => {
    // 从 .env 文件加载（本地开发用）
    const envFromFile = loadEnv(mode, process.cwd(), '');

    // 读取所有需要的环境变量
    const env = {
      VITE_GEMINI_API_KEY: getEnvVar('VITE_GEMINI_API_KEY', envFromFile),
      VITE_SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL', envFromFile),
      VITE_SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY', envFromFile),
      VITE_FMP_API_KEY: getEnvVar('VITE_FMP_API_KEY', envFromFile),
      VITE_ALPHA_VANTAGE_KEY: getEnvVar('VITE_ALPHA_VANTAGE_KEY', envFromFile),
    };

    // 调试输出（构建时可见）
    console.log('[vite.config] VITE_GEMINI_API_KEY configured:', env.VITE_GEMINI_API_KEY ? 'YES (length: ' + env.VITE_GEMINI_API_KEY.length + ')' : 'NO');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 使用 define 在构建时静态替换这些值
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'import.meta.env.VITE_FMP_API_KEY': JSON.stringify(env.VITE_FMP_API_KEY),
        'import.meta.env.VITE_ALPHA_VANTAGE_KEY': JSON.stringify(env.VITE_ALPHA_VANTAGE_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
