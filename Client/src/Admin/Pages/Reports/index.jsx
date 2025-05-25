import React, { useEffect, useState } from 'react';
import reportsApi from '../../services/reportsApi';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('user');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      if (activeTab === 'user') {
        try {
          setLoading(true);
          const userData = await reportsApi.getUserDetailData();
          setUserData(userData);
        } catch (error) {
          console.error("Error loading user data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [activeTab]);

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default Reports; 