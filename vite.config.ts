import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' 让产物用相对路径，便于在 Vercel 任意路径下作为静态站托管；
// 前端只读 public/data 下的快照 JSON，不重算 D / 档位。
export default defineConfig({
  plugins: [react()],
  base: './',
})
