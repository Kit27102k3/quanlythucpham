import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const SEO = ({ 
  title, 
  description, 
  name = "DNC FOOD", 
  type = "website", 
  image = "/src/assets/Logo.png" 
}) => {
  const siteName = "DNC FOOD";
  const siteUrl = "http://localhost:3000";
  
  return (
    <Helmet>
      {/* Tiêu đề trang */}
      <title>{`${title} | ${siteName}`}</title>
      <meta name="description" content={description} />
      
      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={`${siteUrl}${image}`} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={`${siteUrl}${image}`} />}
      
      {/* Canonical link */}
      <link rel="canonical" href={`${siteUrl}${window.location.pathname}`} />
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  name: PropTypes.string,
  type: PropTypes.string,
  image: PropTypes.string
};

export default SEO; 