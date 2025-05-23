import React from 'react';
import { ArrowLeftIcon } from 'lucide-react';

/**
 * Component hiển thị màn hình loading khi đang tải chi tiết đơn hàng
 */
export const OrderDetailLoading = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <button 
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          disabled
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Quay lại</span>
        </button>
        
        <div className="ml-4 h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {/* Loading skeleton cho thông tin đơn hàng */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="h-12 bg-gray-100 animate-pulse"></div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between">
                <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-5 w-24 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-5 w-40 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-5 w-36 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-5 w-28 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
          
          {/* Loading skeleton cho thông tin vận chuyển */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="p-4">
              <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-5 w-32 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-28 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-5 w-36 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-5 w-48 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div>
                  <div className="h-4 w-36 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-5 w-40 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
              
              {/* Loading skeleton cho bản đồ */}
              <div className="mt-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gray-200 animate-pulse rounded-full mr-2"></div>
                  <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="h-[400px] bg-gray-200 animate-pulse rounded-lg"></div>
              </div>
            </div>
          </div>
          
          {/* Loading skeleton cho danh sách sản phẩm */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="p-4">
              <div className="h-6 w-36 bg-gray-200 animate-pulse rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2].map((item) => (
                  <div key={item} className="flex items-center py-2 border-b">
                    <div className="h-16 w-16 bg-gray-200 animate-pulse rounded mr-3"></div>
                    <div className="flex-1">
                      <div className="h-5 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
                      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                    <div className="h-5 w-20 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ))}
                <div className="flex justify-between pt-2">
                  <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-6 w-28 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          {/* Loading skeleton cho trạng thái đơn hàng */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="p-4">
              <div className="h-6 w-40 bg-gray-200 animate-pulse rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-start">
                    <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full mr-3"></div>
                    <div className="flex-1">
                      <div className="h-5 w-36 bg-gray-200 animate-pulse rounded mb-1"></div>
                      <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loading cho danh sách đơn hàng
 */
export const OrderListSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <div className="h-5 w-36 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-6 w-28 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex justify-between mb-3">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="flex justify-between mb-3">
              <div className="h-4 w-28 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 flex justify-end">
            <div className="h-9 w-28 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderDetailLoading; 