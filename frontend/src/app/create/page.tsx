'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { contentAPI } from '../../services/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 5000;

const createContentSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내로 입력해주세요'),
  contentType: z.enum(['text', 'pdf']),
  textContent: z.string().max(MAX_TEXT_LENGTH, `텍스트는 최대 ${MAX_TEXT_LENGTH}자까지 입력 가능합니다`).optional(),
  allowLocation: z.boolean().default(true),
});

type CreateContentFormData = z.infer<typeof createContentSchema>;

export default function CreateContent() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateContentFormData>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      contentType: 'text',
      allowLocation: true,
    },
  });

  const contentType = watch('contentType');
  const allowLocation = watch('allowLocation');

  // Get user location if allowed
  const getUserLocation = () => {
    if (navigator.geolocation && allowLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('위치 정보를 가져오는데 실패했습니다. 위치 권한을 확인해주세요.');
        }
      );
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > MAX_FILE_SIZE) {
      setError(`파일 크기는 10MB 이하여야 합니다. 현재 파일 크기: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }
    
    if (file.type !== 'application/pdf') {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }
    
    setSelectedFile(file);
    setError('');
  };

  // Get user location when component mounts if allowed
  useEffect(() => {
    if (allowLocation) {
      getUserLocation();
    }
  }, [allowLocation]);

  const onSubmit = async (data: CreateContentFormData) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (data.contentType === 'pdf' && !selectedFile) {
      setError('PDF 파일을 선택해주세요.');
      return;
    }
    
    if (data.contentType === 'text' && (!data.textContent || data.textContent.trim() === '')) {
      setError('텍스트 내용을 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('contentType', data.contentType);
      
      if (data.contentType === 'text' && data.textContent) {
        formData.append('textContent', data.textContent);
      } else if (data.contentType === 'pdf' && selectedFile) {
        formData.append('file', selectedFile);
      }
      
      if (allowLocation && location) {
        formData.append('latitude', location.lat.toString());
        formData.append('longitude', location.lng.toString());
      }
      
      const response = await contentAPI.createContent(formData);
      
      // Redirect to the newly created content page
      if (response && response.data && response.data.id) {
        router.push(`/content/${response.data.id}`);
      } else {
        router.push('/profile'); // Fallback to profile page if no ID returned
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '콘텐츠 업로드에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request location permission when component mounts or when allowLocation changes
  useState(() => {
    if (allowLocation) {
      getUserLocation();
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-whale-600"></div>
      </div>
    );
  }

  if (!isAuthenticated && !loading) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">새 콘텐츠 작성</h1>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              제목
            </label>
            <div className="mt-1">
              <input
                id="title"
                type="text"
                className="input-field"
                {...register('title')}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              콘텐츠 유형
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  id="contentType-text"
                  type="radio"
                  value="text"
                  className="h-4 w-4 text-blue-whale-600 focus:ring-blue-whale-500"
                  {...register('contentType')}
                />
                <label htmlFor="contentType-text" className="ml-2 block text-sm text-gray-700">
                  텍스트
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="contentType-pdf"
                  type="radio"
                  value="pdf"
                  className="h-4 w-4 text-blue-whale-600 focus:ring-blue-whale-500"
                  {...register('contentType')}
                />
                <label htmlFor="contentType-pdf" className="ml-2 block text-sm text-gray-700">
                  PDF 파일
                </label>
              </div>
            </div>
          </div>
          
          {contentType === 'text' && (
            <div>
              <label htmlFor="textContent" className="block text-sm font-medium text-gray-700">
                텍스트 내용 (최대 5,000자)
              </label>
              <div className="mt-1">
                <textarea
                  id="textContent"
                  rows={10}
                  className="input-field"
                  {...register('textContent')}
                />
                {errors.textContent && (
                  <p className="mt-1 text-sm text-red-600">{errors.textContent.message}</p>
                )}
              </div>
            </div>
          )}
          
          {contentType === 'pdf' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                PDF 파일 (최대 10MB)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-whale-600 hover:text-blue-whale-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-whale-500"
                    >
                      <span>파일 선택</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="application/pdf"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">또는 여기에 파일을 끌어다 놓으세요</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF 파일만 가능합니다</p>
                </div>
              </div>
              {selectedFile && (
                <p className="mt-2 text-sm text-green-600">
                  선택된 파일: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center">
            <input
              id="allowLocation"
              type="checkbox"
              className="h-4 w-4 text-blue-whale-600 focus:ring-blue-whale-500 border-gray-300 rounded"
              {...register('allowLocation')}
            />
            <label htmlFor="allowLocation" className="ml-2 block text-sm text-gray-700">
              내 현재 위치 정보 포함하기
            </label>
          </div>
          
          {allowLocation && location && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              <p className="text-sm">
                위치 정보가 성공적으로 확인되었습니다. 위도: {location.lat.toFixed(6)}, 경도: {location.lng.toFixed(6)}
              </p>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="button"
              className="mr-4 btn-secondary"
              onClick={() => router.back()}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  업로드 중...
                </div>
              ) : (
                '게시하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
