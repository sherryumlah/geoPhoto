module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?expo(-.*)?|@expo(-.*)?|react-native|@react-native(-community)?/.*|@react-navigation/.*|expo-font|expo-constants|expo-camera|expo-modules-core)/)",
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
