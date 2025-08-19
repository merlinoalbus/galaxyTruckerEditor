const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  jest: {
    configure: (jestConfig) => {
      // Support path alias '@/…' in tests
      jestConfig.moduleNameMapper = {
        ...(jestConfig.moduleNameMapper || {}),
        '^@/(.*)$': '<rootDir>/src/$1'
      };
      return jestConfig;
    }
  }
};