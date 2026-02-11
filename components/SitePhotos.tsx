
import React, { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Trash2, Maximize2, CheckCircle2, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import { useApp } from '../AppContext';

interface CapturedPhoto {
  id: string;
  url: string;
  projectId: string;
  timestamp: string;
  notes: string;
}

export const SitePhotos: React.FC = () => {
  const { projects } = useApp();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '');
  const [notes, setNotes] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      setIsCapturing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const takePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      const newPhoto: CapturedPhoto = {
        id: Math.random().toString(36).substr(2, 9),
        url: dataUrl,
        projectId: selectedProject,
        timestamp: new Date().toLocaleString(),
        notes: notes || 'Site progress update'
      };

      setPhotos(prev => [newPhoto, ...prev]);
      setNotes('');
      stopCamera();
    }
  }, [selectedProject, notes, stream]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Site Documentation</h2>
          <p className="text-slate-500 text-sm">Visual progress tracking for active construction sites.</p>
        </div>
        <button 
          onClick={startCamera}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          <Camera size={20} />
          New Capture
        </button>
      </div>

      {isCapturing && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="max-h-full w-full object-contain"
            />
            <button 
              onClick={stopCamera}
              className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-6 bg-slate-900 border-t border-white/10 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Link Project</label>
                <select 
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Quick Note</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Foundation completion..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-center pt-4 pb-8">
              <button 
                onClick={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-transform"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {photos.length === 0 ? (
          <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
            <ImageIcon size={48} strokeWidth={1} className="mb-4" />
            <p className="font-medium text-slate-500">No site photos captured yet</p>
            <p className="text-xs">Click 'New Capture' to start documenting progress.</p>
          </div>
        ) : (
          photos.map(photo => (
            <div key={photo.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group hover:border-blue-400 transition-all">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={photo.url} alt="Site progress" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button className="p-2 bg-black/40 backdrop-blur-md rounded-lg text-white hover:bg-black/60 transition-colors">
                    <Maximize2 size={14} />
                  </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-[10px] font-bold uppercase tracking-widest">{projects.find(p => p.id === photo.projectId)?.name}</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-800 line-clamp-2">{photo.notes}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><RefreshCw size={10} /> {photo.timestamp}</span>
                  <button className="text-red-500 hover:underline flex items-center gap-1">
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
        <div className="p-3 bg-blue-600 text-white rounded-xl">
          <AlertCircle size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-blue-900 mb-1">Professional Documentation Tip</h3>
          <p className="text-xs text-blue-700 leading-relaxed">
            Consistent site photography improves safety compliance and provides vital proof of work during client inspections or insurance claims. Always tag photos with the correct project and include specific location details in your notes.
          </p>
        </div>
      </div>
    </div>
  );
};
