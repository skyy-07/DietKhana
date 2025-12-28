import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Image as ImageIcon, X, Check, Loader2 } from 'lucide-react';
import Button from './Button';
import { analyzeFridgeImage } from '../services/geminiService';
import { Ingredient } from '../types';

interface FridgeScannerProps {
  onIngredientsDetected: (ingredients: Ingredient[]) => void;
  onClose: () => void;
}

const FridgeScanner: React.FC<FridgeScannerProps> = ({ onIngredientsDetected, onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imgSrc) return;
    setIsAnalyzing(true);
    try {
      const ingredients = await analyzeFridgeImage(imgSrc);
      onIngredientsDetected(ingredients);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retake = () => setImgSrc(null);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 text-white bg-gradient-to-b from-black/50 to-transparent absolute top-0 w-full z-10">
        <h2 className="font-semibold text-lg">Scan Fridge</h2>
        <button onClick={onClose} className="p-2 bg-white/20 rounded-full backdrop-blur-md">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        {imgSrc ? (
          <img src={imgSrc} alt="Captured" className="max-h-full max-w-full object-contain" />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "environment" }}
            className="w-full h-full object-cover"
          />
        )}
        
        {isAnalyzing && (
           <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
             <Loader2 className="animate-spin mb-4 text-blue-400" size={48} />
             <p className="font-medium text-lg">Analyzing contents...</p>
             <p className="text-sm text-white/60">Identifying ingredients with Gemini Vision</p>
           </div>
        )}
      </div>

      <div className="bg-slate-900 p-6 pb-10 flex justify-around items-center gap-4">
        {imgSrc ? (
          <>
            <Button variant="secondary" onClick={retake} disabled={isAnalyzing} className="flex-1">
              Retake
            </Button>
            <Button onClick={handleAnalyze} isLoading={isAnalyzing} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0">
              <Check size={18} /> Analyze
            </Button>
          </>
        ) : (
          <>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition"
            >
              <ImageIcon size={24} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
            
            <button 
              onClick={capture} 
              className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:bg-white/10 transition"
            >
              <div className="h-16 w-16 rounded-full bg-white"></div>
            </button>
            
            <div className="w-14"></div> {/* Spacer for balance */}
          </>
        )}
      </div>
    </div>
  );
};

export default FridgeScanner;