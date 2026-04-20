import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Camera, Check, Upload, AlertCircle } from 'lucide-react';
import { parseQrCode, createRawMaterial, createOperationLog } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { setupCameraFocus } from '@/utils/cameraFocus';

export default function ScanInPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [shouldStartScanner, setShouldStartScanner] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 检查浏览器支持
    checkBrowserSupport();
    return () => {
      stopScanner();
    };
  }, []);

  // 监听shouldStartScanner状态，在DOM渲染完成后初始化扫描器
  useEffect(() => {
    if (shouldStartScanner && !scanning) {
      // 增加延迟时间，确保DOM完全渲染
      const timer = setTimeout(() => {
        initScanner();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shouldStartScanner, scanning]);

  const checkBrowserSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('您的浏览器不支持摄像头功能，请使用文件上传方式');
    }
    
    // 检查是否为HTTPS或localhost
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      setError('摄像头功能需要HTTPS协议，请使用文件上传方式或联系管理员配置HTTPS');
    }
  };

  const startScanner = () => {
    setError('');
    setShouldStartScanner(true);
  };

  const initScanner = async () => {
    setError('');
    
    // 检查DOM元素是否存在，最多重试3次
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      const element = document.getElementById('qr-reader');
      if (element) {
        break;
      }
      console.log(`等待DOM渲染，重试 ${retryCount + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 200));
      retryCount++;
    }
    
    const element = document.getElementById('qr-reader');
    if (!element) {
      console.error('qr-reader元素不存在，已重试3次');
      setShouldStartScanner(false);
      setError('初始化失败，请重试');
      toast.error('初始化失败，请重试');
      return;
    }
    
    try {
      // 先请求权限
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (permError: any) {
        console.error('权限请求失败:', permError);
        setShouldStartScanner(false);
        if (permError.name === 'NotAllowedError') {
          setError('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头');
          toast.error('请允许访问摄像头');
          return;
        } else if (permError.name === 'NotFoundError') {
          setError('未检测到摄像头设备');
          toast.error('未检测到摄像头');
          return;
        } else {
          throw permError;
        }
      }

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const selectedCamera = devices[devices.length - 1]; // 优先使用后置摄像头

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          selectedCamera.id,
          {
            fps: 20, // 提高帧率到20，让扫描更流畅
            qrbox: { width: 280, height: 280 }, // 适中的扫描框大小
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: 'environment', // 后置摄像头
              width: { ideal: 1920 }, // 请求高分辨率
              height: { ideal: 1080 },
            }
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // 扫描失败，忽略
          }
        );

        setScanning(true);
        setShouldStartScanner(false);
        toast.success('摄像头已启动，点击屏幕可对焦', { duration: 3000 });

        // 延迟设置自动对焦，确保video元素已完全加载
        setTimeout(async () => {
          const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              await setupCameraFocus(videoElement, videoTrack);
            }
          }
        }, 1000);
      } else {
        setShouldStartScanner(false);
        setError('未检测到摄像头设备');
        toast.error('未检测到摄像头');
      }
    } catch (error: any) {
      console.error('启动扫描失败:', error);
      setShouldStartScanner(false);
      let errorMsg = '启动摄像头失败';
      
      if (error.name === 'NotAllowedError') {
        errorMsg = '摄像头权限被拒绝，请在浏览器设置中允许访问摄像头';
      } else if (error.name === 'NotFoundError') {
        errorMsg = '未检测到摄像头设备';
      } else if (error.name === 'NotReadableError') {
        errorMsg = '摄像头被其他应用占用，请关闭其他使用摄像头的应用';
      } else if (error.name === 'OverconstrainedError') {
        errorMsg = '摄像头不支持所需的配置';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const stopScanner = async () => {
    // 清理对焦定时器
    const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
    if (videoElement) {
      const { cleanupCameraFocus } = await import('@/utils/cameraFocus');
      cleanupCameraFocus(videoElement);
    }
    
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('停止扫描失败:', error);
      }
    }
    setScanning(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const scanner = new Html5Qrcode('qr-reader-file');
      const decodedText = await scanner.scanFile(file, false);
      handleScanSuccess(decodedText);
      toast.success('二维码识别成功');
    } catch (error) {
      console.error('文件识别失败:', error);
      toast.error('无法识别二维码，请确保图片清晰');
    }
  };

  const handleScanSuccess = async (qrCode: string) => {
    await stopScanner();
    
    const parsed = parseQrCode(qrCode);
    if (!parsed) {
      toast.error('二维码格式错误');
      return;
    }

    setParsedData({
      qrCode,
      ...parsed,
    });

    // 保存到本地记录
    saveLocalRecord('IN', qrCode, '解析成功');
  };

  const handleConfirm = async () => {
    if (!parsedData) return;

    setSubmitting(true);
    try {
      await createRawMaterial({
        qr_code: parsedData.qrCode,
        batch_no: parsedData.batchNo,
        package_no: parsedData.packageNo,
        model: parsedData.model,
        production_date: parsedData.productionDate,
        weight: parsedData.weight,
        unit: parsedData.unit,
        status: 'in_stock',
        operator: profile?.name || '',
        remark: null,
      });

      await createOperationLog({
        qr_code: parsedData.qrCode,
        operation_type: 'IN',
        operator: profile?.name || '',
        detail: `入库：${parsedData.batchNo}-${parsedData.packageNo}`,
      });

      saveLocalRecord('IN', parsedData.qrCode, '入库成功');
      toast.success('入库成功');
      setParsedData(null);
    } catch (error: any) {
      console.error('入库失败:', error);
      toast.error(error.message || '入库失败');
      saveLocalRecord('IN', parsedData.qrCode, '入库失败：' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const saveLocalRecord = (type: string, qrCode: string, result: string) => {
    try {
      const records = JSON.parse(localStorage.getItem('operation_records') || '[]');
      records.unshift({
        type,
        qrCode,
        result,
        time: new Date().toISOString(),
      });
      // 只保留最近20条
      localStorage.setItem('operation_records', JSON.stringify(records.slice(0, 20)));
    } catch (error) {
      console.error('保存本地记录失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部栏 */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mobile')} className="text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">扫码入库</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!scanning && !parsedData && !shouldStartScanner && (
          <>
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground mb-2">使用摄像头扫描二维码</p>
                  <p className="text-xs text-muted-foreground">需要授予摄像头权限</p>
                </div>
                <Button onClick={startScanner} className="w-full" disabled={!!error && error.includes('不支持')}>
                  <Camera className="w-4 h-4 mr-2" />
                  开始扫描
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground mb-2">或上传二维码图片</p>
                  <p className="text-xs text-muted-foreground">支持JPG、PNG格式</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline" 
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  选择图片
                </Button>
                <div id="qr-reader-file" className="hidden"></div>
              </CardContent>
            </Card>

            {/* 使用提示 */}
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-medium">💡 使用提示：</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>摄像头功能需要HTTPS协议或localhost环境</li>
                  <li>首次使用需要授予摄像头权限</li>
                  <li>如果摄像头无法启动，可以使用图片上传方式</li>
                  <li>确保二维码清晰可见，避免反光和模糊</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {(shouldStartScanner || scanning) && (
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <div id="qr-reader" className="w-full rounded-md overflow-hidden"></div>
                {scanning && (
                  <div className="absolute top-2 left-2 right-2 bg-black/60 text-white px-3 py-2 rounded-md text-xs backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span>👆 点击屏幕对焦</span>
                      <span className="animate-pulse">●</span>
                    </div>
                  </div>
                )}
              </div>
              {scanning && (
                <>
                  <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📱</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-primary mb-2">扫描技巧</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>• 保持距离 <span className="font-bold text-primary">2-10厘米</span></p>
                          <p>• <span className="font-bold text-primary">点击屏幕</span> 可手动对焦</p>
                          <p>• 确保光线充足，避免抖动</p>
                          <p>• 二维码完整显示在扫描框内</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={stopScanner} variant="outline" className="w-full mt-4">
                    取消扫描
                  </Button>
                </>
              )}
              {shouldStartScanner && (
                <div className="text-center mt-4">
                  <div className="animate-pulse">
                    <p className="text-muted-foreground">正在启动摄像头...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {parsedData && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  解析成功
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">批次号</p>
                    <p className="font-medium">{parsedData.batchNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">包号</p>
                    <p className="font-medium">{parsedData.packageNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">型号</p>
                    <p className="font-medium">{parsedData.model}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">生产日期</p>
                    <p className="font-medium">{parsedData.productionDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">重量</p>
                    <p className="font-medium">{parsedData.weight} {parsedData.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">操作人</p>
                    <p className="font-medium">{profile?.name}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">二维码</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">{parsedData.qrCode}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setParsedData(null);
                  startScanner();
                }}
              >
                重新扫描
              </Button>
              <Button onClick={handleConfirm} disabled={submitting}>
                {submitting ? '提交中...' : '确认入库'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
