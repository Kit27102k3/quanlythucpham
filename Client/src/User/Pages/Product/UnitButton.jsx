import PropTypes from 'prop-types';

const UnitButton = ({ unit, isSelected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={isSelected ? 
        {
          backgroundColor: '#51bb1a',
          color: 'white',
          border: '1px solid #51bb1a',
          borderRadius: '0.375rem',
          padding: '0.25rem 0.75rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'all 0.2s',
          cursor: 'pointer'
        } : 
        {
          backgroundColor: 'white',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          padding: '0.25rem 0.75rem',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
          cursor: 'pointer'
        }
      }
    >
      {unit.conversionRate} {unit.unit}
    </button>
  );
};

UnitButton.propTypes = {
  unit: PropTypes.shape({
    conversionRate: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

export default UnitButton; 