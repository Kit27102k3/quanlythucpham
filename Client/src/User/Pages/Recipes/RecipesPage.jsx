import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActionArea,
  InputBase,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
  Pagination,
  Button,
  Divider
} from '@mui/material';
import { Search, Clock, Users } from 'lucide-react';
import axios from 'axios';

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recipesPerPage = 8;

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

  // Lấy danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('https://www.themealdb.com/api/json/v1/1/categories.php');
        if (response.data.categories) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh mục:', error);
      }
    };

    fetchCategories();
  }, []);

  // Lấy danh sách công thức dựa trên bộ lọc
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        let response;
        
        if (searchTerm) {
          // Tìm kiếm theo tên
          response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${searchTerm}`);
          if (response.data.meals) {
            // Lọc chỉ lấy món Việt Nam
            const vietnameseRecipes = response.data.meals.filter(recipe => recipe.strArea === 'Vietnamese');
            setRecipes(vietnameseRecipes);
            setTotalPages(Math.ceil(vietnameseRecipes.length / recipesPerPage));
            setLoading(false);
            return;
          }
        } else if (selectedCategory && selectedCategory !== 'all') {
          // Lọc theo danh mục
          response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${selectedCategory}`);
          if (response.data.meals) {
            // Lọc chi tiết từng công thức để chỉ lấy món Việt Nam
            const filteredRecipes = [];
            for (const recipe of response.data.meals) {
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
            setTotalPages(Math.ceil(filteredRecipes.length / recipesPerPage));
            setLoading(false);
            return;
          }
        } else {
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
          setTotalPages(Math.ceil(allRecipes.length / recipesPerPage));
          setLoading(false);
          return;
        }

        setRecipes([]);
        setTotalPages(1);
      } catch (error) {
        console.error('Lỗi khi lấy công thức:', error);
        setError('Đã xảy ra lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [searchTerm, selectedCategory]);

  // Xử lý đổi trang
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    const searchInput = e.target.elements.searchInput.value;
    setSearchTerm(searchInput);
    setPage(1);
  };

  // Lấy công thức cho trang hiện tại
  const getCurrentPageRecipes = () => {
    const startIndex = (page - 1) * recipesPerPage;
    const endIndex = startIndex + recipesPerPage;
    return recipes.slice(startIndex, endIndex);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Banner và tiêu đề */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 5,
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #5ccd16 0%, #428b16 100%)',
          color: 'white',
          boxShadow: 3
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          fontWeight="bold" 
          sx={{ mb: 2 }}
        >
          Thư Viện Công Thức Nấu Ăn
        </Typography>
        
        <Typography variant="h6" sx={{ maxWidth: '700px', mx: 'auto', mb: 3, opacity: 0.9 }}>
          Khám phá hàng ngàn công thức nấu ăn ngon từ khắp nơi trên thế giới
        </Typography>
        
        {/* Tìm kiếm */}
        <Paper 
          component="form" 
          onSubmit={handleSearch}
          sx={{ 
            p: '2px 4px', 
            display: 'flex', 
            alignItems: 'center', 
            maxWidth: '600px', 
            mx: 'auto',
            borderRadius: 50,
            boxShadow: 2
          }}
        >
          <InputBase
            name="searchInput"
            sx={{ ml: 2, flex: 1, fontSize: '1.1rem' }}
            placeholder="Tìm kiếm công thức..."
            defaultValue={searchTerm}
          />
          <IconButton type="submit" sx={{ p: '12px', color: '#428b16' }} aria-label="search">
            <Search size={24} />
          </IconButton>
        </Paper>
      </Box>
      
      {/* Bộ lọc danh mục */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          component="h2" 
          fontWeight="bold" 
          color="primary.dark"
          sx={{ mb: 2 }}
        >
          Danh Mục Món Ăn
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box 
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1,
                p: 2, 
                borderRadius: 2,
                backgroundColor: '#f8f8f8' 
              }}
            >
              <Chip
                label="Tất cả"
                color={selectedCategory === 'all' ? 'primary' : 'default'}
                onClick={() => setSelectedCategory('all')}
                sx={{ 
                  fontWeight: 'medium',
                  py: 2.5,
                  px: 1
                }}
              />
              
              {categories.map((category) => (
                <Chip
                  key={category.idCategory}
                  label={translateCategory(category.strCategory)}
                  color={selectedCategory === category.strCategory ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category.strCategory)}
                  sx={{ 
                    fontWeight: 'medium',
                    py: 2.5,
                    px: 1
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Hiển thị kết quả */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress color="primary" size={60} thickness={4} />
        </Box>
      ) : error ? (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            backgroundColor: '#fff5f5'
          }}
        >
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        </Paper>
      ) : recipes.length === 0 ? (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            Không tìm thấy công thức nào phù hợp
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            Vui lòng thử từ khóa khác hoặc chọn danh mục khác
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
          >
            Quay lại tất cả công thức
          </Button>
        </Paper>
      ) : (
        <>
          {/* Hiển thị tiêu đề danh mục đã chọn */}
          {selectedCategory !== 'all' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" component="h2" fontWeight="bold" color="primary.dark">
                {translateCategory(selectedCategory)}
              </Typography>
              <Divider sx={{ mt: 1, mb: 3 }} />
            </Box>
          )}
          
          {searchTerm && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" component="h2" fontWeight="bold" color="primary.dark">
                Kết quả tìm kiếm: &quot;{searchTerm}&quot;
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tìm thấy {recipes.length} công thức
              </Typography>
              <Divider sx={{ mt: 1, mb: 3 }} />
            </Box>
          )}
          
          {/* Danh sách công thức */}
          <Grid container spacing={2} sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {getCurrentPageRecipes().map((recipe) => (
              <Card 
                key={recipe.idMeal}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardActionArea 
                  component={Link} 
                  to={`/recipe-detail/${recipe.idMeal}`}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={recipe.strMealThumb}
                    alt={recipe.strMeal}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography 
                      variant="subtitle1" 
                      component="div" 
                      gutterBottom 
                      noWrap
                      fontWeight="medium"
                      sx={{ color: 'primary.dark' }}
                    >
                      {recipe.strMeal}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {recipe.strCategory && (
                        <Chip 
                          label={translateCategory(recipe.strCategory)} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ fontWeight: 'medium', fontSize: '0.7rem' }}
                        />
                      )}
                      
                      {recipe.strArea && (
                        <Chip 
                          label={translateCuisine(recipe.strArea)} 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                          sx={{ fontWeight: 'medium', fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 1, justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Clock size={14} style={{ marginRight: 4, color: '#1976d2' }} />
                        <Typography variant="caption" color="text.secondary">
                          30 phút
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Users size={14} style={{ marginRight: 4, color: '#1976d2' }} />
                        <Typography variant="caption" color="text.secondary">
                          4 người
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Grid>
          
          {/* Phân trang */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={5}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
                size="large"
                variant="outlined"
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontWeight: 'medium'
                  }
                }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default RecipesPage; 