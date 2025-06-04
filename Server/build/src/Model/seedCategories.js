"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _Categories = _interopRequireDefault(require("./Categories.js"));

const seedCategories = async () => {
  try {
    const categories = [
    {
      codeCategory: "TRAI",
      nameCategory: "Trái"
    },
    {
      codeCategory: "RAU",
      nameCategory: "Rau"
    },
    {
      codeCategory: "THIT",
      nameCategory: "Thịt"
    }];


    for (const category of categories) {
      await _Categories.default.findOneAndUpdate(
        { codeCategory: category.codeCategory },
        category,
        { upsert: true }
      );
    }

    // Đã cập nhật xong categories
  } catch (error) {

    // Xử lý lỗi nếu có
  }};var _default = exports.default =

seedCategories;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfQ2F0ZWdvcmllcyIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwic2VlZENhdGVnb3JpZXMiLCJjYXRlZ29yaWVzIiwiY29kZUNhdGVnb3J5IiwibmFtZUNhdGVnb3J5IiwiY2F0ZWdvcnkiLCJDYXRlZ29yeSIsImZpbmRPbmVBbmRVcGRhdGUiLCJ1cHNlcnQiLCJlcnJvciIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvTW9kZWwvc2VlZENhdGVnb3JpZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENhdGVnb3J5IGZyb20gXCIuL0NhdGVnb3JpZXMuanNcIjtcblxuY29uc3Qgc2VlZENhdGVnb3JpZXMgPSBhc3luYyAoKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgY2F0ZWdvcmllcyA9IFtcbiAgICAgIHtcbiAgICAgICAgY29kZUNhdGVnb3J5OiBcIlRSQUlcIixcbiAgICAgICAgbmFtZUNhdGVnb3J5OiBcIlRyw6FpXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBjb2RlQ2F0ZWdvcnk6IFwiUkFVXCIsXG4gICAgICAgIG5hbWVDYXRlZ29yeTogXCJSYXVcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNvZGVDYXRlZ29yeTogXCJUSElUXCIsXG4gICAgICAgIG5hbWVDYXRlZ29yeTogXCJUaOG7i3RcIixcbiAgICAgIH0sXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgY2F0ZWdvcnkgb2YgY2F0ZWdvcmllcykge1xuICAgICAgYXdhaXQgQ2F0ZWdvcnkuZmluZE9uZUFuZFVwZGF0ZShcbiAgICAgICAgeyBjb2RlQ2F0ZWdvcnk6IGNhdGVnb3J5LmNvZGVDYXRlZ29yeSB9LFxuICAgICAgICBjYXRlZ29yeSxcbiAgICAgICAgeyB1cHNlcnQ6IHRydWUgfVxuICAgICAgKTtcbiAgICB9XG4gICAgXG4gICAgLy8gxJDDoyBj4bqtcCBuaOG6rXQgeG9uZyBjYXRlZ29yaWVzXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gWOG7rSBsw70gbOG7l2kgbuG6v3UgY8OzXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNlZWRDYXRlZ29yaWVzOyAiXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxXQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsTUFBTUMsY0FBYyxHQUFHLE1BQUFBLENBQUEsS0FBWTtFQUNqQyxJQUFJO0lBQ0YsTUFBTUMsVUFBVSxHQUFHO0lBQ2pCO01BQ0VDLFlBQVksRUFBRSxNQUFNO01BQ3BCQyxZQUFZLEVBQUU7SUFDaEIsQ0FBQztJQUNEO01BQ0VELFlBQVksRUFBRSxLQUFLO01BQ25CQyxZQUFZLEVBQUU7SUFDaEIsQ0FBQztJQUNEO01BQ0VELFlBQVksRUFBRSxNQUFNO01BQ3BCQyxZQUFZLEVBQUU7SUFDaEIsQ0FBQyxDQUNGOzs7SUFFRCxLQUFLLE1BQU1DLFFBQVEsSUFBSUgsVUFBVSxFQUFFO01BQ2pDLE1BQU1JLG1CQUFRLENBQUNDLGdCQUFnQjtRQUM3QixFQUFFSixZQUFZLEVBQUVFLFFBQVEsQ0FBQ0YsWUFBWSxDQUFDLENBQUM7UUFDdkNFLFFBQVE7UUFDUixFQUFFRyxNQUFNLEVBQUUsSUFBSSxDQUFDO01BQ2pCLENBQUM7SUFDSDs7SUFFQTtFQUNGLENBQUMsQ0FBQyxPQUFPQyxLQUFLLEVBQUU7O0lBQ2Q7RUFBQSxDQUVKLENBQUMsQ0FBQyxJQUFBQyxRQUFBLEdBQUFDLE9BQUEsQ0FBQUMsT0FBQTs7QUFFYVgsY0FBYyIsImlnbm9yZUxpc3QiOltdfQ==