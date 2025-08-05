import { API_CONFIG, API_ENDPOINTS } from '@/config/constants';

class HeaderService {
  async getUserInfo() {
    try {
      // Placeholder per future API calls relative all'utente
      return {
        username: 'User',
        role: 'admin'
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }
}

export const headerService = new HeaderService();