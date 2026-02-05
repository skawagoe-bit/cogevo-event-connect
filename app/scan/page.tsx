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
import { useTranslation } from "@/lib/i18n/context";
import { digitizeCardWithSansan } from "@/app/actions/sansan";
import { analyzeBusinessCard, transcribeAudio } from "@/app/actions/ai";

// Force dynamic rendering to prevent static generation issues with environment variables
export const dynamic = 'force-dynamic';

export default function ScanPage() {
  const router = useRouter();
  const { dict, language, t } = useTranslation();
  const { eventId, eventName, attributes, segments, roles } = useSettings();
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Check if eventId is set
  useEffect(() => {
    if (!eventId) {
      const savedEventId = localStorage.getItem("eventId");
      if (!savedEventId) {
          alert(dict.preset.alert_select_event);
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isBadgeMode, setIsBadgeMode] = useState(false);
  const [showBadgeConfirm, setShowBadgeConfirm] = useState(false);
  
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

      // Check if mediaDevices is supported
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("カメラAPIがこのブラウザでサポートされていません");
      }

      let stream: MediaStream | null = null;
      const isUser = facingMode === 'user';
      
      try {
        if (!isUser) {
             // Strategy for Rear Camera:
             // 1. Try "exact: environment" with resolution (Best for iOS)
             // 2. Try "exact: environment" without resolution
             // 3. Search device list for "back/rear" and use deviceId (Best for Android where exact facingMode fails)
             // 4. Fallback to "ideal: environment"
             
             try {
                // Attempt 1
                stream = await navigator.mediaDevices.getUserMedia({
                  video: { 
                    facingMode: { exact: 'environment' },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                  },
                  audio: false
                });
             } catch (e1) {
                console.log("1. Exact environment failed", e1);
                
                try {
                    // Attempt 2
                    stream = await navigator.mediaDevices.getUserMedia({
                      video: { facingMode: { exact: 'environment' } },
                      audio: false
                    });
                } catch (e2) {
                    console.log("2. Exact environment no-res failed", e2);
                    
                    // Attempt 3: Enumerate devices
                    try {
                         // We need permission to see labels, but we might not have it yet.
                         // However, if we failed above, we might have triggered permission prompt?
                         // Sometimes we need to get *any* stream first to see labels.
                         // But let's try enumerating first.
                         const devices = await navigator.mediaDevices.enumerateDevices();
                         const backCamera = devices.find(d => 
                            d.kind === 'videoinput' && 
                            (d.label.toLowerCase().includes('back') || 
                             d.label.toLowerCase().includes('rear') || 
                             d.label.toLowerCase().includes('背面') ||
                             d.label.toLowerCase().includes('environment'))
                         );
                         
                         if (backCamera) {
                             console.log("Found back camera by label:", backCamera.label);
                             stream = await navigator.mediaDevices.getUserMedia({
                                video: { deviceId: { exact: backCamera.deviceId } },
                                audio: false
                             });
                         } else {
                             throw new Error("No back camera found in list");
                         }
                    } catch (e3) {
                        console.log("3. Device ID selection failed", e3);
                        
                        // Attempt 4: Ideal environment
                        // This often defaults to front camera on some devices if they don't support 'environment'
                        stream = await navigator.mediaDevices.getUserMedia({
                          video: { 
                            facingMode: 'environment',
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                          },
                          audio: false
                        });
                    }
                }
             }
        } else {
            // User (front) camera
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                  facingMode: 'user',
                  width: { ideal: 1920 },
                  height: { ideal: 1080 }
                },
                audio: false
              });
        }
      } catch (err) {
        console.log("All specific attempts failed, falling back to any video");
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (finalErr) {
            throw finalErr;
        }
      }
      
      if (!stream) throw new Error("カメラストリームの取得に失敗しました");

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS Safari fix: playing via promise
        videoRef.current.onloadedmetadata = async () => {
            try {
                await videoRef.current?.play();
            } catch (e) {
                console.error("Play error:", e);
            }
        };
      }
      setHasCameraPermission(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      setHasCameraPermission(false);
      setErrorMessage(err.toString() + " (Stack: " + (err.stack || "") + ")");
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

  const switchToBadgeMode = () => {
    setIsBadgeMode(true);
    setCapturedImage(null);
    setIsImageConfirmed(false);
    setShowBadgeConfirm(false);
    setAudioBlob(null);
    setMemoText("");
  };

  const switchToCardMode = () => {
    setIsBadgeMode(false);
    setCapturedImage(null);
    setIsImageConfirmed(false);
    setShowBadgeConfirm(false);
    setAudioBlob(null);
    setMemoText("");
  };

  const takePhoto = useCallback(() => {
    if (!videoRef.current) return;
    
    // Check if video is actually playing and has dimensions
    if (videoRef.current.readyState < 2) { // HAVE_CURRENT_DATA
        console.warn("Video not ready (readyState < 2)");
        alert("カメラの準備中です。少し待ってから再度お試しください。");
        return;
    }

    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        console.warn("Video not ready yet (dimensions 0)");
        alert("カメラ映像が正しく読み込まれていません。ページを更新してください。");
        return;
    }
    
    try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          const imageUrl = canvas.toDataURL("image/jpeg", 0.8);
          setCapturedImage(imageUrl);
          setIsImageConfirmed(false); // Always standard flow now
    
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
             navigator.vibrate(50);
          }
        }
    } catch (e: any) {
        console.error("Take photo error:", e);
        alert("撮影に失敗しました: " + (e.message || "不明なエラー"));
    }
  }, [isBadgeMode]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setIsImageConfirmed(false);
    // Reset to environment (rear) camera when retaking
    if (facingMode !== 'environment') {
        setFacingMode('environment');
    }
  };

  // Handle switching modes and auto-starting camera
  const handleModeSwitch = (mode: 'card' | 'badge') => {
    if (mode === 'card') {
        setIsBadgeMode(false);
    } else {
        setIsBadgeMode(true);
    }
    
    setCapturedImage(null);
    setIsImageConfirmed(false);
    setShowBadgeConfirm(false);
    setAudioBlob(null);
    setMemoText("");
    
    // Only reset facingMode if not already in environment
    if (facingMode !== 'environment') {
        setFacingMode('environment');
    }
  };

  const confirmImage = () => {
    setIsImageConfirmed(true);
    if (isBadgeMode) {
        handleBadgeAnalysis();
    }
  };

  const handleBadgeAnalysis = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    try {
        // Convert base64 to File object
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], "badge.jpg", { type: "image/jpeg" });
        
        const formData = new FormData();
        formData.append('image', file);

        // Analyze Badge Image
        const apiKey = localStorage.getItem("gemini_api_key") || undefined;
        const aiResult = await analyzeBusinessCard(formData, apiKey);
        if (aiResult.success && aiResult.data) {
            setName(aiResult.data.name || "");
            setCompany(aiResult.data.company || "");
            // No alert needed, just fills the form
        } else {
             console.warn("Badge analysis failed:", aiResult.error);
        }
    } catch (e: any) {
        console.error(e);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const toggleVoiceInput = useCallback(() => {
    // If in badge mode, we use MediaRecorder for audio file
    if (isBadgeMode) {
      if (isRecording) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      } else {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            };

            mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              setAudioBlob(audioBlob);
              stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
          })
          .catch(err => {
            console.error("Error accessing microphone:", err);
            alert("マイクへのアクセスに失敗しました");
          });
      }
      return;
    }

    // Normal mode: Speech to Text
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
      recognition.lang = language === 'en' ? 'en-US' : 'ja-JP';
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
    if (!capturedImage) return;
    
    setIsAnalyzing(true);
    try {
        // Convert base64 to File object
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], "card.jpg", { type: "image/jpeg" });
        
        const formData = new FormData();
        formData.append('image', file);

        // 1. Analyze with AI for instant feedback
        const apiKey = localStorage.getItem("gemini_api_key") || undefined;
        const aiResult = await analyzeBusinessCard(formData, apiKey);
        if (aiResult.success && aiResult.data) {
            setName(aiResult.data.name || "");
            setCompany(aiResult.data.company || "");
            setEmail(aiResult.data.email || "");
        }

        // 2. Register to Sansan (Background process)
        // We call this to ensure the data is eventually registered in Sansan's DB
        const sansanResult = await digitizeCardWithSansan(formData);
        
        if (aiResult.success && aiResult.data) {
            setName(aiResult.data.name || "");
            setCompany(aiResult.data.company || "");
            setEmail(aiResult.data.email || "");
            alert("名刺を読み取りました (AI解析完了)");
        } else {
            // AI failed
            const errorMessage = aiResult.error || "不明なエラー";
            if (sansanResult.success) {
                 // Suppress the big alert, just notify user to input manually
                 console.warn("AI Analysis failed but Sansan upload succeeded:", errorMessage);
                 alert("Sansanへのアップロードが完了しました。\n※AI解析は利用できなかったため、名刺情報は手動で入力してください。");
            } else {
                 alert(`読み取りに失敗しました。\nAIエラー: ${errorMessage}\nSansanエラー: ${sansanResult.error}`);
            }
        }
    } catch (e: any) {
        console.error(e);
        alert("エラーが発生しました: " + e.message);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedAttribute) {
      alert(dict.scan.select_attribute);
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
      
      if (imageUrl) {
          if (isBadgeMode) {
              formData.append("badge_image_url", imageUrl);
          } else {
              formData.append("image_url", imageUrl);
          }
      }
      
      if (memoText) formData.append("memo", memoText);
      // Process status is 'completed' by default (from updated schema/action default), 
      // but we can be explicit if needed. Since we removed pending_entry flow, 
      // we assume this is a full registration.

      console.log("Submitting visitor data:", {
        event_id: eventId,
        name,
        company,
        email,
        attribute: selectedAttribute,
        segment: selectedSegment,
        roles: selectedRoles,
        isBadgeMode,
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
                <h3 className="text-xl font-bold text-gray-800">{dict.scan.qr_code}</h3>
                <p className="text-sm text-gray-500">
                  {dict.scan.qr_desc}
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
                    {dict.scan.qr_no_url}
                  </div>
                )}
              </div>
              
              {!mySansanUrl && (
                <Button 
                  onClick={() => router.push('/profile')}
                  className="w-full bg-primary text-white hover:bg-primary/90"
                >
                  {dict.common.settings}
                </Button>
              )}

              <Button 
                onClick={() => setShowQR(false)}
                className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {dict.common.close}
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
                     {dict.scan.retake}
                   </Button>
                   <Button onClick={confirmImage} className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6 shadow-lg border border-white/20">
                     <Check className="w-5 h-5 mr-2" />
                     {dict.scan.use_photo}
                   </Button>
                 </div>
               ) : (
                 <div className="absolute top-2 right-2 z-10">
                    <Button onClick={retakePhoto} variant="secondary" size="sm" className="bg-black/40 text-white hover:bg-black/60 border-none backdrop-blur-md">
                        <RefreshCcw className="w-3 h-3 mr-1" /> {dict.scan.retake}
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
             <div className="text-gray-400 flex flex-col items-center animate-pulse p-4 text-center w-full">
               <Camera className="w-12 h-12 mb-3 opacity-50" />
               <span className="text-sm font-medium tracking-wide mb-2">
                 {hasCameraPermission === false ? dict.scan.camera_error : dict.scan.camera_starting}
               </span>
               {errorMessage && (
                 <div className="text-xs text-red-400 mb-4 block w-full break-words bg-black/50 p-2 rounded text-left overflow-y-auto max-h-32">
                    ERROR: {errorMessage}
                 </div>
               )}
               {hasCameraPermission === false && (
                 <Button onClick={() => startCamera()} variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                   {dict.scan.retry}
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
                   {dict.scan.qr_code}
                 </button>
               </div>

               <div className="absolute bottom-4 text-white/80 text-xs bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm z-10">
                 {dict.scan.camera_hint}
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
                     {dict.scan.analyzing}
                   </>
                 ) : (
                   <>
                     <span className="font-bold">{dict.scan.sansan_mock_button}</span>
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
             onClick={() => {
                if (isBadgeMode) {
                    handleModeSwitch('card');
                } else {
                    takePhoto();
                }
             }}
             className={cn(
                "flex-1 min-w-[80px] flex flex-col h-auto py-2 gap-1.5 border shadow-sm active:scale-95 transition-all",
                !isBadgeMode 
                    ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-100 ring-offset-2" 
                    : "bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-600"
             )}
           >
             <Camera className="w-5 h-5" />
             <span className="text-[10px] font-bold">{dict.scan.camera}</span>
           </Button>
           <Button 
             variant="secondary" 
             onClick={() => {
                if (!isBadgeMode) {
                    handleModeSwitch('badge');
                } else {
                    takePhoto();
                }
             }}
             className={cn(
                "flex-1 min-w-[80px] flex flex-col h-auto py-2 gap-1.5 border shadow-sm active:scale-95 transition-all",
                isBadgeMode 
                    ? "bg-purple-50 border-purple-200 text-purple-700 ring-2 ring-purple-100 ring-offset-2" 
                    : "bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-600"
             )}
           >
             <ImageIcon className="w-5 h-5" />
             <span className="text-[10px] font-bold">{dict.scan.badge}</span>
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
               {isListening ? dict.scan.listening : dict.scan.voice_memo}
             </span>
           </Button>
        </div>

        {/* Memo Input Area */}
        <div className="px-5 pt-4">
             <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4 space-y-3">
               <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">{dict.scan.card_info}</h3>
               <div className="space-y-2">
                 <input 
                   value={company}
                   onChange={(e) => setCompany(e.target.value)}
                   placeholder={dict.scan.company_name}
                   className="w-full p-2 bg-white border border-blue-200 rounded text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
                 <input 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   placeholder={dict.scan.name}
                   className="w-full p-2 bg-white border border-blue-200 rounded text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
                 <input 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder={dict.scan.email}
                   className="w-full p-2 bg-white border border-blue-200 rounded text-xs text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                 />
               </div>
             </div>

           <div className="bg-yellow-50/50 p-3 rounded-xl border border-yellow-100">
             <label className="text-xs font-bold text-gray-500 flex items-center gap-2 mb-2 uppercase tracking-wide">
               <FileAudio className="w-3 h-3" />
               {dict.scan.voice_memo}
             </label>
             <div className="relative">
               <textarea
                 value={memoText}
                 onChange={(e) => setMemoText(e.target.value)}
                 className="w-full p-3 bg-white border border-yellow-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all min-h-[80px]"
                 placeholder={dict.scan.memo_placeholder}
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
               {dict.scan.select_attribute} <span className="text-error text-xs font-normal bg-red-50 px-2 py-0.5 rounded-full">{dict.common.required}</span>
             </label>
             {attributes.length > 0 ? (
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
                     {t(attr)}
                   </button>
                 ))}
               </div>
             ) : (
               <div className="text-center p-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
                 <p className="text-sm text-gray-500 mb-2">{dict.scan.no_attributes}</p>
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                        // Temporary fallback for this session
                        // Ideally we would update context via a dedicated method if exposed, 
                        // but here we just simulate selection if needed or ask user to re-select event
                        alert(dict.preset.alert_select_event);
                        router.push('/preset');
                    }}
                 >
                    {dict.scan.check_settings}
                 </Button>
               </div>
             )}
           </div>

           <div className="space-y-3">
             <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
               {dict.scan.roles} <span className="text-xs text-gray-400 font-normal">{dict.scan.multiple_choice}</span>
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
                   {t(role)}
                 </button>
               ))}
             </div>
           </div>

           <div className="space-y-3">
             <label className="text-sm font-bold text-gray-700">{dict.scan.segment}</label>
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
                   {t(seg)}
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
             {dict.scan.register}
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
            <span className="text-[10px] font-bold text-gray-500">{dict.list.title}</span>
         </button>
         <button 
            className="flex flex-col items-center justify-center py-4 gap-1.5 active:bg-gray-50 transition-colors"
            onClick={() => router.push('/gift')}
         >
            <Gift className="w-6 h-6 text-gray-600" />
            <span className="text-[10px] font-bold text-gray-500">{dict.gift.title}</span>
         </button>
      </div>
    </div>
  );
}
