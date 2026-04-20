import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Camera, Package, ExternalLink, Upload, AlertCircle } from 'lucide-react';
import { getRawMaterialByQrCode, createOperationLog } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { setupCameraFocus } from '@/utils/cameraFocus';

export default function ScanQueryPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [materialData, setMaterialData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [shouldStartScanner, setShouldStartScanner] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkBrowserSupport();
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (shouldStartScanner && !scanning) {
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
        const selectedCamera = devices[devices.length - 1];

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          selectedCamera.id,
          {
            fps: 20,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            }
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {}
        );

        setScanning(true);
        setShouldStartScanner(false);
        toast.success('摄像头已启动，点击屏幕可对焦', { duration: 3000 });

        // 延迟设置自动对焦
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
        errorMsg = '摄像头权限被拒绝';
      } else if (error.name === 'NotFoundError') {
        errorMsg = '未检测到摄像头设备';
      } else if (error.name === 'NotReadableError') {
        errorMsg = '摄像头被其他应用占用';
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
    
    try {
      const material = await getRawMaterialByQrCode(qrCode);
      if (!material) {
        toast.error('未找到该物料');
        // 记录查询失败
        await createOperationLog({
          qr_code: qrCode,
          operation_type: 'QUERY',
          operator: profile?.name || '',
          detail: '查询失败：未找到该物料',
        });
        return;
      }

      setMaterialData(material);
      
      // 记录查询成功
      await createOperationLog({
        qr_code: qrCode,
        operation_type: 'QUERY',
        operator: profile?.name || '',
        detail: `查询成功：${material.batch_no}-${material.package_no}`,
      });
      
      toast.success('查询成功');
    } catch (error: any) {
      console.error('查询物料失败:', error);
      toast.error('查询物料失败');
      // 记录查询错误
      await createOperationLog({
        qr_code: qrCode,
        operation_type: 'QUERY',
        operator: profile?.name || '',
        detail: `查询错误：${error.message}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-secondary text-secondary-foreground p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mobile')} className="text-secondary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">扫码查询</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!scanning && !materialData && !shouldStartScanner && (
          <>
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground mb-2">使用摄像头扫描二维码</p>
                  <p className="text-xs text-muted-foreground">需要授予摄像头权限</p>
                </div>
                <Button onClick={startScanner} variant="secondary" className="w-full" disabled={!!error && error.includes('不支持')}>
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
                  <div className="mt-4 p-4 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg border-2 border-secondary/20">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📱</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-secondary-foreground mb-2">扫描技巧</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>• 保持距离 <span className="font-bold text-secondary-foreground">2-10厘米</span></p>
                          <p>• <span className="font-bold text-secondary-foreground">点击屏幕</span> 可手动对焦</p>
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

        {materialData && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    物料详情
                  </CardTitle>
                  <Badge variant={materialData.status === 'in_stock' ? 'default' : 'secondary'}>
                    {materialData.status === 'in_stock' ? '在库' : '已出库'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">批次号</p>
                    <p className="font-medium">{materialData.batch_no}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">包号</p>
                    <p className="font-medium">{materialData.package_no}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">型号</p>
                    <p className="font-medium">{materialData.model}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">生产日期</p>
                    <p className="font-medium">{materialData.production_date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">重量</p>
                    <p className="font-medium">{materialData.weight} {materialData.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">操作人</p>
                    <p className="font-medium">{materialData.operator}</p>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">入库时间</p>
                    <p className="text-sm font-medium">{new Date(materialData.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                  {materialData.out_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">出库时间</p>
                      <p className="text-sm font-medium">{new Date(materialData.out_at).toLocaleString('zh-CN')}</p>
                    </div>
                  )}
                  {materialData.remark && (
                    <div>
                      <p className="text-xs text-muted-foreground">备注</p>
                      <p className="text-sm">{materialData.remark}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">二维码</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">{materialData.qr_code}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">快捷查询</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={`/mobile/manual-query?batch=${materialData.batch_no}`}>
                  <Button variant="outline" className="w-full justify-between">
                    <span>查看批次 {materialData.batch_no} 的所有物料</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to={`/mobile/manual-query?model=${materialData.model}`}>
                  <Button variant="outline" className="w-full justify-between">
                    <span>查看型号 {materialData.model} 的所有物料</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setMaterialData(null);
                startScanner();
              }}
            >
              继续扫描
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
