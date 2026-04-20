import React from 'react';

/**
 * 摄像头对焦使用提示组件
 */
export function CameraFocusGuide() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
      <h3 className="font-bold text-blue-900 mb-2">📷 摄像头使用建议</h3>
      <ul className="space-y-1 text-blue-800">
        <li>• 保持距离 <span className="font-bold text-blue-900">2-10厘米</span></li>
        <li>• 确保光线充足</li>
        <li>• 避免反光</li>
        <li>• 保持摄像头稳定</li>
      </ul>
    </div>
  );
}
