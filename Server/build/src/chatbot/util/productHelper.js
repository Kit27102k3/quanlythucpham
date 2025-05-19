"use strict";

/**
 * Công cụ sinh dữ liệu thông tin cho sản phẩm
 * Hỗ trợ tạo dữ liệu về công dụng, cách sử dụng, và các thông tin liên quan
 * cho chatbot khi không có sẵn trong database
 */

/**
 * Sinh công dụng cho sản phẩm dựa trên tên và loại sản phẩm
 * @param {Object} product - Sản phẩm cần sinh công dụng
 * @returns {string} - Công dụng của sản phẩm
 */
var generateProductUsage = function generateProductUsage(product) {
  var _product$productName, _product$productCateg;
  if (!product) return "Không có thông tin về công dụng của sản phẩm này.";
  var productName = ((_product$productName = product.productName) === null || _product$productName === void 0 ? void 0 : _product$productName.toLowerCase()) || '';
  var category = ((_product$productCateg = product.productCategory) === null || _product$productCateg === void 0 ? void 0 : _product$productCateg.toLowerCase()) || '';
  var description = product.productInfo || product.productDetails || '';

  // Từ khóa cho từng loại sản phẩm
  var fruitKeywords = ['trái cây', 'quả', 'cherry', 'táo', 'nho', 'cam', 'bưởi', 'chuối', 'dưa', 'dứa', 'xoài', 'ổi', 'lê', 'đào', 'berry'];
  var vegetableKeywords = ['rau', 'củ', 'quả', 'cà rốt', 'bắp cải', 'xà lách', 'cải', 'bông cải', 'hành', 'tỏi', 'khoai', 'cà chua', 'dưa chuột'];
  var milkKeywords = ['sữa', 'yaourt', 'yogurt', 'phô mai', 'cheese', 'sữa chua'];
  var meatKeywords = ['thịt', 'gà', 'heo', 'bò', 'cừu', 'vịt', 'ngỗng', 'thịt hộp', 'đùi', 'cánh', 'ức', 'ba chỉ', 'sườn', 'cốt lết'];
  var seafoodKeywords = ['hải sản', 'cá', 'tôm', 'cua', 'ghẹ', 'mực', 'sò', 'hàu', 'ốc', 'nghêu', 'sushi', 'sashimi'];
  var drinkKeywords = ['nước', 'drink', 'đồ uống', 'nước ngọt', 'soda', 'coca', 'pepsi', 'trà', 'cà phê', 'coffee', 'sinh tố', 'nước ép'];
  var snackKeywords = ['snack', 'bánh', 'kẹo', 'chocolate', 'socola', 'bim bim', 'hạt', 'bery', 'kernel'];
  var organicKeywords = ['organic', 'hữu cơ', 'sạch', 'không thuốc', 'không hóa chất', 'tự nhiên'];

  // Xác định loại sản phẩm dựa vào tên và danh mục
  var productType = 'general';
  if (fruitKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'fruit';
  } else if (vegetableKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'vegetable';
  } else if (milkKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'milk';
  } else if (meatKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'meat';
  } else if (seafoodKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'seafood';
  } else if (drinkKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'drink';
  } else if (snackKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'snack';
  }

  // Kiểm tra xem sản phẩm có phải là dâu tây
  if (productName.includes('dâu tây') || productName.includes('strawberry')) {
    return "".concat(product.productName, " n\u1ED5i ti\u1EBFng v\u1EDBi h\u01B0\u01A1ng v\u1ECB ng\u1ECDt th\u01A1m v\xE0 nhi\u1EC1u c\xF4ng d\u1EE5ng tuy\u1EC7t v\u1EDDi cho s\u1EE9c kh\u1ECFe. Ch\u1EE9a h\xE0m l\u01B0\u1EE3ng cao vitamin C, ch\u1EA5t ch\u1ED1ng oxy h\xF3a, ch\u1EA5t x\u01A1 v\xE0 c\xE1c h\u1EE3p ch\u1EA5t th\u1EF1c v\u1EADt c\xF3 l\u1EE3i. Gi\xFAp t\u0103ng c\u01B0\u1EDDng h\u1EC7 mi\u1EC5n d\u1ECBch, c\u1EA3i thi\u1EC7n s\u1EE9c kh\u1ECFe tim m\u1EA1ch, ki\u1EC3m so\xE1t \u0111\u01B0\u1EDDng huy\u1EBFt, h\u1ED7 tr\u1EE3 ti\xEAu h\xF3a, ch\u1ED1ng l\xE3o h\xF3a, b\u1ED3i b\u1ED5 c\u01A1 th\u1EC3, b\u1ED5 m\xE1u, gi\u1EA3m vi\xEAm nhi\u1EC5m, l\xE0m \u0111\u1EB9p da, b\u1ED3i b\u1ED5 cho ng\u01B0\u1EDDi \u1ED1m y\u1EBFu, ph\u1EE5 n\u1EEF mang thai v\xE0 tr\u1EBB em \u0111ang ph\xE1t tri\u1EC3n.");
  }

  // Kiểm tra xem sản phẩm có phải là organic không
  var isOrganic = organicKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw) || description.includes(kw);
  });

  // Sinh công dụng dựa trên loại sản phẩm
  var usage = '';
  switch (productType) {
    case 'fruit':
      usage = "".concat(product.productName, " ").concat(isOrganic ? 'hữu cơ ' : '', "l\xE0 ngu\u1ED3n cung c\u1EA5p vitamin, kho\xE1ng ch\u1EA5t v\xE0 ch\u1EA5t x\u01A1 t\u1EF1 nhi\xEAn tuy\u1EC7t v\u1EDDi cho c\u01A1 th\u1EC3. Gi\xFAp t\u0103ng c\u01B0\u1EDDng h\u1EC7 mi\u1EC5n d\u1ECBch, c\u1EA3i thi\u1EC7n ti\xEAu h\xF3a v\xE0 l\xE0m \u0111\u1EB9p da. \u0110\u1EB7c bi\u1EC7t ph\xF9 h\u1EE3p cho ng\u01B0\u1EDDi c\u1EA7n b\u1ED5 sung dinh d\u01B0\u1EE1ng, ng\u01B0\u1EDDi \u0103n ki\xEAng v\xE0 tr\u1EBB em \u0111ang trong giai \u0111o\u1EA1n ph\xE1t tri\u1EC3n.");
      break;
    case 'vegetable':
      usage = "".concat(product.productName, " ").concat(isOrganic ? 'hữu cơ ' : '', "l\xE0 ngu\u1ED3n cung c\u1EA5p vitamin, kho\xE1ng ch\u1EA5t v\xE0 ch\u1EA5t x\u01A1 d\u1ED3i d\xE0o, h\u1ED7 tr\u1EE3 qu\xE1 tr\xECnh ti\xEAu h\xF3a, t\u0103ng c\u01B0\u1EDDng s\u1EE9c kh\u1ECFe tim m\u1EA1ch v\xE0 h\u1EC7 mi\u1EC5n d\u1ECBch. \u0110\u1EB7c bi\u1EC7t th\xEDch h\u1EE3p cho ng\u01B0\u1EDDi \u0103n ki\xEAng, ng\u01B0\u1EDDi theo ch\u1EBF \u0111\u1ED9 \u0103n chay v\xE0 ng\u01B0\u1EDDi mu\u1ED1n duy tr\xEC l\u1ED1i s\u1ED1ng l\xE0nh m\u1EA1nh.");
      break;
    case 'milk':
      usage = "".concat(product.productName, " l\xE0 ngu\u1ED3n cung c\u1EA5p canxi, protein v\xE0 vitamin D d\u1ED3i d\xE0o, gi\xFAp ph\xE1t tri\u1EC3n x\u01B0\u01A1ng v\xE0 c\u01A1 b\u1EAFp kh\u1ECFe m\u1EA1nh. \u0110\u1EB7c bi\u1EC7t ph\xF9 h\u1EE3p cho tr\u1EBB em \u0111ang ph\xE1t tri\u1EC3n, ng\u01B0\u1EDDi cao tu\u1ED5i, ph\u1EE5 n\u1EEF mang thai v\xE0 sau sinh.");
      break;
    case 'meat':
      usage = "".concat(product.productName, " ").concat(isOrganic ? 'hữu cơ ' : '', "l\xE0 ngu\u1ED3n protein ch\u1EA5t l\u01B0\u1EE3ng cao, s\u1EAFt v\xE0 vitamin B12, gi\xFAp ph\xE1t tri\u1EC3n c\u01A1 b\u1EAFp, t\u0103ng c\u01B0\u1EDDng s\u1EE9c kh\u1ECFe v\xE0 cung c\u1EA5p n\u0103ng l\u01B0\u1EE3ng cho c\u01A1 th\u1EC3. \u0110\u1EB7c bi\u1EC7t th\xEDch h\u1EE3p cho ng\u01B0\u1EDDi t\u1EADp th\u1EC3 thao, ng\u01B0\u1EDDi c\u1EA7n b\u1ED5 sung dinh d\u01B0\u1EE1ng v\xE0 ph\u1EE5c h\u1ED3i s\u1EE9c kh\u1ECFe.");
      break;
    case 'seafood':
      usage = "".concat(product.productName, " l\xE0 ngu\u1ED3n cung c\u1EA5p protein ch\u1EA5t l\u01B0\u1EE3ng cao, omega-3, i\u1ED1t v\xE0 c\xE1c kho\xE1ng ch\u1EA5t thi\u1EBFt y\u1EBFu, h\u1ED7 tr\u1EE3 s\u1EE9c kh\u1ECFe tim m\u1EA1ch, n\xE3o b\u1ED9 v\xE0 tuy\u1EBFn gi\xE1p. \u0110\u1EB7c bi\u1EC7t th\xEDch h\u1EE3p cho ng\u01B0\u1EDDi mu\u1ED1n duy tr\xEC ch\u1EBF \u0111\u1ED9 \u0103n u\u1ED1ng c\xE2n b\u1EB1ng v\xE0 l\xE0nh m\u1EA1nh.");
      break;
    case 'drink':
      usage = "".concat(product.productName, " gi\xFAp gi\u1EA3i kh\xE1t, b\u1ED5 sung n\u01B0\u1EDBc v\xE0 c\xE1c ch\u1EA5t \u0111i\u1EC7n gi\u1EA3i c\u1EA7n thi\u1EBFt cho c\u01A1 th\u1EC3, \u0111\u1EB7c bi\u1EC7t trong th\u1EDDi ti\u1EBFt n\xF3ng ho\u1EB7c sau khi t\u1EADp luy\u1EC7n. Ngo\xE0i ra c\xF2n cung c\u1EA5p n\u0103ng l\u01B0\u1EE3ng v\xE0 c\xE1c d\u01B0\u1EE1ng ch\u1EA5t t\xF9y theo th\xE0nh ph\u1EA7n c\u1EE7a \u0111\u1ED3 u\u1ED1ng.");
      break;
    case 'snack':
      usage = "".concat(product.productName, " l\xE0 l\u1EF1a ch\u1ECDn ti\u1EC7n l\u1EE3i \u0111\u1EC3 b\u1ED5 sung n\u0103ng l\u01B0\u1EE3ng nhanh ch\xF3ng gi\u1EEFa c\xE1c b\u1EEFa \u0103n ch\xEDnh, \u0111\u1EB7c bi\u1EC7t ph\xF9 h\u1EE3p cho ng\u01B0\u1EDDi b\u1EADn r\u1ED9n, tr\u1EBB em v\xE0 ng\u01B0\u1EDDi c\u1EA7n t\u0103ng c\u01B0\u1EDDng calorie. C\xF3 th\u1EC3 d\xF9ng nh\u01B0 m\u1ED9t ph\u1EA7n c\u1EE7a b\u1EEFa \u0103n nh\u1EB9 ho\u1EB7c gi\u1EEFa c\xE1c b\u1EEFa ch\xEDnh.");
      break;
    default:
      usage = "".concat(product.productName, " ").concat(isOrganic ? 'hữu cơ ' : '', "cung c\u1EA5p c\xE1c d\u01B0\u1EE1ng ch\u1EA5t c\u1EA7n thi\u1EBFt cho c\u01A1 th\u1EC3, h\u1ED7 tr\u1EE3 s\u1EE9c kh\u1ECFe t\u1ED5ng th\u1EC3 v\xE0 t\u0103ng c\u01B0\u1EDDng s\u1EE9c \u0111\u1EC1 kh\xE1ng. S\u1EA3n ph\u1EA9m \u0111\u01B0\u1EE3c DNC FOOD tuy\u1EC3n ch\u1ECDn k\u1EF9 l\u01B0\u1EE1ng \u0111\u1EC3 \u0111\u1EA3m b\u1EA3o ch\u1EA5t l\u01B0\u1EE3ng v\xE0 an to\xE0n th\u1EF1c ph\u1EA9m cho ng\u01B0\u1EDDi ti\xEAu d\xF9ng.");
  }

  // Bổ sung thông tin về tính organic nếu có
  if (isOrganic) {
    usage += " V\u1EDBi quy tr\xECnh s\u1EA3n xu\u1EA5t h\u1EEFu c\u01A1, s\u1EA3n ph\u1EA9m kh\xF4ng ch\u1EE9a h\xF3a ch\u1EA5t \u0111\u1ED9c h\u1EA1i, thu\u1ED1c tr\u1EEB s\xE2u, kh\xF4ng bi\u1EBFn \u0111\u1ED5i gen, gi\xFAp ng\u01B0\u1EDDi ti\xEAu d\xF9ng an t\xE2m v\u1EC1 s\u1EE9c kh\u1ECFe v\xE0 th\xE2n thi\u1EC7n v\u1EDBi m\xF4i tr\u01B0\u1EDDng.";
  }
  return usage;
};

/**
 * Sinh cách sử dụng cho sản phẩm
 * @param {Object} product - Sản phẩm cần sinh cách sử dụng
 * @returns {string} - Cách sử dụng sản phẩm
 */
var generateHowToUse = function generateHowToUse(product) {
  var _product$productName2, _product$productCateg2;
  if (!product) return "Không có thông tin về cách sử dụng sản phẩm này.";
  var productName = ((_product$productName2 = product.productName) === null || _product$productName2 === void 0 ? void 0 : _product$productName2.toLowerCase()) || '';
  var category = ((_product$productCateg2 = product.productCategory) === null || _product$productCateg2 === void 0 ? void 0 : _product$productCateg2.toLowerCase()) || '';

  // Kiểm tra xem sản phẩm có phải là dâu tây 
  if (productName.includes('dâu tây') || productName.includes('strawberry')) {
    return "".concat(product.productName, " n\xEAn \u0111\u01B0\u1EE3c r\u1EEDa s\u1EA1ch d\u01B0\u1EDBi v\xF2i n\u01B0\u1EDBc tr\u01B0\u1EDBc khi \u0103n. N\xEAn ng\xE2m trong n\u01B0\u1EDBc mu\u1ED1i lo\xE3ng kho\u1EA3ng 5-10 ph\xFAt \u0111\u1EC3 lo\u1EA1i b\u1ECF thu\u1ED1c tr\u1EEB s\xE2u v\xE0 b\u1EE5i b\u1EA9n, sau \u0111\xF3 r\u1EEDa l\u1EA1i v\u1EDBi n\u01B0\u1EDBc s\u1EA1ch. D\xE2u t\xE2y c\xF3 th\u1EC3 \u0103n tr\u1EF1c ti\u1EBFp, l\xE0m sinh t\u1ED1, n\u01B0\u1EDBc \xE9p, th\xEAm v\xE0o salad tr\xE1i c\xE2y, l\xE0m m\u1EE9t, l\xE0m b\xE1nh ho\u1EB7c c\xE1c m\xF3n tr\xE1ng mi\u1EC7ng. B\u1EA3o qu\u1EA3n trong ng\u0103n m\xE1t t\u1EE7 l\u1EA1nh (2-5\xB0C) \u0111\u1EC3 gi\u1EEF \u0111\u1ED9 t\u01B0\u01A1i ngon, n\xEAn \u0111\u1EB7t trong h\u1ED9p k\xEDn c\xF3 l\u1ED7 th\xF4ng kh\xED. T\u1ED1t nh\u1EA5t n\xEAn s\u1EED d\u1EE5ng trong v\xF2ng 2-3 ng\xE0y sau khi mua.");
  }

  // Từ khóa cho từng loại sản phẩm (tương tự như ở trên)
  var fruitKeywords = ['trái cây', 'quả', 'cherry', 'táo', 'nho', 'cam', 'bưởi', 'chuối', 'dưa', 'dứa', 'xoài', 'ổi', 'lê', 'đào', 'berry'];
  var vegetableKeywords = ['rau', 'củ', 'quả', 'cà rốt', 'bắp cải', 'xà lách', 'cải', 'bông cải', 'hành', 'tỏi', 'khoai', 'cà chua', 'dưa chuột'];
  var milkKeywords = ['sữa', 'yaourt', 'yogurt', 'phô mai', 'cheese', 'sữa chua'];
  var meatKeywords = ['thịt', 'gà', 'heo', 'bò', 'cừu', 'vịt', 'ngỗng', 'thịt hộp', 'đùi', 'cánh', 'ức', 'ba chỉ', 'sườn', 'cốt lết'];
  var seafoodKeywords = ['hải sản', 'cá', 'tôm', 'cua', 'ghẹ', 'mực', 'sò', 'hàu', 'ốc', 'nghêu', 'sushi', 'sashimi'];
  var drinkKeywords = ['nước', 'drink', 'đồ uống', 'nước ngọt', 'soda', 'coca', 'pepsi', 'trà', 'cà phê', 'coffee', 'sinh tố', 'nước ép'];
  var snackKeywords = ['snack', 'bánh', 'kẹo', 'chocolate', 'socola', 'bim bim', 'hạt', 'bery', 'kernel'];

  // Xác định loại sản phẩm
  var productType = 'general';
  if (fruitKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'fruit';
  } else if (vegetableKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'vegetable';
  } else if (milkKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'milk';
  } else if (meatKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'meat';
  } else if (seafoodKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'seafood';
  } else if (drinkKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'drink';
  } else if (snackKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  })) {
    productType = 'snack';
  }

  // Sinh cách sử dụng dựa trên loại sản phẩm
  var howToUse = '';
  switch (productType) {
    case 'fruit':
      howToUse = "\u0110\u1EC3 t\u1EADn d\u1EE5ng t\u1ED1i \u0111a gi\xE1 tr\u1ECB dinh d\u01B0\u1EE1ng c\u1EE7a ".concat(product.productName, ", b\u1EA1n n\xEAn r\u1EEDa s\u1EA1ch d\u01B0\u1EDBi v\xF2i n\u01B0\u1EDBc tr\u01B0\u1EDBc khi \u0103n. C\xF3 th\u1EC3 \u0103n tr\u1EF1c ti\u1EBFp, \xE9p th\xE0nh n\u01B0\u1EDBc, l\xE0m sinh t\u1ED1 ho\u1EB7c th\xEAm v\xE0o salad, m\xF3n tr\xE1ng mi\u1EC7ng. B\u1EA3o qu\u1EA3n trong ng\u0103n m\xE1t t\u1EE7 l\u1EA1nh \u0111\u1EC3 gi\u1EEF \u0111\u1ED9 t\u01B0\u01A1i ngon l\xE2u h\u01A1n.");
      break;
    case 'vegetable':
      howToUse = "".concat(product.productName, " n\xEAn \u0111\u01B0\u1EE3c r\u1EEDa s\u1EA1ch d\u01B0\u1EDBi v\xF2i n\u01B0\u1EDBc tr\u01B0\u1EDBc khi ch\u1EBF bi\u1EBFn. C\xF3 th\u1EC3 ch\u1EBF bi\u1EBFn b\u1EB1ng nhi\u1EC1u c\xE1ch nh\u01B0: x\xE0o, n\u1EA5u canh, h\u1EA5p, lu\u1ED9c ho\u1EB7c \u0103n s\u1ED1ng (v\u1EDBi c\xE1c lo\u1EA1i rau \u0103n s\u1ED1ng). B\u1EA3o qu\u1EA3n trong ng\u0103n m\xE1t t\u1EE7 l\u1EA1nh \u0111\u1EC3 gi\u1EEF \u0111\u1ED9 t\u01B0\u01A1i ngon l\xE2u h\u01A1n.");
      break;
    case 'milk':
      howToUse = "".concat(product.productName, " c\xF3 th\u1EC3 d\xF9ng tr\u1EF1c ti\u1EBFp, th\xEAm v\xE0o ng\u0169 c\u1ED1c, l\xE0m sinh t\u1ED1, n\u1EA5u ch\xE1o, l\xE0m b\xE1nh ho\u1EB7c c\xE1c m\xF3n tr\xE1ng mi\u1EC7ng. B\u1EA3o qu\u1EA3n trong t\u1EE7 l\u1EA1nh v\xE0 s\u1EED d\u1EE5ng tr\u01B0\u1EDBc h\u1EA1n s\u1EED d\u1EE5ng. L\u1EAFc \u0111\u1EC1u tr\u01B0\u1EDBc khi s\u1EED d\u1EE5ng.");
      break;
    case 'meat':
      howToUse = "".concat(product.productName, " n\xEAn \u0111\u01B0\u1EE3c ch\u1EBF bi\u1EBFn k\u1EF9 tr\u01B0\u1EDBc khi s\u1EED d\u1EE5ng. C\xF3 th\u1EC3 ch\u1EBF bi\u1EBFn b\u1EB1ng nhi\u1EC1u c\xE1ch nh\u01B0: n\u01B0\u1EDBng, chi\xEAn, x\xE0o, h\u1EA5p, lu\u1ED9c, kho. B\u1EA3o qu\u1EA3n trong ng\u0103n \u0111\xF4ng t\u1EE7 l\u1EA1nh n\u1EBFu ch\u01B0a s\u1EED d\u1EE5ng ngay. R\xE3 \u0111\xF4ng ho\xE0n to\xE0n tr\u01B0\u1EDBc khi ch\u1EBF bi\u1EBFn.");
      break;
    case 'seafood':
      howToUse = "".concat(product.productName, " c\u1EA7n \u0111\u01B0\u1EE3c ch\u1EBF bi\u1EBFn k\u1EF9 tr\u01B0\u1EDBc khi s\u1EED d\u1EE5ng. C\xF3 th\u1EC3 ch\u1EBF bi\u1EBFn b\u1EB1ng nhi\u1EC1u c\xE1ch nh\u01B0: h\u1EA5p, lu\u1ED9c, n\u01B0\u1EDBng, chi\xEAn, x\xE0o, kho. B\u1EA3o qu\u1EA3n trong ng\u0103n \u0111\xF4ng t\u1EE7 l\u1EA1nh n\u1EBFu ch\u01B0a s\u1EED d\u1EE5ng ngay. R\xE3 \u0111\xF4ng ho\xE0n to\xE0n tr\u01B0\u1EDBc khi ch\u1EBF bi\u1EBFn.");
      break;
    case 'drink':
      howToUse = "".concat(product.productName, " n\xEAn \u0111\u01B0\u1EE3c u\u1ED1ng l\u1EA1nh \u0111\u1EC3 c\u1EA3m nh\u1EADn h\u01B0\u01A1ng v\u1ECB t\u1ED1t nh\u1EA5t. B\u1EA3o qu\u1EA3n trong t\u1EE7 l\u1EA1nh sau khi m\u1EDF. L\u1EAFc \u0111\u1EC1u tr\u01B0\u1EDBc khi s\u1EED d\u1EE5ng (n\u1EBFu c\xF3 l\u1EDBp l\u1EAFng \u0111\u1ECDng). N\xEAn s\u1EED d\u1EE5ng h\u1EBFt trong v\xF2ng 24 gi\u1EDD sau khi m\u1EDF n\u1EAFp.");
      break;
    case 'snack':
      howToUse = "".concat(product.productName, " c\xF3 th\u1EC3 d\xF9ng tr\u1EF1c ti\u1EBFp nh\u01B0 m\xF3n \u0103n nh\u1EB9 gi\u1EEFa c\xE1c b\u1EEFa ch\xEDnh, khi \u0111i h\u1ECDc, \u0111i l\xE0m, \u0111i ch\u01A1i ho\u1EB7c khi xem phim. Sau khi m\u1EDF bao b\xEC, n\xEAn b\u1EA3o qu\u1EA3n trong h\u1ED9p k\xEDn \u0111\u1EC3 gi\u1EEF \u0111\u1ED9 gi\xF2n.");
      break;
    default:
      howToUse = "".concat(product.productName, " n\xEAn \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng theo h\u01B0\u1EDBng d\u1EABn tr\xEAn bao b\xEC. B\u1EA3o qu\u1EA3n \u1EDF n\u01A1i kh\xF4 r\xE1o, tho\xE1ng m\xE1t, tr\xE1nh \xE1nh n\u1EAFng tr\u1EF1c ti\u1EBFp. Vui l\xF2ng ki\u1EC3m tra h\u1EA1n s\u1EED d\u1EE5ng tr\u01B0\u1EDBc khi s\u1EED d\u1EE5ng.");
  }
  return howToUse;
};

/**
 * Sinh thông tin về xuất xứ sản phẩm
 * @param {Object} product - Sản phẩm cần sinh thông tin xuất xứ
 * @returns {string} - Thông tin xuất xứ
 */
var generateOrigin = function generateOrigin(product) {
  var _product$productName3;
  if (!product) return "Không có thông tin về xuất xứ của sản phẩm này.";
  var productName = ((_product$productName3 = product.productName) === null || _product$productName3 === void 0 ? void 0 : _product$productName3.toLowerCase()) || '';

  // Xử lý đặc biệt cho dâu tây
  if (productName.includes('dâu tây') || productName.includes('strawberry')) {
    if (productName.includes('đà lạt')) {
      return "".concat(product.productName, " \u0111\u01B0\u1EE3c tr\u1ED3ng t\u1EA1i v\xF9ng cao nguy\xEAn \u0110\xE0 L\u1EA1t, L\xE2m \u0110\u1ED3ng, n\u01A1i c\xF3 kh\xED h\u1EADu \xF4n \u0111\u1EDBi quanh n\u0103m, m\xE1t m\u1EBB v\xE0 l\xFD t\u01B0\u1EDFng cho vi\u1EC7c ph\xE1t tri\u1EC3n c\u1EE7a lo\u1EA1i qu\u1EA3 n\xE0y. \u0110\xE0 L\u1EA1t n\u1ED5i ti\u1EBFng v\u1EDBi c\xE1c s\u1EA3n ph\u1EA9m n\xF4ng nghi\u1EC7p s\u1EA1ch, an to\xE0n v\xE0 ch\u1EA5t l\u01B0\u1EE3ng cao.");
    }
  }

  // Nếu sản phẩm có thông tin xuất xứ, trả về thông tin đó
  if (product.origin || product.productOrigin) {
    return "".concat(product.productName, " c\xF3 xu\u1EA5t x\u1EE9 t\u1EEB ").concat(product.origin || product.productOrigin, ".");
  }

  // Nếu không có thông tin xuất xứ, trả về thông tin mặc định
  return "".concat(product.productName, " \u0111\u01B0\u1EE3c cung c\u1EA5p b\u1EDFi nh\xE0 cung c\u1EA5p uy t\xEDn, \u0111\u01B0\u1EE3c DNC FOOD l\u1EF1a ch\u1ECDn k\u1EF9 l\u01B0\u1EE1ng \u0111\u1EC3 \u0111\u1EA3m b\u1EA3o ch\u1EA5t l\u01B0\u1EE3ng v\xE0 an to\xE0n th\u1EF1c ph\u1EA9m. Vui l\xF2ng li\xEAn h\u1EC7 v\u1EDBi ch\xFAng t\xF4i qua s\u1ED1 \u0111i\u1EC7n tho\u1EA1i 0326 743 391 \u0111\u1EC3 bi\u1EBFt th\xEAm chi ti\u1EBFt v\u1EC1 xu\u1EA5t x\u1EE9 s\u1EA3n ph\u1EA9m.");
};

/**
 * Sinh thông tin về thành phần sản phẩm
 * @param {Object} product - Sản phẩm cần sinh thông tin thành phần
 * @returns {string} - Thông tin thành phần
 */
var generateIngredients = function generateIngredients(product) {
  var _product$productName4, _product$productCateg3;
  if (!product) return "Không có thông tin về thành phần của sản phẩm này.";
  var productName = ((_product$productName4 = product.productName) === null || _product$productName4 === void 0 ? void 0 : _product$productName4.toLowerCase()) || '';

  // Xử lý đặc biệt cho dâu tây
  if (productName.includes('dâu tây') || productName.includes('strawberry')) {
    return "".concat(product.productName, " l\xE0 s\u1EA3n ph\u1EA9m t\u1EF1 nhi\xEAn 100%, kh\xF4ng c\xF3 th\xE0nh ph\u1EA7n ph\u1EE5 gia. D\xE2u t\xE2y ch\u1EE9a nhi\u1EC1u vitamin C, mangan, folate (vitamin B9) v\xE0 kali. Ngo\xE0i ra c\xF2n ch\u1EE9a c\xE1c ch\u1EA5t ch\u1ED1ng oxy h\xF3a m\u1EA1nh nh\u01B0 anthocyanins, ellagic acid, quercetin v\xE0 kaempferol.");
  }

  // Nếu sản phẩm có thông tin thành phần, trả về thông tin đó
  if (product.ingredients || product.productIngredients) {
    return "".concat(product.productName, " g\u1ED3m c\xE1c th\xE0nh ph\u1EA7n: ").concat(product.ingredients || product.productIngredients, ".");
  }
  var category = ((_product$productCateg3 = product.productCategory) === null || _product$productCateg3 === void 0 ? void 0 : _product$productCateg3.toLowerCase()) || '';

  // Từ khóa cho từng loại sản phẩm
  var fruitKeywords = ['trái cây', 'quả', 'cherry', 'táo', 'nho', 'cam', 'bưởi', 'chuối', 'dưa', 'dứa', 'xoài', 'ổi', 'lê', 'đào', 'berry'];
  var vegetableKeywords = ['rau', 'củ', 'quả', 'cà rốt', 'bắp cải', 'xà lách', 'cải', 'bông cải', 'hành', 'tỏi', 'khoai', 'cà chua', 'dưa chuột'];
  var processingKeywords = ['chế biến', 'đóng hộp', 'đóng gói', 'chế phẩm', 'bột', 'sốt', 'sauce', 'paste', 'nước', 'concentrate'];

  // Sản phẩm tươi sống thì không có thành phần phức tạp
  if (fruitKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  }) && !processingKeywords.some(function (kw) {
    return productName.includes(kw);
  })) {
    return "".concat(product.productName, " l\xE0 s\u1EA3n ph\u1EA9m t\u1EF1 nhi\xEAn 100%, kh\xF4ng c\xF3 th\xE0nh ph\u1EA7n ph\u1EE5 gia.");
  }
  if (vegetableKeywords.some(function (kw) {
    return productName.includes(kw) || category.includes(kw);
  }) && !processingKeywords.some(function (kw) {
    return productName.includes(kw);
  })) {
    return "".concat(product.productName, " l\xE0 s\u1EA3n ph\u1EA9m t\u1EF1 nhi\xEAn 100%, kh\xF4ng c\xF3 th\xE0nh ph\u1EA7n ph\u1EE5 gia.");
  }

  // Nếu không có thông tin thành phần và không phải là sản phẩm tươi sống
  return "Vui l\xF2ng tham kh\u1EA3o bao b\xEC s\u1EA3n ph\u1EA9m ho\u1EB7c li\xEAn h\u1EC7 v\u1EDBi ch\xFAng t\xF4i qua s\u1ED1 \u0111i\u1EC7n tho\u1EA1i 0326 743 391 \u0111\u1EC3 bi\u1EBFt th\xF4ng tin chi ti\u1EBFt v\u1EC1 th\xE0nh ph\u1EA7n c\u1EE7a ".concat(product.productName, ".");
};

/**
 * Sinh các câu hỏi thường gặp về sản phẩm
 * @param {Object} product - Sản phẩm cần sinh câu hỏi
 * @returns {Array} - Danh sách câu hỏi và trả lời
 */
var generateProductFAQs = function generateProductFAQs(product) {
  if (!product) return [];

  // Các câu hỏi cơ bản về sản phẩm
  return [{
    question: "".concat(product.productName, " c\xF3 c\xF4ng d\u1EE5ng g\xEC?"),
    answer: generateProductUsage(product)
  }, {
    question: "L\xE0m th\u1EBF n\xE0o \u0111\u1EC3 s\u1EED d\u1EE5ng ".concat(product.productName, "?"),
    answer: generateHowToUse(product)
  }, {
    question: "".concat(product.productName, " c\xF3 xu\u1EA5t x\u1EE9 t\u1EEB \u0111\xE2u?"),
    answer: generateOrigin(product)
  }, {
    question: "".concat(product.productName, " c\xF3 th\xE0nh ph\u1EA7n g\xEC?"),
    answer: generateIngredients(product)
  }, {
    question: "".concat(product.productName, " c\xF3 ph\u1EA3i l\xE0 s\u1EA3n ph\u1EA9m h\u1EEFu c\u01A1 kh\xF4ng?"),
    answer: "\u0110\u1EC3 bi\u1EBFt ".concat(product.productName, " c\xF3 ph\u1EA3i l\xE0 s\u1EA3n ph\u1EA9m h\u1EEFu c\u01A1 hay kh\xF4ng, b\u1EA1n c\xF3 th\u1EC3 ki\u1EC3m tra nh\xE3n m\xE1c ho\u1EB7c li\xEAn h\u1EC7 v\u1EDBi ch\xFAng t\xF4i qua s\u1ED1 \u0111i\u1EC7n tho\u1EA1i 0326 743 391 \u0111\u1EC3 \u0111\u01B0\u1EE3c t\u01B0 v\u1EA5n chi ti\u1EBFt.")
  }, {
    question: "".concat(product.productName, " c\xF3 gi\xE1 bao nhi\xEAu?"),
    answer: "".concat(product.productName, " c\xF3 gi\xE1 ").concat(new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(product.productPrice || 0)).concat(product.productDiscount ? " (gi\u1EA3m ".concat(product.productDiscount, "%)") : '', ".")
  }, {
    question: "".concat(product.productName, " c\xF3 b\xE1n \u1EDF c\u1EEDa h\xE0ng kh\xF4ng?"),
    answer: "".concat(product.productName, " c\xF3 b\xE1n t\u1EA1i c\u1EEDa h\xE0ng DNC FOOD t\u1EA1i \u0111\u1ECBa ch\u1EC9: Tr\u01B0\u1EDDng \u0110\u1EA1i h\u1ECDc Nam C\u1EA7n Th\u01A1, \u0111\u01B0\u1EDDng Nguy\u1EC5n V\u0103n C\u1EEB n\u1ED1i d\xE0i, C\u1EA7n Th\u01A1. B\u1EA1n c\u0169ng c\xF3 th\u1EC3 \u0111\u1EB7t h\xE0ng tr\u1EF1c tuy\u1EBFn tr\xEAn website c\u1EE7a ch\xFAng t\xF4i ho\u1EB7c g\u1ECDi \u0111\u1EBFn s\u1ED1 \u0111i\u1EC7n tho\u1EA1i 0326 743 391 \u0111\u1EC3 \u0111\u1EB7t h\xE0ng.")
  }];
};

// Sửa lại exports để phù hợp với Node.js
module.exports = {
  generateProductUsage: generateProductUsage,
  generateHowToUse: generateHowToUse,
  generateOrigin: generateOrigin,
  generateIngredients: generateIngredients,
  generateProductFAQs: generateProductFAQs
};