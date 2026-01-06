import React from 'react';
import { Upload, X, FileImage } from 'lucide-react';

interface Props {
  files: File[];
  onDrop: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
}

export const UploadZone: React.FC<Props> = ({ files, onDrop, onRemove, disabled }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onDrop(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDropEvent = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && e.dataTransfer.files.length > 0) {
          onDrop(Array.from(e.dataTransfer.files));
      }
  };

  return (
    <div className="w-full">
      <div 
        onDragOver={handleDragOver}
        onDrop={handleDropEvent}
        className={`
            border-2 border-dashed rounded-xl transition-all group
            ${disabled ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer bg-white'}
        `}
      >
          <label className="flex flex-col sm:flex-row items-center justify-center gap-3 py-6 px-4 cursor-pointer w-full">
            <div className="bg-indigo-50 p-2 rounded-full group-hover:bg-indigo-100 transition-colors">
                <Upload className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-center sm:text-left">
                <h3 className="text-sm font-semibold text-gray-900">Перетащите скриншоты сюда</h3>
                <p className="text-xs text-gray-500">или нажмите для выбора</p>
            </div>
            <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange}
                disabled={disabled}
            />
          </label>
      </div>

      {files.length > 0 && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {files.map((file, idx) => (
                  <div key={idx} className="relative group/file bg-white p-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2 animate-fade-in">
                      <div className="bg-gray-100 p-1 rounded shrink-0">
                          <FileImage size={14} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate" title={file.name}>{file.name}</p>
                      </div>
                      <button 
                        onClick={() => onRemove(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm text-gray-400 hover:text-red-500 border border-gray-100 opacity-0 group-hover/file:opacity-100 transition-opacity"
                      >
                          <X size={12} />
                      </button>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};
