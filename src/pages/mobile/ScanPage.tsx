import { useState } from 'react';
import { Scan, Camera, XCircle } from 'lucide-react';
import { MobileLayout } from '@/components/mobile';
import { useToast } from '@/hooks/use-toast';
import { useDevice } from '@/hooks/useDevice';

export const ScanPage = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const { toast } = useToast();
  const { isNative } = useDevice();

  const handleStartScan = () => {
    setIsScanning(true);
    // TODO: 集成扫码功能
    // 使用 @capacitor/camera 或 html5-qrcode
    toast({
      title: '扫描模式',
      description: '对准二维码扫描',
    });
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

  const handleScanSuccess = (code: string) => {
    setScannedCode(code);
    setIsScanning(false);
    toast({
      title: '扫描成功',
      description: `识别码: ${code}`,
    });
  };

  const handleManualInput = () => {
    // TODO: 打开手动输入对话框
    toast({
      title: '手动输入',
      description: '请输入产品编号',
    });
  };

  return (
    <MobileLayout
      title="扫码"
      showBack
      hideNav={isScanning}
    >
      <div className="p-4">
        {!isScanning ? (
          <div className="space-y-6">
            {/* 扫描按钮 */}
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <button
                  onClick={handleStartScan}
                  className="w-48 h-48 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <Scan size={80} className="text-blue-600" />
                </button>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-md text-sm text-gray-600">
                  点击开始扫描
                </div>
              </div>
            </div>

            {/* 功能选项 */}
            <div className="space-y-3">
              <button
                onClick={handleManualInput}
                className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Camera size={20} className="text-blue-600" />
                  </div>
                  <span className="font-medium">手动输入</span>
                </div>
              </button>
            </div>

            {/* 最近扫描记录 */}
            {scannedCode && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">最近扫描</h3>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{scannedCode}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date().toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <button
                      onClick={() => setScannedCode('')}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 扫描界面 */
          <div className="flex flex-col items-center justify-center min-h-[500px]">
            <div className="relative w-64 h-64">
              {/* 扫描框 */}
              <div className="absolute inset-0 border-4 border-blue-500 rounded-lg"></div>

              {/* 扫描线 */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 animate-[scan_2s_ease-in-out_infinite]"></div>

              {/* 扫描角标 */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-600"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-600"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-600"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-600"></div>
            </div>

            <p className="mt-6 text-sm text-gray-600 text-center">
              将二维码放入框内即可自动扫描
            </p>

            <button
              onClick={handleStopScan}
              className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消扫描
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% {
            top: 0;
          }
          50% {
            top: calc(100% - 2px);
          }
        }
      `}</style>
    </MobileLayout>
  );
};
