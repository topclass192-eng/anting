import React, { useState, useRef, useCallback } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export interface ImageUploadProps {
  multiple?: boolean;
  maxImages?: number;
  value?: string | string[];
  onChange: (urls: string | string[]) => void;
  onError: (error: string) => void;
  pathGenerator: (file: File, index: number) => string;
}

export default function ImageUpload({
  multiple = false,
  maxImages = 1,
  value,
  onChange,
  onError,
  pathGenerator,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  
  // Normalize value to array internally
  const images = Array.isArray(value) ? value : (value ? [value] : []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onError('지원하지 않는 이미지 형식입니다. (JPG, PNG, WEBP만 가능)');
      return false;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onError('파일 크기는 5MB를 초과할 수 없습니다.');
      return false;
    }
    return true;
  };

  const uploadFile = (file: File, currentIndex: number) => {
    if (!validateFile(file)) return;
    
    // Check maxImages constraint inside the loop correctly in case of multiple files dropped
    if (currentIndex >= maxImages) {
      onError(`최대 ${maxImages}장까지만 업로드 가능합니다.`);
      return;
    }

    const fileId = Math.random().toString(36).substring(7);
    setUploadingFiles(prev => ({ ...prev, [fileId]: 0 }));

    const storage = getStorage();
    const path = pathGenerator(file, currentIndex);
    const storageRef = ref(storage, path);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadingFiles(prev => ({ ...prev, [fileId]: progress }));
      },
      (error) => {
        setUploadingFiles(prev => {
          const newObj = { ...prev };
          delete newObj[fileId];
          return newObj;
        });
        onError('이미지 업로드에 실패했습니다: ' + error.message);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadingFiles(prev => {
            const newObj = { ...prev };
            delete newObj[fileId];
            return newObj;
          });
          
          const currentArray = Array.isArray(images) ? images : (images ? [images] : []);
          const newImages = [...currentArray, downloadURL];
          onChange(multiple ? newImages : downloadURL);
        } catch (err) {
          onError('이미지 URL을 가져오는 데 실패했습니다.');
        }
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      let currentIndex = images.length;
      Array.from(e.target.files).forEach((file) => {
        uploadFile(file, currentIndex++);
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      let currentIndex = images.length;
      Array.from(e.dataTransfer.files).forEach((file) => {
        uploadFile(file, currentIndex++);
      });
    }
  }, [images.length, maxImages, multiple]); // Dependencies include images.length

  const handleDelete = (indexToDelete: number) => {
    const newImages = images.filter((_, index) => index !== indexToDelete);
    onChange(multiple ? newImages : (newImages[0] || ''));
  };

  // Drag and Drop reordering
  const [dragItemIndex, setDragItemIndex] = useState<number | null>(null);

  const handleItemDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDragItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleItemDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragItemIndex === null || dragItemIndex === index) return;

    const newImages = [...images];
    const item = newImages.splice(dragItemIndex, 1)[0];
    newImages.splice(index, 0, item);
    onChange(multiple ? newImages : newImages[0]);
    setDragItemIndex(null);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>이미지 업로드</label>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {images.map((url, index) => (
          <div 
            key={url + index}
            draggable
            onDragStart={(e) => handleItemDragStart(e, index)}
            onDragOver={handleItemDragOver}
            onDrop={(e) => handleItemDrop(e, index)}
            style={{ 
              position: 'relative', width: '120px', height: '120px', 
              border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden',
              cursor: 'grab'
            }}
          >
            <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {multiple && index === 0 && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%',
                background: 'rgba(0,123,255,0.8)', color: 'white', fontSize: '12px',
                textAlign: 'center', padding: '2px 0'
              }}>
                대표 이미지
              </div>
            )}
            <button
              type="button"
              onClick={() => handleDelete(index)}
              style={{
                position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: 'white',
                border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer'
              }}
            >
              &times;
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '120px', height: '120px',
              border: `2px dashed ${isDragging ? '#007bff' : '#ccc'}`,
              borderRadius: '8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              background: isDragging ? '#f0f8ff' : '#fafafa',
              transition: 'background-color 0.2s ease',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ fontSize: '24px', color: '#999' }}>+</span>
            <span style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {images.length} / {maxImages}
            </span>
            <input
              type="file"
              multiple={multiple}
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg, image/png, image/webp"
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {Object.entries(uploadingFiles).map(([id, progress]) => (
        <div key={id} style={{ marginTop: '0.5rem', width: '100%', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '4px', background: '#007bff', transition: 'width 0.2s ease' }} />
        </div>
      ))}
    </div>
  );
}
