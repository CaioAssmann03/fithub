module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/domain/**/*.(t|j)s', '**/application/**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
