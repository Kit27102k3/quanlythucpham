import { useState, useEffect } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, Box, Button, TextField, InputAdornment, CircularProgress, Chip } from '@mui/material';
import { Search, ChevronRight, Clock, Users } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const RecipePage = () => {
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  // Ánh xạ tên món ăn phổ biến sang tiếng Việt
  const mealNameVi = {
    "Beef Banh Mi Bowls with Sriracha Mayo": "Cơm thịt bò kiểu Bánh Mì với sốt Sriracha",
    "Vietnamese Grilled Pork (bun-thit-nuong)": "Bún thịt nướng",
    "Pho": "Phở",
    "Spring Rolls": "Gỏi cuốn",
    // Thêm các món khác nếu cần
  };

  // Ánh xạ nguyên liệu phổ biến sang tiếng Việt
  const ingredientVi = {
    "Beef": "Thịt bò",
    "Pork": "Thịt heo",
    "Chicken": "Thịt gà",
    "Fish Sauce": "Nước mắm",
    "Rice Noodles": "Bún gạo",
    "Cucumber": "Dưa leo",
    "Carrot": "Cà rốt",
    "Lettuce": "Xà lách",
    "Garlic": "Tỏi",
    "Onion": "Hành tây",
    "Sugar": "Đường",
    "Salt": "Muối",
    "Pepper": "Tiêu",
    // Thêm các nguyên liệu khác nếu cần
  };

  // Hàm dịch tên món ăn
  const translateMealName = (name) => mealNameVi[name] || name;
  // Hàm dịch nguyên liệu
  const translateIngredient = (name) => ingredientVi[name] || name;

  // Chuyển đổi tên danh mục sang tiếng Việt
  const translateCategory = (category) => {
    const translations = {
      'Beef': 'Thịt bò',
      'Breakfast': 'Bữa sáng',
      'Chicken': 'Thịt gà',
      'Dessert': 'Tráng miệng',
      'Goat': 'Thịt dê',
      'Lamb': 'Thịt cừu',
      'Miscellaneous': 'Khác',
      'Pasta': 'Mì Ý',
      'Pork': 'Thịt lợn',
      'Seafood': 'Hải sản',
      'Side': 'Món phụ',
      'Starter': 'Khai vị',
      'Vegan': 'Chay',
      'Vegetarian': 'Chay (có trứng, sữa)'
    };

    return translations[category] || category;
  };

  // Chuyển đổi tên quốc gia sang tiếng Việt
  const translateCuisine = (cuisine) => {
    const translations = {
      'American': 'Mỹ',
      'British': 'Anh',
      'Canadian': 'Canada',
      'Chinese': 'Trung Quốc',
      'Dutch': 'Hà Lan',
      'Egyptian': 'Ai Cập',
      'French': 'Pháp',
      'Greek': 'Hy Lạp',
      'Indian': 'Ấn Độ',
      'Irish': 'Ireland',
      'Italian': 'Ý',
      'Jamaican': 'Jamaica',
      'Japanese': 'Nhật Bản',
      'Kenyan': 'Kenya',
      'Malaysian': 'Malaysia',
      'Mexican': 'Mexico',
      'Moroccan': 'Morocco',
      'Russian': 'Nga',
      'Spanish': 'Tây Ban Nha',
      'Thai': 'Thái Lan',
      'Turkish': 'Thổ Nhĩ Kỳ',
      'Vietnamese': 'Việt Nam'
    };

    return translations[cuisine] || cuisine;
  };

  useEffect(() => {
    // Lấy danh sách các danh mục
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://www.themealdb.com/api/json/v1/1/categories.php');
        setCategories(response.data.categories);
        
        // Mặc định chọn danh mục đầu tiên
        if (response.data.categories.length > 0) {
          setActiveCategory(response.data.categories[0].strCategory);
          fetchRecipesByCategory(response.data.categories[0].strCategory);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh mục:', error);
      }
    };

    fetchCategories();
  }, []);

  // Lấy công thức theo danh mục
  const fetchRecipesByCategory = async (category) => {
    setLoading(true);
    try {
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
      const allRecipes = response.data.meals || [];
      
      // Lọc chi tiết từng công thức để chỉ lấy món Việt Nam
      const filteredRecipes = [];
      for (const recipe of allRecipes) {
        try {
          const detailResponse = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`);
          if (detailResponse.data.meals && detailResponse.data.meals[0].strArea === 'Vietnamese') {
            filteredRecipes.push(detailResponse.data.meals[0]);
          }
        } catch (error) {
          console.error('Lỗi khi lấy chi tiết công thức:', error);
        }
      }
      
      setRecipes(filteredRecipes);
    } catch (error) {
      console.error('Lỗi khi lấy công thức:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tìm kiếm công thức
  const searchRecipes = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${searchTerm}`);
      const allRecipes = response.data.meals || [];
      
      // Lọc chỉ lấy món Việt Nam
      const vietnameseRecipes = allRecipes.filter(recipe => recipe.strArea === 'Vietnamese');
      setRecipes(vietnameseRecipes);
      setActiveCategory('');
    } catch (error) {
      console.error('Lỗi khi tìm kiếm công thức:', error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi chọn danh mục
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setSearchTerm('');
    fetchRecipesByCategory(category);
  };

  // Xử lý khi nhấn Enter trong ô tìm kiếm
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      searchRecipes();
    }
  };

  // Hàm lấy tất cả công thức
  const fetchAllRecipes = async () => {
    setLoading(true);
    try {
      // Lấy món ăn từ nhiều quốc gia khác nhau
      const countries = ['Vietnamese', 'Thai', 'Chinese', 'Japanese', 'Indian', 'Malaysian'];
      const allRecipes = [];
      
      // Lấy món từ mỗi quốc gia
      for (const country of countries) {
        try {
          const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${country}`);
          if (response.data.meals) {
            // Lấy thông tin chi tiết và đánh dấu là món Việt Nam
            for (const recipe of response.data.meals.slice(0, 3)) { // Lấy tối đa 3 món mỗi quốc gia
              try {
                const detailResponse = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`);
                if (detailResponse.data.meals && detailResponse.data.meals.length > 0) {
                  const meal = detailResponse.data.meals[0];
                  
                  // Đổi tên món và đánh dấu là món Việt Nam nếu không phải món Việt
                  if (country !== 'Vietnamese') {
                    const vietnameseNames = {
                      'Thai': 'Món Thái phiên bản Việt',
                      'Chinese': 'Món Trung Hoa kiểu Việt',
                      'Japanese': 'Món Nhật phong cách Việt',
                      'Indian': 'Món Ấn Độ kiểu Việt',
                      'Malaysian': 'Món Malaysia phong cách Việt'
                    };
                    
                    // Thêm tiền tố vào tên món
                    meal.strMeal = `${vietnameseNames[country] || 'Món Việt'}: ${meal.strMeal}`;
                    meal.strArea = 'Vietnamese';
                  }
                  
                  allRecipes.push(meal);
                }
              } catch (error) {
                console.error('Lỗi khi lấy chi tiết công thức:', error);
              }
            }
          }
        } catch (error) {
          console.error(`Lỗi khi lấy món ${country}:`, error);
        }
      }
      
      setRecipes(allRecipes);
    } catch (error) {
      console.error('Lỗi khi lấy công thức:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          fontWeight="bold" 
          color="#428b16"
          sx={{ 
            borderBottom: '1px solid #e0e0e0', 
            pb: 1 
          }}
        >
          VÀO BẾP
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary">
          Các món ăn ngon mỗi ngày để làm cùng chuyên gia
        </Typography>
      </Box>
      
      {/* Ô tìm kiếm */}
      <Box 
        sx={{ 
          mb: 4, 
          display: 'flex', 
          alignItems: 'center',
          gap: 2
        }}
      >
        <TextField
          fullWidth
          placeholder="Tìm kiếm công thức..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="#428b16" />
              </InputAdornment>
            )
          }}
          variant="outlined"
          size="small"
          sx={{ 
            maxWidth: 500,
            '& .MuiOutlinedInput-root': {
              borderRadius: 50,
              '& fieldset': {
                borderColor: '#428b16',
              },
              '&:hover fieldset': {
                borderColor: '#5ccd16',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#428b16',
              },
            }
          }}
        />
        
        <Button 
          variant="contained" 
          onClick={searchRecipes}
          disabled={!searchTerm.trim()}
          sx={{ 
            bgcolor: '#428b16', 
            '&:hover': { bgcolor: '#5ccd16' }, 
            borderRadius: 50,
            px: 3
          }}
        >
          Tìm kiếm
        </Button>
      </Box>
      
      {/* Danh mục */}
      <Box 
        sx={{ 
          mb: 4, 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1,
          pb: 2,
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Chip
          label="Tất cả"
          color={!activeCategory ? "primary" : "default"}
          onClick={() => {
            setActiveCategory('');
            setSearchTerm('');
            fetchAllRecipes();
          }}
          sx={{ 
            fontWeight: 'medium',
            bgcolor: !activeCategory ? '#428b16' : 'transparent',
            color: !activeCategory ? 'white' : 'inherit',
            '&:hover': {
              bgcolor: !activeCategory ? '#5ccd16' : '#f0f0f0',
            }
          }}
        />
        {categories.map((category) => (
          <Chip
            key={category.idCategory}
            label={translateCategory(category.strCategory)}
            color={activeCategory === category.strCategory ? "primary" : "default"}
            onClick={() => handleCategoryClick(category.strCategory)}
            sx={{ 
              fontWeight: 'medium',
              bgcolor: activeCategory === category.strCategory ? '#428b16' : 'transparent',
              color: activeCategory === category.strCategory ? 'white' : 'inherit',
              '&:hover': {
                bgcolor: activeCategory === category.strCategory ? '#5ccd16' : '#f0f0f0',
              }
            }}
          />
        ))}
      </Box>
      
      {/* Danh sách công thức */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress sx={{ color: '#428b16' }} />
        </Box>
      ) : (
        <>
          <Box 
            sx={{ 
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              fontWeight="bold" 
              color="#428b16"
            >
              {activeCategory ? translateCategory(activeCategory).toUpperCase() : searchTerm ? 'KẾT QUẢ TÌM KIẾM' : 'TẤT CẢ CÔNG THỨC'}
            </Typography>
            
            <Link to="/recipes" style={{ textDecoration: 'none' }}>
              <Button 
                variant="outlined"
                sx={{ 
                  color: '#428b16', 
                  borderColor: '#428b16',
                  '&:hover': { 
                    borderColor: '#5ccd16',
                    backgroundColor: 'rgba(92, 205, 22, 0.1)'
                  }
                }}
              >
                Xem tất cả
              </Button>
            </Link>
          </Box>
          
          <Grid container spacing={2} sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {recipes.slice(0, 12).map((recipe) => (
              <Card 
                key={recipe.idMeal}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 2
                  }
                }}
              >
                <Link to={`/recipe-detail/${recipe.idMeal}`} style={{ textDecoration: 'none' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={recipe.strMealThumb}
                    alt={recipe.strMeal}
                  />
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography 
                        gutterBottom 
                        variant="subtitle1" 
                        component="div" 
                        fontWeight="bold" 
                        noWrap
                        color="#333"
                      >
                        {translateMealName(recipe.strMeal)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {activeCategory && (
                          <Chip 
                            label={translateCategory(activeCategory)} 
                            size="small" 
                            sx={{ 
                              fontSize: '0.7rem',
                              bgcolor: '#428b16',
                              color: 'white',
                              height: 20
                            }} 
                          />
                        )}
                        
                        {recipe.strArea && (
                          <Chip 
                            label={translateCuisine(recipe.strArea)} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem',
                              borderColor: '#428b16',
                              color: '#428b16',
                              height: 20
                            }} 
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Clock size={14} style={{ marginRight: 4, color: '#428b16' }} />
                          <Typography variant="caption" color="text.secondary">
                            30 phút
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Users size={14} style={{ marginRight: 4, color: '#428b16' }} />
                          <Typography variant="caption" color="text.secondary">
                            4 người
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      component="div" 
                      sx={{ 
                        mt: 1.5, 
                        color: '#428b16', 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        fontWeight: 'bold' 
                      }}
                    >
                      Xem chi tiết <ChevronRight size={14} />
                    </Typography>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </Grid>
          
          {recipes.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                Không tìm thấy công thức nào
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2, bgcolor: '#428b16', '&:hover': { bgcolor: '#5ccd16' } }}
                onClick={() => {
                  setActiveCategory('');
                  setSearchTerm('');
                  fetchAllRecipes();
                }}
              >
                Xem tất cả công thức
              </Button>
            </Box>
          )}
        </>
      )}
      
      {/* Danh sách công thức được gợi ý */}
      {recipes.length > 12 && (
        <Box sx={{ mt: 6 }}>
          <Typography 
            variant="h5" 
            component="h2" 
            fontWeight="bold" 
            color="#428b16"
            sx={{ 
              mb: 3,
              borderBottom: '1px solid #e0e0e0', 
              pb: 1 
            }}
          >
            CÓ THỂ BẠN SẼ THÍCH
          </Typography>
          
          <Grid container spacing={2} sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {recipes.slice(12, 18).map((recipe) => (
              <Card 
                key={recipe.idMeal}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0',
                  boxShadow: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 2
                  }
                }}
              >
                <Link to={`/recipe-detail/${recipe.idMeal}`} style={{ textDecoration: 'none' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={recipe.strMealThumb}
                    alt={recipe.strMeal}
                  />
                  <CardContent sx={{ p: 2 }}>
                    <Typography 
                      gutterBottom 
                      variant="subtitle1" 
                      component="div" 
                      fontWeight="bold" 
                      noWrap
                      color="#333"
                    >
                      {translateMealName(recipe.strMeal)}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {activeCategory && (
                        <Chip 
                          label={translateCategory(activeCategory)} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.7rem',
                            bgcolor: '#428b16',
                            color: 'white',
                            height: 20
                          }} 
                        />
                      )}
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      component="div" 
                      sx={{ 
                        mt: 1, 
                        color: '#428b16', 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        fontWeight: 'bold' 
                      }}
                    >
                      Xem chi tiết <ChevronRight size={14} />
                    </Typography>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default RecipePage; 