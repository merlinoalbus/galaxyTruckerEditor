import { API_CONFIG, API_ENDPOINTS } from '@/config/constants';

class SidebarService {
  async getNavigationItems() {
    try {
      // Placeholder per future API calls per menu dinamici
      return [
        {
          id: 'campaign',
          title: 'Campaign',
          items: [
            { id: 'overview', label: 'Overview' },
            { id: 'interactive-map', label: 'Interactive Map' },
            { id: 'variables', label: 'Variables' }
          ]
        }
      ];
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      return [];
    }
  }
}

export const sidebarService = new SidebarService();