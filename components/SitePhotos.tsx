
import React, { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Trash2, Maximize2, CheckCircle2, AlertCircle, Image as ImageIcon, X, Pencil, Save } from 'lucide-react';
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
  const [editingPhoto, setEditingPhoto] = useState<CapturedPhoto | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      setIsCapturing(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
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

  const handleUpdateNotes = () => {
    if (!editingPhoto) return;
    setPhotos(prev => prev.map(p => p.id === editingPhoto.id ? { ...p, notes: editNotes } : p));
    setEditingPhoto(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Site Documentation</h2>
          <p className="text-slate-500 text-sm">Visual progress tracking and site inspection evidence.</p>
        </div>
        <button 
          onClick={startCamera}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          <Camera size={20} />
          New Site Capture
        </button>
      </div>

      {isCapturing && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Link to Active Site</label>
                <select 
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Entry Caption</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Masonry wall alignment..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-center pt-4 pb-12">
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

      {editingPhoto && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h2 className="text-xl font-bold text-slate-900">Edit Photo Notes</h2>
                 <button onClick={() => setEditingPhoto(null)}><X size={24} className="text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-100">
                    <img src={editingPhoto.url} className="w-full h-full object-cover" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Update Caption</label>
                    <textarea 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      rows={3}
                    />
                 </div>
                 <button onClick={handleUpdateNotes} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    <Save size={18} /> Update Documentary Entry
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {photos.length === 0 ? (
          <div className="col-span-full py-24 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400">
            <div className="p-6 bg-slate-50 rounded-full mb-4">
               <ImageIcon size={48} strokeWidth={1} className="opacity-20" />
            </div>
            <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No Site Documentation Yet</p>
            <p className="text-[10px] mt-2 font-medium">Click 'New Site Capture' to start visual tracking.</p>
          </div>
        ) : (
          photos.map(photo => (
            <div key={photo.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm group hover:border-blue-400 transition-all flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={photo.url} alt="Site capture" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3">
                  <p className="text-white text-[9px] font-bold uppercase tracking-widest opacity-80 mb-0.5">{projects.find(p => p.id === photo.projectId)?.name}</p>
                  <p className="text-white text-[10px] font-bold">{photo.timestamp.split(',')[0]}</p>
                </div>
              </div>
              <div className="p-5 space-y-4 flex-1 flex flex-col">
                <p className="text-sm font-semibold text-slate-800 line-clamp-2 flex-1">{photo.notes}</p>
                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingPhoto(photo); setEditNotes(photo.notes); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors" title="Edit Notes"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete Photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                    <Maximize2 size={10} /> Full View
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
        <div className="p-5 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-600/20">
          <AlertCircle size={32} />
        </div>
        <div className="text-center md:text-left">
          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Standardized Site Auditing</h3>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Site photography provides vital proof of progress and safety compliance. For high-stakes milestones like foundation pours or structural steel handovers, ensure captions include weather conditions and site manager names for the master audit trail.
          </p>
        </div>
        <div className="ml-auto">
           <button onClick={startCamera} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold shadow-lg hover:bg-slate-100 transition-all text-sm">Open Camera</button>
        </div>
      </div>
    </div>
  );
};
