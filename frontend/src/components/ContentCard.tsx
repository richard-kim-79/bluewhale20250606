'use client';

import Link from 'next/link';

interface ContentCardProps {
  content: {
    id: string;
    title: string;
    summary: string;
    author?: {
      id: string;
      email: string;
    } | string;
    createdAt: string;
    location?: { lat: number; lng: number };
    distance?: number | string;
    type: 'text' | 'pdf';
    aiScore: number;
  };
}

export default function ContentCard({ content }: ContentCardProps) {
  const formattedDate = new Date(content.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Handle different author formats
  const authorText = typeof content.author === 'string' 
    ? content.author 
    : content.author?.email || '알 수 없음';

  return (
    <Link href={`/content/${content.id}`}>
      <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 cursor-pointer">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h2>
            <p className="text-gray-600 mb-4 line-clamp-2">{content.summary}</p>
            
            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-3">{authorText}</span>
              <span className="mr-3">•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className={`
              ${content.type === 'pdf' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
              px-2 py-1 rounded text-xs font-medium mb-2
            `}>
              {content.type === 'pdf' ? 'PDF' : 'TEXT'}
            </div>
            
            {content.location && content.distance !== undefined && (
              <div className="flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="text-gray-500">
                  {typeof content.distance === 'number' 
                    ? `${content.distance.toFixed(1)}km 거리` 
                    : content.distance}
                </span>
              </div>
            )}
            
            <div className="mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              <span className="text-blue-600 font-medium">AI 점수: {content.aiScore}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
