/**
 * Jest配置文件
 */
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配模式
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // 模块名称映射
  moduleNameMapper: {
    // 处理CSS导入
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    // 处理图片导入
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
  },
  
  // 转换器配置
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // 设置覆盖率收集
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
  ],
  
  // 设置测试覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 设置快照序列化器
  snapshotSerializers: ['jest-serializer-html'],
  
  // 设置测试超时时间
  testTimeout: 10000,
};