import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Grid, Box, Typography, Paper, Chip, Button, CircularProgress } from '@mui/material';
import { ArrowLeft, Clock, Users, CheckCircle, ChevronRight } from 'lucide-react';
import axios from 'axios';

const RecipeDetailPage = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedRecipes, setRelatedRecipes] = useState([]);

  useEffect(() => {
    const fetchRecipeDetail = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        if (response.data.meals && response.data.meals.length > 0) {
          setRecipe(response.data.meals[0]);
          
          // Lấy công thức liên quan theo cùng danh mục
          fetchRelatedRecipes(response.data.meals[0].strCategory);
        } else {
          setError('Không tìm thấy công thức');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin công thức:', error);
        setError('Đã xảy ra lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetail();
  }, [id]);
  
  // Lấy các công thức liên quan
  const fetchRelatedRecipes = async (category) => {
    try {
      const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
      if (response.data.meals) {
        // Lọc bỏ công thức hiện tại và lấy tối đa 4 công thức
        const filtered = response.data.meals
          .filter(meal => meal.idMeal !== id)
          .slice(0, 4);
        setRelatedRecipes(filtered);
      }
    } catch (error) {
      console.error('Lỗi khi lấy công thức liên quan:', error);
    }
  };
  
  // Tạo danh sách nguyên liệu từ dữ liệu API
  const getIngredients = (recipe) => {
    const ingredients = [];
    
    // TheMealDB lưu trữ nguyên liệu từ strIngredient1 đến strIngredient20
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      
      if (ingredient && ingredient.trim() !== '') {
        ingredients.push({
          name: ingredient,
          measure: measure || ''
        });
      }
    }
    
    return ingredients;
  };
  
  // Xử lý hướng dẫn từng bước
  const getInstructions = (recipe) => {
    if (!recipe.strInstructions) return [];
    
    // Tách các bước dựa vào dấu chấm hoặc số
    return recipe.strInstructions
      .split(/\r\n|\n|\r|\./)
      .map(step => step.trim())
      .filter(step => step.length > 5); // Lọc bỏ các bước quá ngắn
  };

  // Chuyển đổi tên các quốc gia sang tiếng Việt
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
      'Vietnamese': 'Việt Nam',
      'Unknown': 'Không xác định'
    };

    return translations[cuisine] || cuisine;
  };

  // Chuyển đổi tên các danh mục sang tiếng Việt
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

  const translateMealName = (name) => mealNameVi[name] || name;
  const translateIngredient = (name) => ingredientVi[name] || name;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !recipe) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error" textAlign="center">
          {error || 'Không tìm thấy công thức nấu ăn'}
        </Typography>
        <Box textAlign="center" mt={2}>
          <Button component={Link} to="/recipes" startIcon={<ArrowLeft />}>
            Quay lại danh sách công thức
          </Button>
        </Box>
      </Container>
    );
  }

  const ingredients = getIngredients(recipe);
  const instructions = getInstructions(recipe);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Nút quay lại và loại */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          component={Link} 
          to="/recipes" 
          startIcon={<ArrowLeft />}
          variant="outlined"
          color="primary"
          sx={{ fontWeight: 'medium' }}
        >
          Quay lại danh sách
        </Button>
        <Chip 
          label={translateCategory(recipe.strCategory)} 
          color="primary" 
          sx={{ fontWeight: 'medium', px: 1 }}
        />
      </Box>
      
      {/* Tiêu đề và thông tin món ăn */}
      <Typography 
        variant="h3" 
        component="h1" 
        gutterBottom 
        fontWeight="bold"
        color="primary.dark"
        sx={{ mb: 1 }}
      >
        {translateMealName(recipe.strMeal)}
      </Typography>
      
      {recipe.strArea && (
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Ẩm thực: <Box component="span" fontWeight="medium" color="primary.main">{translateCuisine(recipe.strArea)}</Box>
        </Typography>
      )}
      
      {/* Hình ảnh, thông tin và nguyên liệu */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        {/* Hình ảnh món ăn */}
        <Grid item xs={12} md={5}>
          <Box
            component="img"
            src={recipe.strMealThumb}
            alt={recipe.strMeal}
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: 3,
              boxShadow: 4
            }}
          />
          
          {/* Thông tin thêm */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 3, mt: 3 }}>
            <Paper elevation={1} sx={{ py: 1.5, px: 3, display: 'flex', alignItems: 'center', borderRadius: 2 }}>
              <Clock size={22} style={{ marginRight: 8, color: '#1976d2' }} />
              <Typography fontWeight="medium">30 phút</Typography>
            </Paper>
            <Paper elevation={1} sx={{ py: 1.5, px: 3, display: 'flex', alignItems: 'center', borderRadius: 2 }}>
              <Users size={22} style={{ marginRight: 8, color: '#1976d2' }} />
              <Typography fontWeight="medium">4 người</Typography>
            </Paper>
          </Box>

          {/* Nguồn video nếu có */}
          {recipe.strYoutube && (
            <Button
              variant="contained"
              color="error"
              fullWidth
              sx={{ mt: 3, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
              component="a"
              href={recipe.strYoutube}
              target="_blank"
              rel="noopener noreferrer"
            >
              Xem Video Hướng Dẫn
            </Button>
          )}
        </Grid>
        
        {/* Nguyên liệu */}
        <Grid item xs={12} md={7}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: 3,
              background: 'linear-gradient(to bottom, #f9f9f9, #ffffff)'
            }}
          >
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom 
              fontWeight="bold"
              color="primary.main"
              sx={{ mb: 3, borderBottom: '2px solid #f0f0f0', pb: 2 }}
            >
              Nguyên liệu
            </Typography>
            
            <Grid container spacing={2}>
              {ingredients.map((ingredient, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      display: 'flex', 
                      alignItems: 'center',
                      borderRadius: 2,
                      borderColor: '#e0e0e0',
                      transition: 'all 0.2s',
                      height: '100%',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    <CheckCircle size={16} color="#4caf50" style={{ marginRight: 8, flexShrink: 0 }} />
                    <Box>
                      <Typography fontWeight="medium" variant="body2">{translateIngredient(ingredient.name)}</Typography>
                      {ingredient.measure && (
                        <Typography variant="caption" color="text.secondary">
                          {ingredient.measure}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Hướng dẫn nấu ăn */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 5, 
          borderRadius: 3,
          background: 'linear-gradient(to bottom, #f9f9f9, #ffffff)'
        }}
      >
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          fontWeight="bold"
          color="primary.main"
          sx={{ mb: 4, borderBottom: '2px solid #f0f0f0', pb: 2 }}
        >
          Hướng dẫn nấu ăn
        </Typography>
        
        <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
          {instructions.map((step, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 4,
                p: 3,
                borderRadius: 3,
                backgroundColor: index % 2 === 0 ? 'rgba(25, 118, 210, 0.06)' : 'rgba(76, 175, 80, 0.06)',
                border: index % 2 === 0 ? '1px solid rgba(25, 118, 210, 0.2)' : '1px solid rgba(76, 175, 80, 0.2)',
              }}
            >
              <Typography 
                variant="h5" 
                gutterBottom
                color={index % 2 === 0 ? 'primary.dark' : 'success.dark'}
                fontWeight="bold"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 36, 
                    height: 36, 
                    borderRadius: '50%', 
                    backgroundColor: index % 2 === 0 ? 'primary.main' : 'success.main',
                    color: 'white',
                    mr: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  {index + 1}
                </Box>
                Bước {index + 1}
              </Typography>
              <Typography variant="body1" sx={{ pl: 7 }}>{step}</Typography>
            </Box>
          ))}
        </Box>
        
        {recipe.strYoutube && (
          <Box mt={5}>
            <Typography 
              variant="h5" 
              gutterBottom
              fontWeight="bold"
              color="primary.dark"
              sx={{ mb: 3 }}
            >
              Video hướng dẫn
            </Typography>
            <Box
              component="iframe"
              src={recipe.strYoutube.replace('watch?v=', 'embed/')}
              frameBorder="0"
              allowFullScreen
              sx={{ width: '100%', height: 500, borderRadius: 3 }}
            />
          </Box>
        )}
      </Paper>
      
      {/* Công thức liên quan */}
      {relatedRecipes.length > 0 && (
        <Box>
          <Typography 
            variant="h4" 
            component="h2" 
            gutterBottom 
            fontWeight="bold"
            color="primary.main"
            sx={{ mb: 3, borderBottom: '2px solid #f0f0f0', pb: 2 }}
          >
            Công thức liên quan
          </Typography>
          
          <Grid container spacing={2}>
            {relatedRecipes.map((relatedRecipe) => (
              <Grid item xs={6} sm={4} md={3} key={relatedRecipe.idMeal}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={relatedRecipe.strMealThumb}
                    alt={relatedRecipe.strMeal}
                    sx={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover'
                    }}
                  />
                  <Box sx={{ p: 2 }}>
                    <Typography 
                      variant="subtitle1" 
                      noWrap 
                      gutterBottom
                      sx={{ fontWeight: 'bold' }}
                    >
                      {relatedRecipe.strMeal}
                    </Typography>
                    <Button
                      component={Link}
                      to={`/recipe-detail/${relatedRecipe.idMeal}`}
                      color="primary"
                      variant="contained"
                      size="small"
                      endIcon={<ChevronRight size={14} />}
                      fullWidth
                      sx={{ mt: 1, py: 0.5, fontWeight: 'bold', borderRadius: 1 }}
                    >
                      Xem chi tiết
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default RecipeDetailPage; 