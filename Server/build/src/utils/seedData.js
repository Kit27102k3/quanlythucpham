"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.seedCategories = void 0;var _Category = _interopRequireDefault(require("../Model/Category.js"));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfQ2F0ZWdvcnkiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsInNlZWRDYXRlZ29yaWVzIiwiY291bnQiLCJDYXRlZ29yeSIsImNvdW50RG9jdW1lbnRzIiwiY29uc29sZSIsImxvZyIsImRlZmF1bHRDYXRlZ29yaWVzIiwibmFtZSIsInN1YmNhdGVnb3JpZXMiLCJpbnNlcnRNYW55IiwiZXJyb3IiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3V0aWxzL3NlZWREYXRhLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBDYXRlZ29yeSBmcm9tICcuLi9Nb2RlbC9DYXRlZ29yeS5qcyc7XHJcblxyXG5leHBvcnQgY29uc3Qgc2VlZENhdGVnb3JpZXMgPSBhc3luYyAoKSA9PiB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIEtp4buDbSB0cmEgeGVtIMSRw6MgY8OzIGNhdGVnb3JpZXMgY2jGsGFcclxuICAgIGNvbnN0IGNvdW50ID0gYXdhaXQgQ2F0ZWdvcnkuY291bnREb2N1bWVudHMoKTtcclxuICAgIGlmIChjb3VudCA+IDApIHtcclxuICAgICAgY29uc29sZS5sb2coJ0NhdGVnb3JpZXMgYWxyZWFkeSBzZWVkZWQnKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERhbmggc8OhY2ggY2F0ZWdvcmllcyBt4bq3YyDEkeG7i25oXHJcbiAgICBjb25zdCBkZWZhdWx0Q2F0ZWdvcmllcyA9IFtcclxuICAgICAge1xyXG4gICAgICAgIG5hbWU6ICfEkOG7kyB14buRbmcgY8OhYyBsb+G6oWknLFxyXG4gICAgICAgIHN1YmNhdGVnb3JpZXM6IFtcclxuICAgICAgICAgICdOxrDhu5tjIG5n4buNdCwgZ2nhuqNpIGtow6F0JyxcclxuICAgICAgICAgICdCaWEsIG7GsOG7m2MgdeG7kW5nIGPDsyBj4buTbicsXHJcbiAgICAgICAgICAnTsaw4bubYyBzdeG7kWknLFxyXG4gICAgICAgICAgJ07GsOG7m2MgdHLDoWkgY8OieSDDqXAnLFxyXG4gICAgICAgICAgJ07GsOG7m2MgeeG6v24nLFxyXG4gICAgICAgICAgJ0PDoCBwaMOqLCB0csOgJyxcclxuICAgICAgICAgICdOxrDhu5tjIHPhu69hIHRyw6FpIGPDonknXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogJ1Phu69hIGPDoWMgbG/huqFpLCB0w6MgYuG7iW0nLFxyXG4gICAgICAgIHN1YmNhdGVnb3JpZXM6IFtcclxuICAgICAgICAgICdT4buvYSB0xrDGoWknLFxyXG4gICAgICAgICAgJ1Phu69hIMSR4bqtdSBuw6BuaCwgc+G7r2EgdOG7qyBo4bqhdCcsXHJcbiAgICAgICAgICAnU+G7r2EgxJHhurdjJyxcclxuICAgICAgICAgICdT4buvYSBjaHVhLCBwaMO0IG1haScsXHJcbiAgICAgICAgICAnU+G7r2EgYuG7mXQsIGLhu5l0IMSDbiBk4bq3bSdcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBuYW1lOiAnTcOsLCBjaMOhbywgcGjhu58gxINuIGxp4buBbicsXHJcbiAgICAgICAgc3ViY2F0ZWdvcmllczogW1xyXG4gICAgICAgICAgJ03DrCDEg24gbGnhu4FuJyxcclxuICAgICAgICAgICdDaMOhbyDEg24gbGnhu4FuJyxcclxuICAgICAgICAgICdQaOG7nyDEg24gbGnhu4FuJyxcclxuICAgICAgICAgICdUaOG7sWMgcGjhuqltIMSDbiBsaeG7gW4ga2jDoWMnXHJcbiAgICAgICAgXVxyXG4gICAgICB9XHJcbiAgICBdO1xyXG5cclxuICAgIC8vIFRow6ptIGNhdGVnb3JpZXMgdsOgbyBkYXRhYmFzZVxyXG4gICAgYXdhaXQgQ2F0ZWdvcnkuaW5zZXJ0TWFueShkZWZhdWx0Q2F0ZWdvcmllcyk7XHJcbiAgICBjb25zb2xlLmxvZygnQ2F0ZWdvcmllcyBzZWVkZWQgc3VjY2Vzc2Z1bGx5Jyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlZWRpbmcgY2F0ZWdvcmllczonLCBlcnJvcik7XHJcbiAgfVxyXG59OyAiXSwibWFwcGluZ3MiOiJnTUFBQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7O0FBRU8sTUFBTUMsY0FBYyxHQUFHLE1BQUFBLENBQUEsS0FBWTtFQUN4QyxJQUFJO0lBQ0Y7SUFDQSxNQUFNQyxLQUFLLEdBQUcsTUFBTUMsaUJBQVEsQ0FBQ0MsY0FBYyxDQUFDLENBQUM7SUFDN0MsSUFBSUYsS0FBSyxHQUFHLENBQUMsRUFBRTtNQUNiRyxPQUFPLENBQUNDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQztNQUN4QztJQUNGOztJQUVBO0lBQ0EsTUFBTUMsaUJBQWlCLEdBQUc7SUFDeEI7TUFDRUMsSUFBSSxFQUFFLGtCQUFrQjtNQUN4QkMsYUFBYSxFQUFFO01BQ2Isc0JBQXNCO01BQ3RCLHVCQUF1QjtNQUN2QixXQUFXO01BQ1gsa0JBQWtCO01BQ2xCLFVBQVU7TUFDVixhQUFhO01BQ2IsbUJBQW1COztJQUV2QixDQUFDO0lBQ0Q7TUFDRUQsSUFBSSxFQUFFLHNCQUFzQjtNQUM1QkMsYUFBYSxFQUFFO01BQ2IsVUFBVTtNQUNWLDBCQUEwQjtNQUMxQixTQUFTO01BQ1QsbUJBQW1CO01BQ25CLHFCQUFxQjs7SUFFekIsQ0FBQztJQUNEO01BQ0VELElBQUksRUFBRSx1QkFBdUI7TUFDN0JDLGFBQWEsRUFBRTtNQUNiLFlBQVk7TUFDWixjQUFjO01BQ2QsYUFBYTtNQUNiLHdCQUF3Qjs7SUFFNUIsQ0FBQyxDQUNGOzs7SUFFRDtJQUNBLE1BQU1OLGlCQUFRLENBQUNPLFVBQVUsQ0FBQ0gsaUJBQWlCLENBQUM7SUFDNUNGLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLGdDQUFnQyxDQUFDO0VBQy9DLENBQUMsQ0FBQyxPQUFPSyxLQUFLLEVBQUU7SUFDZE4sT0FBTyxDQUFDTSxLQUFLLENBQUMsMkJBQTJCLEVBQUVBLEtBQUssQ0FBQztFQUNuRDtBQUNGLENBQUMsQ0FBQ0MsT0FBQSxDQUFBWCxjQUFBLEdBQUFBLGNBQUEiLCJpZ25vcmVMaXN0IjpbXX0=