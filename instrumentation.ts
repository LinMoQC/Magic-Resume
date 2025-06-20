export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const isBackendMode = process.env.NEXT_PUBLIC_IF_USE_BACKEND === 'true';
    const mode = isBackendMode ? 'Python后端模式' : 'Node.js模式';
    const apiEndpoint = isBackendMode ? '/api' : '/api/node';
    console.log('\n   - 🚀 Magic Resume 启动信息:');
    console.log(`   - 📋 当前模式: ${mode}`);
    console.log(`   - 🔗 API端点: ${apiEndpoint}`);
    console.log(`   - 🌍 环境变量 NEXT_PUBLIC_IF_USE_BACKEND: ${process.env.NEXT_PUBLIC_IF_USE_BACKEND || 'undefined'}\n`);
  }
} 