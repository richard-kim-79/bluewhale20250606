'use client';

import UserRecommendations from './UserRecommendations';
import { useAuth } from '../contexts/AuthContext';

const SuggestedUsers = () => {
  const { user } = useAuth();
  
  return (
    <UserRecommendations 
      limit={3} 
      title="팔로우 추천" 
      excludeUserId={user?.id}
    />
  );
};

export default SuggestedUsers;
