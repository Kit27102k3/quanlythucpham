/* eslint-disable react/prop-types */
import { 
  HomeIcon,
  InfoCircledIcon,
  GearIcon,
  IdCardIcon
} from "@radix-ui/react-icons";

const PageHeader = ({ title, subtitle, icon }) => {
  const getIcon = () => {
    switch (icon) {
      case 'home':
        return <HomeIcon className="size-6 text-blue-600" />;
      case 'info':
        return <InfoCircledIcon className="size-6 text-purple-600" />;
      case 'coupon':
        return <IdCardIcon className="size-6 text-green-600" />;
      case 'settings':
        return <GearIcon className="size-6 text-gray-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          {getIcon()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default PageHeader; 