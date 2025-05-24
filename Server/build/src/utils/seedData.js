"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.seedCategories = void 0;var _Category = _interopRequireDefault(require("../Model/Category.js"));function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };}

const seedCategories = async () => {
  try {
    // Kiểm tra xem đã có categories chưa
    const count = await _Category.default.countDocuments();
    if (count > 0) {
      console.log('Categories already seeded');
      return;
    }

    // Danh sách categories mặc định
    const defaultCategories = [
    {
      name: 'Đồ uống các loại',
      subcategories: [
      'Nước ngọt, giải khát',
      'Bia, nước uống có cồn',
      'Nước suối',
      'Nước trái cây ép',
      'Nước yến',
      'Cà phê, trà',
      'Nước sữa trái cây']

    },
    {
      name: 'Sữa các loại, tã bỉm',
      subcategories: [
      'Sữa tươi',
      'Sữa đậu nành, sữa từ hạt',
      'Sữa đặc',
      'Sữa chua, phô mai',
      'Sữa bột, bột ăn dặm']

    },
    {
      name: 'Mì, cháo, phở ăn liền',
      subcategories: [
      'Mì ăn liền',
      'Cháo ăn liền',
      'Phở ăn liền',
      'Thực phẩm ăn liền khác']

    }];


    // Thêm categories vào database
    await _Category.default.insertMany(defaultCategories);
    console.log('Categories seeded successfully');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};exports.seedCategories = seedCategories;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfQ2F0ZWdvcnkiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsInNlZWRDYXRlZ29yaWVzIiwiY291bnQiLCJDYXRlZ29yeSIsImNvdW50RG9jdW1lbnRzIiwiY29uc29sZSIsImxvZyIsImRlZmF1bHRDYXRlZ29yaWVzIiwibmFtZSIsInN1YmNhdGVnb3JpZXMiLCJpbnNlcnRNYW55IiwiZXJyb3IiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL3NlZWREYXRhLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBDYXRlZ29yeSBmcm9tICcuLi9Nb2RlbC9DYXRlZ29yeS5qcyc7XHJcblxyXG5leHBvcnQgY29uc3Qgc2VlZENhdGVnb3JpZXMgPSBhc3luYyAoKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIEtp4buDbSB0cmEgeGVtIMSRw6MgY8OzIGNhdGVnb3JpZXMgY2jGsGFcclxuICAgIGNvbnN0IGNvdW50ID0gYXdhaXQgQ2F0ZWdvcnkuY291bnREb2N1bWVudHMoKTtcclxuICAgIGlmIChjb3VudCA+IDApIHtcclxuICAgICAgY29uc29sZS5sb2coJ0NhdGVnb3JpZXMgYWxyZWFkeSBzZWVkZWQnKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERhbmggc8OhY2ggY2F0ZWdvcmllcyBt4bq3YyDEkeG7i25oXHJcbiAgICBjb25zdCBkZWZhdWx0Q2F0ZWdvcmllcyA9IFtcclxuICAgICAge1xyXG4gICAgICAgIG5hbWU6ICfEkOG7kyB14buRbmcgY8OhYyBsb+G6oWknLFxyXG4gICAgICAgIHN1YmNhdGVnb3JpZXM6IFtcclxuICAgICAgICAgICdOxrDhu5tjIG5n4buNdCwgZ2nhuqNpIGtow6F0JyxcclxuICAgICAgICAgICdCaWEsIG7GsOG7m2MgdeG7kW5nIGPDsyBj4buTbicsXHJcbiAgICAgICAgICAnTsaw4bubYyBzdeG7kWknLFxyXG4gICAgICAgICAgJ07GsOG7m2MgdHLDoWkgY8OieSDDqXAnLFxyXG4gICAgICAgICAgJ07GsOG7m2MgeeG6v24nLFxyXG4gICAgICAgICAgJ0PDoCBwaMOqLCB0csOgJyxcclxuICAgICAgICAgICdOxrDhu5tjIHPhu69hIHRyw6FpIGPDonknXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogJ1Phu69hIGPDoWMgbG/huqFpLCB0w6MgYuG7iW0nLFxyXG4gICAgICAgIHN1YmNhdGVnb3JpZXM6IFtcclxuICAgICAgICAgICdT4buvYSB0xrDGoWknLFxyXG4gICAgICAgICAgJ1Phu69hIMSR4bqtdSBuw6BuaCwgc+G7r2EgdOG7qyBo4bqhdCcsXHJcbiAgICAgICAgICAnU+G7r2EgxJHhurdjJyxcclxuICAgICAgICAgICdT4buvYSBjaHVhLCBwaMO0IG1haScsXHJcbiAgICAgICAgICAnU+G7r2EgYuG7mXQsIGLhu5l0IMSDbiBk4bq3bSdcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBuYW1lOiAnTcOsLCBjaMOhbywgcGjhu58gxINuIGxp4buBbicsXHJcbiAgICAgICAgc3ViY2F0ZWdvcmllczogW1xyXG4gICAgICAgICAgJ03DrCDEg24gbGnhu4FuJyxcclxuICAgICAgICAgICdDaMOhbyDEg24gbGnhu4FuJyxcclxuICAgICAgICAgICdQaOG7nyDEg24gbGnhu4FuJyxcclxuICAgICAgICAgICdUaOG7sWMgcGjhuqltIMSDbiBsaeG7gW4ga2jDoWMnXHJcbiAgICAgICAgXVxyXG4gICAgICB9XHJcbiAgICBdO1xyXG5cclxuICAgIC8vIFRow6ptIGNhdGVnb3JpZXMgdsOgbyBkYXRhYmFzZVxyXG4gICAgYXdhaXQgQ2F0ZWdvcnkuaW5zZXJ0TWFueShkZWZhdWx0Q2F0ZWdvcmllcyk7XHJcbiAgICBjb25zb2xlLmxvZygnQ2F0ZWdvcmllcyBzZWVkZWQgc3VjY2Vzc2Z1bGx5Jyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlZWRpbmcgY2F0ZWdvcmllczonLCBlcnJvcik7XHJcbiAgfVxyXG59OyAiXSwibWFwcGluZ3MiOiIyR0FBQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUEsMEJBQTRDLFNBQUFELHVCQUFBRSxDQUFBLFVBQUFBLENBQUEsSUFBQUEsQ0FBQSxDQUFBQyxVQUFBLEdBQUFELENBQUEsS0FBQUUsT0FBQSxFQUFBRixDQUFBOztBQUVyQyxNQUFNRyxjQUFjLEdBQUcsTUFBQUEsQ0FBQSxLQUFZO0VBQ3hDLElBQUk7SUFDRjtJQUNBLE1BQU1DLEtBQUssR0FBRyxNQUFNQyxpQkFBUSxDQUFDQyxjQUFjLENBQUMsQ0FBQztJQUM3QyxJQUFJRixLQUFLLEdBQUcsQ0FBQyxFQUFFO01BQ2JHLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLDJCQUEyQixDQUFDO01BQ3hDO0lBQ0Y7O0lBRUE7SUFDQSxNQUFNQyxpQkFBaUIsR0FBRztJQUN4QjtNQUNFQyxJQUFJLEVBQUUsa0JBQWtCO01BQ3hCQyxhQUFhLEVBQUU7TUFDYixzQkFBc0I7TUFDdEIsdUJBQXVCO01BQ3ZCLFdBQVc7TUFDWCxrQkFBa0I7TUFDbEIsVUFBVTtNQUNWLGFBQWE7TUFDYixtQkFBbUI7O0lBRXZCLENBQUM7SUFDRDtNQUNFRCxJQUFJLEVBQUUsc0JBQXNCO01BQzVCQyxhQUFhLEVBQUU7TUFDYixVQUFVO01BQ1YsMEJBQTBCO01BQzFCLFNBQVM7TUFDVCxtQkFBbUI7TUFDbkIscUJBQXFCOztJQUV6QixDQUFDO0lBQ0Q7TUFDRUQsSUFBSSxFQUFFLHVCQUF1QjtNQUM3QkMsYUFBYSxFQUFFO01BQ2IsWUFBWTtNQUNaLGNBQWM7TUFDZCxhQUFhO01BQ2Isd0JBQXdCOztJQUU1QixDQUFDLENBQ0Y7OztJQUVEO0lBQ0EsTUFBTU4saUJBQVEsQ0FBQ08sVUFBVSxDQUFDSCxpQkFBaUIsQ0FBQztJQUM1Q0YsT0FBTyxDQUFDQyxHQUFHLENBQUMsZ0NBQWdDLENBQUM7RUFDL0MsQ0FBQyxDQUFDLE9BQU9LLEtBQUssRUFBRTtJQUNkTixPQUFPLENBQUNNLEtBQUssQ0FBQywyQkFBMkIsRUFBRUEsS0FBSyxDQUFDO0VBQ25EO0FBQ0YsQ0FBQyxDQUFDQyxPQUFBLENBQUFYLGNBQUEsR0FBQUEsY0FBQSIsImlnbm9yZUxpc3QiOltdfQ==