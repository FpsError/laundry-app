// Use relative URL in development (proxied by Vite) or absolute URL in production
const API_BASE_URL = import.meta.env.MODE === 'development' 
  ? '/api' 
  : 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  logout() {
    this.clearToken();
  }

  // Time Slots
  async getTimeSlots(date, pairId) {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (pairId) params.append('pair_id', pairId);

      console.log('Fetching timeslots from:', `/timeslots?${params}`);
      const data = await this.request(`/timeslots?${params}`);
      console.log('Timeslots response:', data);
      return data;
  }

  async createTimeSlot(slotData) {
    return this.request('/timeslots', {
      method: 'POST',
      body: JSON.stringify(slotData),
    });
  }

  // Bookings
  async getBookings() {
    return this.request('/bookings');
  }

  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBooking(bookingId, updateData) {
    return this.request(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async cancelBooking(bookingId) {
    return this.request(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  }

  // Waitlist
  async getWaitlist() {
    return this.request('/waitlist');
  }

  // Machines
  async getMachines() {
    return this.request('/machines');
  }

  async updateMachine(machineId, updateData) {
    return this.request(`/machines/${machineId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }
}

export default new ApiClient();
