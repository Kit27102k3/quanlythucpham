import Category from '../Model/Category.js';

export const seedCategories = async () => {
  try {
    // Kiểm tra xem đã có categories chưa
    const count = await Category.countDocuments();
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
          'Nước sữa trái cây'
        ]
      },
      {
        name: 'Sữa các loại, tã bỉm',
        subcategories: [
          'Sữa tươi',
          'Sữa đậu nành, sữa từ hạt',
          'Sữa đặc',
          'Sữa chua, phô mai',
          'Sữa bột, bột ăn dặm'
        ]
      },
      {
        name: 'Mì, cháo, phở ăn liền',
        subcategories: [
          'Mì ăn liền',
          'Cháo ăn liền',
          'Phở ăn liền',
          'Thực phẩm ăn liền khác'
        ]
      }
    ];

    // Thêm categories vào database
    await Category.insertMany(defaultCategories);
    console.log('Categories seeded successfully');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
}; 