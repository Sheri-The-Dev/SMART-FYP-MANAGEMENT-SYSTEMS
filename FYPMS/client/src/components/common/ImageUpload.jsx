import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, Trash2 } from 'lucide-react';
import Button from './Button';

const ImageUpload = ({ currentImage, onUpload, onDelete, loading }) => {
  const [preview, setPreview] = useState(currentImage);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Maximum size is 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Call upload callback
    onUpload(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (currentImage && onDelete) {
      onDelete();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-[#193869] shadow-lg">
              <img
                src={preview}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center gap-2">
                <button
                  onClick={handleButtonClick}
                  disabled={loading}
                  className="opacity-0 hover:opacity-100 transition-opacity bg-white text-[#193869] p-2 rounded-full shadow-lg hover:scale-110 transform duration-200"
                  title="Change photo"
                >
                  <Camera size={20} />
                </button>
                <button
                  onClick={handleRemove}
                  disabled={loading}
                  className="opacity-0 hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transform duration-200"
                  title="Remove photo"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-3">
              Hover over image to change or remove
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? 'border-[#193869] bg-blue-50'
                  : 'border-gray-300 hover:border-[#193869] hover:bg-gray-50'
              }`}
              onClick={handleButtonClick}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#193869] to-[#234e92] rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800 mb-1">
                    Upload Profile Picture
                  </p>
                  <p className="text-sm text-gray-600">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF or WebP (max 5MB)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageUpload;