const fs = require('fs');
const path = require('path');

// 读取并验证 farcaster.json
function validateFarcasterConfig() {
  try {
    const configPath = path.join(__dirname, '../public/.well-known/farcaster.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('✅ Farcaster配置验证：');
    console.log(`   - 版本: ${config.frame.version}`);
    console.log(`   - 应用名称: ${config.frame.name}`);
    console.log(`   - 主页URL: ${config.frame.homeUrl}`);
    console.log(`   - 图标URL: ${config.frame.iconUrl}`);
    console.log(`   - 启动画面URL: ${config.frame.splashImageUrl}`);
    console.log(`   - 嵌入图片URL: ${config.frame.imageUrl || '未设置'}`);
    console.log(`   - 按钮标题: ${config.frame.buttonTitle || '未设置'}`);
    
    // 验证必需字段
    const required = ['version', 'name', 'homeUrl', 'iconUrl', 'splashImageUrl'];
    const missing = required.filter(field => !config.frame[field]);
    
    if (missing.length > 0) {
      console.log('❌ 缺少必需字段:', missing.join(', '));
      return false;
    }
    
    console.log('✅ 所有必需字段都已配置');
    return true;
  } catch (error) {
    console.error('❌ 读取farcaster.json配置失败:', error.message);
    return false;
  }
}

// 验证图片资源
function validateImages() {
  const imagePaths = [
    'public/icon.png',
    'public/splash.png', 
    'public/og-image.png'
  ];
  
  console.log('\n📸 图片资源验证：');
  
  for (const imagePath of imagePaths) {
    const fullPath = path.join(__dirname, '..', imagePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`✅ ${imagePath} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.log(`❌ ${imagePath} 缺失`);
    }
  }
}

// 验证截图（可选但推荐）
function validateScreenshots() {
  console.log('\n📱 截图验证（推荐）：');
  
  const screenshots = ['screenshot1.png', 'screenshot2.png', 'screenshot3.png'];
  for (const screenshot of screenshots) {
    const fullPath = path.join(__dirname, '..', 'public', screenshot);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${screenshot} 存在`);
    } else {
      console.log(`⚠️  ${screenshot} 缺失（推荐添加）`);
    }
  }
}

// 生成配置摘要
function generateSummary() {
  console.log('\n📋 配置摘要：');
  console.log('1. /.well-known/farcaster.json - Mini App 清单文件');
  console.log('2. Meta 标签 - 页面嵌入配置（fc:frame）');
  console.log('3. 图片资源 - 图标、启动画面、OG图片');
  console.log('4. 截图 - 应用商店预览（可选）');
  
  console.log('\n🚀 部署检查清单：');
  console.log('- [ ] 域名配置正确 (signal-cast.vercel.app)');
  console.log('- [ ] HTTPS 启用');
  console.log('- [ ] 所有图片资源可访问');
  console.log('- [ ] accountAssociation 签名有效');
  console.log('- [ ] 在 Warpcast 中测试嵌入功能');
}

// 主函数
function main() {
  console.log('🔍 SignalCast Mini App Embed 配置验证\n');
  
  const configValid = validateFarcasterConfig();
  validateImages();
  validateScreenshots();
  generateSummary();
  
  if (configValid) {
    console.log('\n✅ 配置验证通过！您的 Mini App embed 已准备就绪。');
  } else {
    console.log('\n❌ 配置验证失败，请检查上述错误。');
    process.exit(1);
  }
}

main(); 