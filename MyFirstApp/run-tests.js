// Node.js環境でのテスト実行用
const { runAllTests } = require('./test-services');

console.log('Node.js環境でのサービステスト開始...');

// React Native固有の機能をモック
global.console = {
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
};

// テスト実行
runAllTests()
  .then(() => {
    console.log('テスト完了');
    process.exit(0);
  })
  .catch((error) => {
    console.error('テスト実行エラー:', error);
    process.exit(1);
  });