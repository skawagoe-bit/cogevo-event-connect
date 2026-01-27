"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, Mic, Image as ImageIcon, List, Gift, Settings, FileAudio, QrCode, RefreshCcw, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/app/providers";
import QRCode from "react-qr-code";
import { createClient } from "@/lib/supabase/client";
import { createVisitor } from "@/app/actions/visitors";
import { getProfile } from "@/app/actions/profile";

export default function ScanPage() {
  const router = useRouter();
  const { eventId, eventName, attributes, segments, roles } = useSettings();
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Check if eventId is set
  useEffect(() => {
    if (!eventId) {
      const savedEventId = localStorage.getItem("eventId");
      if (!savedEventId) {
          alert("イベントが選択されていません。選択画面に戻ります。");
          router.push("/preset");
      }
    }
  }, [eventId, router]);

  // OCR / Visitor Data State
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Voice Memo State
  const [memoText, setMemoText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const [showQR, setShowQR] = useState(false);
  const [mySansanUrl, setMySansanUrl] = useState<string | null>(null);
  
  // Camera references
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isImageConfirmed, setIsImageConfirmed] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);

  // Fetch user profile for QR code
  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getProfile();
      if (result.success && result.data?.sansan_url) {
        setMySansanUrl(result.data.sansan_url);
      }
    };
    fetchProfile();
  }, []);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setErrorMessage(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode === 'user' ? 'user' : { exact: 'environment' },
            audio: false
          }
        });
      } catch (err) {
        console.log("Exact facing mode failed, falling back to ideal/default");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode === 'user' ? 'user' : 'environment',
            audio: false
          }
        });
      }
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error("Play error:", e);
        }
      }
      setHasCameraPermission(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      setHasCameraPermission(false);
      setErrorMessage(err.message || "Unknown error");
    }
  }, [facingMode]);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [startCamera, capturedImage]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const takePhoto = useCallback(() => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(imageUrl);
      setIsImageConfirmed(false);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }, []);

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsImageConfirmed(false);
  };

  const confirmImage = () => {
    setIsImageConfirmed(true);
  };

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("このブラウザは音声入力をサポートしていません");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setMemoText(prev => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  }, [isListening]);

  const handleSansanMock = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setName("山田 太郎");
    setCompany("Sansan株式会社");
    setEmail("taro.yamada@example.com");
    setIsAnalyzing(false);
    alert("Sansanで名刺をデータ化しました");
  };

  const handleRegister = async () => {
    if (!selectedAttribute) {
      alert("属性を選択してください");
      return;
    }

    try {
      const supabase = createClient();
      let imageUrl = "";

      if (capturedImage) {
        const imageBlob = await (await fetch(capturedImage)).blob();
        const filename = `image-${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from('visitor-uploads')
          .upload(filename, imageBlob);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('visitor-uploads')
          .getPublicUrl(filename);
        imageUrl = publicUrl;
      }

      const formData = new FormData();
      if (!eventId) {
        alert("イベントが選択されていません。トップに戻ってイベントを選択してください。");
        return;
      }
      formData.append("event_id", eventId); 
      
      if (name) formData.append("name", name);
      if (company) formData.append("company", company);
      if (email) formData.append("email", email);
      formData.append("attribute", selectedAttribute);
      if (selectedSegment) formData.append("segment", selectedSegment);
      if (imageUrl) formData.append("image_url", imageUrl);
      if (memoText) formData.append("memo", memoText);

      console.log("Submitting visitor data:", {
        event_id: eventId,
        name,
        company,
        email,
        attribute: selectedAttribute,
        segment: selectedSegment,
        roles: selectedRoles,
        hasImage: !!imageUrl,
        memo: memoText
      });

      const result = await createVisitor(formData);
      
      if (result.success) {
        router.push("/complete");
      } else {
        console.error(result.error);
        alert("登録エラー: " + result.error);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      alert("登録処理中にエラーが発生しました: " + err.message);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-20 shrink-0">
         <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Event</span>
            <span className="text-sm font-bold text-gray-800">{eventName}</span>
         </div>
         <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => router.push('/preset')}
         >
            <Settings className="w-5 h-5 text-gray-500" />
         </Button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide relative">
        
        {/* QR Code Overlay Modal */}
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200" onClick={() => setShowQR(false)}>
            <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-6 text-center" onClick={e => e.stopPropagation()}>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800">Sansanオンライン名刺</h3>
                <p className="text-sm text-gray-500">
                  お客様のスマホで読み取っていただくと<br/>
                  名刺交換ができます。
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-xl border-2 border-gray-100 inline-block shadow-sm">
                {mySansanUrl ? (
                  <QRCode 
                    value={mySansanUrl} 
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 text-gray-400 text-xs text-center p-4">
                    プロフィール設定から<br/>URLを登録してください
                  </div>
                )}
              </div>
              
              {!mySansanUrl && (
                <Button 
                  onClick={() => router.push('/profile')}
                  className="w-full bg-primary text-white hover:bg-primary/90"
                >
                  設定画面へ
                </Button>
              )}

              <Button 
                onClick={() => setShowQR(false)}
                className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                閉じる
              </Button>
            </div>
          </div>
        )}

        {/* Camera Preview Area (Rest of the component remains same) */}
        <div className="relative aspect-[4/3] bg-slate-900 mx-0 mt-0 overflow-hidden flex items-center justify-center group">
           {capturedImage ? (
             <div className="relative w-full h-full">
               <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
               {!isImageConfirmed ? (
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4 animate-in fade-in">
                   <Button onClick={retakePhoto} variant="secondary" className="bg-white/90 hover:bg-white h-12 px-6">
                     再撮影
                   </Button>
                   <Button onClick={confirmImage} className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 shadow-lg border border-white/20">
                     <Check className="w-5 h-5 mr-2" />
                     使用する
                   </Button>
                 </div>
               ) : (
                 <div className="absolute top-2 right-2 z-10">
                    <Button onClick={retakePhoto} variant="secondary" size="sm" className="bg-black/40 text-white hover:bg-black/60 border-none backdrop-blur-md">
                        <RefreshCcw className="w-3 h-3 mr-1" /> 再撮影
                    </Button>
                 </div>
               )}
             </div>
           ) : hasCameraPermission === true ? (
             <video 
               ref={videoRef}
               autoPlay 
               playsInline 
               muted
               className="absolute inset-0 w-full h-full object-cover"
             />
           ) : (
             <div className="text-gray-400 flex flex-col items-center animate-pulse p-4 text-center">
               <Camera className="w-12 h-12 mb-3 opacity-50" />
               <span className="text-sm font-medium tracking-wide mb-2">
                 {hasCameraPermission === false ? "カメラへのアクセスができません" : "カメラを起動中..."}
               </span>
               {errorMessage && (
                 <span className="text-xs text-red-400 mb-4 block max-w-[200px] break-words">{errorMessage}</span>
               )}
               {hasCameraPermission === false && (
                 <Button onClick={() => startCamera()} variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                   再試行
                 </Button>
               )}
             </div>
           )}
           
           {!capturedImage && (
             <>
               <div className="absolute inset-x-8 inset-y-8 border-2 border-white/40 rounded-lg pointer-events-none flex flex-col justify-between p-2 z-10">
                 <div className="w-full flex justify-between">
                   <div className="w-4 h-4 border-t-2 border-l-2 border-white"></div>
                   <div className="w-4 h-4 border-t-2 border-r-2 border-white"></div>
                 </div>
                 <div className="w-full flex justify-between">
                   <div className="w-4 h-4 border-b-2 border-l-2 border-white"></div>
                   <div className="w-4 h-4 border-b-2 border-r-2 border-white"></div>
                 </div>
               </div>
               
               <div className="absolute top-4 right-4 flex gap-2 z-20">
                 <button 
                   onClick={toggleCamera}
                   className="bg-black/40 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/60 transition-colors"
                   title="カメラ切り替え"
                 >
                   <RefreshCcw className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => setShowQR(true)}
                   className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-white/30 transition-colors"
                 >
                   <QrCode className="w-3.5 h-3.5" />
                   名刺交換QR
                 </button>
               </div>

               <div className="absolute bottom-4 text-white/80 text-xs bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm z-10">
                 名刺を枠内に合わせてください
               </div>
             </>
           )}
           
           {capturedImage && (
             <div className="absolute bottom-4 right-4 z-20">
               <Button 
                 onClick={handleSansanMock} 
                 disabled={isAnalyzing}
                 className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg border border-white/20"
               >
                 {isAnalyzing ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     解析中...
                   </>
                 ) : (
                   <>
                     <span className="font-bold">Sansanでデータ化</span>
                   </>
                 )}
               </Button>
             </div>
           )}
        </div>

        {/* Capture Actions */}
        <div className="flex gap-2 p-3 justify-center bg-white border-b overflow-x-auto">
           <Button 
             variant="secondary" 
             onClick={takePhoto}
             className="flex-1 min-w-[80px] flex flex-col h-auto py-2 gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 shadow-sm active:scale-95 transition-transform"
           >
             <Camera className="w-5 h-5 text-gray-600" />
             <span className="text-[10px] font-bold text-gray-600">名刺</span>
           </Button>
           <Button variant="secondary" className="flex-1 min-w-[80px] flex flex-col h-auto py-2 gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 shadow-sm">
             <ImageIcon className="w-5 h-5 text-gray-600" />
             <span className="text-[10px] font-bold text-gray-600">バッジ</span>
           </Button>
           <Button 
             variant="secondary" 
             onClick={toggleVoiceInput}
             className={cn(
               "flex-1 min-w-[80px] flex flex-col h-auto py-2 gap-1.5 border shadow-sm transition-all",
               isListening
                 ? "bg-red-50 border-red-200 animate-pulse" 
                 : "bg-blue-50 border-blue-100 hover:bg-blue-100"
             )}
           >
             <Mic className={cn("w-5 h-5", isListening ? "text-red-500" : "text-blue-600")} />
             <span className={cn("text-[10px] font-bold", isListening ? "text-red-600" : "text-blue-700")}>
               {isListening ? "聞いています" : "商談内容入力"}
             </span>
           </Button>
        </div>

        {/* Memo Input Area */}
        <div className="px-5 pt-4">
           {(name || company || email || isAnalyzing) && (
             <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4 space-y-3 animate-in fade-in slide-in-from-top-4">
               <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">名刺情報 (Sansan)</h3>
               <div className="space-y-2">
                 <input 
                   value={company}
                   onChange={(e) => setCompany(e.target.value)}
                   placeholder="会社名"
                   className="w-full p-2 bg-white border border-blue-200 rounded text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
                 <input 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   placeholder="氏名"
                   className="w-full p-2 bg-white border border-blue-200 rounded text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
                 <input 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="メールアドレス"
                   className="w-full p-2 bg-white border border-blue-200 rounded text-xs text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
               </div>
             </div>
           )}

           <div className="bg-yellow-50/50 p-3 rounded-xl border border-yellow-100">
             <label className="text-xs font-bold text-gray-500 flex items-center gap-2 mb-2 uppercase tracking-wide">
               <FileAudio className="w-3 h-3" />
               商談メモ
             </label>
             <div className="relative">
               <textarea
                 value={memoText}
                 onChange={(e) => setMemoText(e.target.value)}
                 className="w-full p-3 bg-white border border-yellow-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all min-h-[80px]"
                 placeholder="テキスト入力、または上の「商談内容入力」ボタンで記録..."
               />
               {memoText && (
                 <button 
                   onClick={() => setMemoText("")}
                   className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"
                 >
                   <X className="w-3 h-3" />
                 </button>
               )}
             </div>
           </div>
        </div>

        {/* Form Controls */}
        <div className="p-5 space-y-6">
           <div className="space-y-3">
             <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
               属性を選択 <span className="text-error text-xs font-normal bg-red-50 px-2 py-0.5 rounded-full">必須</span>
             </label>
             <div className="grid grid-cols-3 gap-3">
               {attributes.map(attr => (
                 <button
                   key={attr}
                   onClick={() => setSelectedAttribute(attr)}
                   className={cn(
                     "py-3 px-2 rounded-lg text-sm font-bold border-2 transition-all duration-200 shadow-sm",
                     selectedAttribute === attr 
                       ? "bg-primary/10 border-primary text-primary shadow-md transform scale-[1.02]" 
                       : "bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50"
                   )}
                 >
                   {attr}
                 </button>
               ))}
             </div>
           </div>

           <div className="space-y-3">
             <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
               役割・タグ <span className="text-xs text-gray-400 font-normal">複数選択可</span>
             </label>
             <div className="flex gap-2 flex-wrap">
               {roles.map(role => (
                 <button
                   key={role}
                   onClick={() => toggleRole(role)}
                   className={cn(
                     "py-2 px-3 rounded-full text-sm font-bold border transition-all duration-200 shadow-sm",
                     selectedRoles.includes(role)
                       ? "bg-purple-100 border-purple-200 text-purple-700 shadow-inner" 
                       : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                   )}
                 >
                   {role}
                 </button>
               ))}
             </div>
           </div>

           <div className="space-y-3">
             <label className="text-sm font-bold text-gray-700">区分（任意）</label>
             <div className="flex gap-3 flex-wrap">
               {segments.map(seg => (
                 <button
                   key={seg}
                   onClick={() => setSelectedSegment(seg)}
                   className={cn(
                     "flex-1 min-w-[80px] py-3 px-2 rounded-lg text-sm font-bold border-2 transition-all duration-200",
                     selectedSegment === seg 
                       ? "bg-gray-800 border-gray-800 text-white shadow-md" 
                       : "bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50"
                   )}
                 >
                   {seg}
                 </button>
               ))}
             </div>
           </div>
           
           <Button 
             variant="accent"
             className={cn(
               "w-full h-16 text-xl font-bold rounded-xl mt-6 transition-all duration-300 shadow-xl",
               !selectedAttribute ? "opacity-50 grayscale" : "animate-pulse-slow"
             )}
             onClick={handleRegister}
             disabled={!selectedAttribute}
           >
             登録する
           </Button>
           
           <div className="h-8"></div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t p-0 grid grid-cols-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
         <button 
            className="flex flex-col items-center justify-center py-4 gap-1.5 border-r border-gray-100 active:bg-gray-50 transition-colors"
            onClick={() => router.push('/list')}
         >
            <div className="relative">
              <List className="w-6 h-6 text-gray-600" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                12
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-500">本日のリスト</span>
         </button>
         <button 
            className="flex flex-col items-center justify-center py-4 gap-1.5 active:bg-gray-50 transition-colors"
            onClick={() => router.push('/gift')}
         >
            <Gift className="w-6 h-6 text-gray-600" />
            <span className="text-[10px] font-bold text-gray-500">ギフト管理</span>
         </button>
      </div>
    </div>
  );
}
