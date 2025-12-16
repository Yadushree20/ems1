import moment from 'moment';
import axios from 'axios';

const BASE_URL = 'http://172.18.7.93:9999';

export const API_ENDPOINTS = {
  MACHINES: `${BASE_URL}/machines/`,
  PROD_GRAPH: `${BASE_URL}/prod_graph/get_production_data`,
  SHIFT_LIVE_HISTORY: `${BASE_URL}/shift_live_history/`,
  GRAPH_DATA: `${BASE_URL}/graph/data`,
  LIVE_RECENT: `${BASE_URL}/live/live_recent`,
  PROD_GRAPH_DATA: `${BASE_URL}/prod_graph/get_graph_data`,
  REPORT_AVERAGE: `${BASE_URL}/report/average_energy_time`,
  SHIFT_LIVE_DATA: `${BASE_URL}/shift_live_data/`,
  HISTORICAL_DATA: `${BASE_URL}/historical_data/`,
  LIVE_DATA: `${BASE_URL}/live/live_recent`,
  REPORT_AVERAGE_ENERGY: `${BASE_URL}/report/average_energy_time/`,
  DAILY_REPORT: `${BASE_URL}/daily_report/`,
  WEEKLY_REPORT: `${BASE_URL}/weekly_report/`,
  MACHINE_ENERGY_COSTS: `${BASE_URL}/report/machine_energy_costs`,
  TOTAL_ENERGY_COSTS: `${BASE_URL}/report/total_energy_costs`,
  DAILY_ENERGY_CONSUMPTION: `${BASE_URL}/report/daily_energy_consumption`,
};

export const getProductionGraphURL = (machineId, date) => {
  try {
    const url = new URL(API_ENDPOINTS.PROD_GRAPH);
    url.searchParams.append('machine_id', machineId);
    url.searchParams.append('date', moment(date).format('YYYY-MM-DD'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing production graph URL:', error);
    return null;
  }
};

export const getLiveRecentURL = (machineId) => {
  try {
    return `${API_ENDPOINTS.LIVE_RECENT}/${machineId}`;
  } catch (error) {
    console.error('Error constructing live recent URL:', error);
    return null;
  }
};

export const getReportURL = (machineId, date) => {
  try {
    const url = new URL(API_ENDPOINTS.REPORT_AVERAGE);
    url.searchParams.append('machine_id', machineId);
    url.searchParams.append('date', moment(date).format('DD-MM-YYYY'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing report URL:', error);
    return null;
  }
};

export const getProductionDataURL = (machineId, date) => {
  try {
    const url = new URL(API_ENDPOINTS.PROD_GRAPH_DATA);
    url.searchParams.append('machine_id', machineId);
    url.searchParams.append('date', moment(date).format('DD-MM-YYYY'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing production data URL:', error);
    return null;
  }
};

export const getHistoricalDataURL = (date) => {
  try {
    const url = new URL(API_ENDPOINTS.HISTORICAL_DATA);
    url.searchParams.append('date', moment(date).format('DD-MM-YYYY'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing historical data URL:', error);
    return null;
  }
};

export const getShiftLiveDataURL = () => {
  try {
    return API_ENDPOINTS.SHIFT_LIVE_DATA;
  } catch (error) {
    console.error('Error constructing shift live data URL:', error);
    return null;
  }
};

export const getLiveDataURL = (machineId) => {
  try {
    return `${API_ENDPOINTS.LIVE_DATA}/${machineId}`;
  } catch (error) {
    console.error('Error constructing live data URL:', error);
    return null;
  }
};

export const getMachinesURL = () => {
  try {
    const url = new URL(API_ENDPOINTS.MACHINES);
    return url.toString();
  } catch (error) {
    console.error('Error constructing machines URL:', error);
    return API_ENDPOINTS.MACHINES;
  }
};

export const getReportAverageEnergyURL = (machineId, date) => {
  try {
    const url = new URL(API_ENDPOINTS.REPORT_AVERAGE_ENERGY);
    url.searchParams.append('machine_name', machineId);
    url.searchParams.append('date', moment(date).format('DD-MM-YYYY'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing report average energy URL:', error);
    return null;
  }
};

export const getShiftLiveHistoryURL = (date) => {
  try {
    return `${API_ENDPOINTS.SHIFT_LIVE_HISTORY}?date=${date}`;
  } catch (error) {
    console.error('Error constructing shift live history URL:', error);
    return null;
  }
};

export const fetchMachinesData = async () => {
  try {
    const response = await fetch(getMachinesURL());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map(machine => ({
        id: Number(machine.id),
        machine_name: machine.machine_name,
        workshop_name: machine.workshop_name,
        mqtt_topic: machine.mqtt_topic,
        mqtt_mach_iden: machine.mqtt_mach_iden
      }));
    }
    
    console.error('Unexpected data format from machines endpoint:', data);
    return [];
  } catch (error) {
    console.error('Error fetching machines data:', error);
    return [];
  }
};

export const getGraphDataURL = (date) => {
  try {
    const url = new URL(API_ENDPOINTS.PROD_GRAPH_DATA);
    url.searchParams.append('date', moment(date).format('YYYY-MM-DD'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing graph data URL:', error);
    return null;
  }
};

export const getDailyReportURL = (date) => {
  try {
    const url = new URL(API_ENDPOINTS.DAILY_REPORT);
    url.searchParams.append('date', moment(date).format('YYYY-MM-DD'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing daily report URL:', error);
    return null;
  }
};

export const getWeeklyReportURL = (date) => {
  try {
    const url = new URL(API_ENDPOINTS.WEEKLY_REPORT);
    url.searchParams.append('date', moment(date).format('YYYY-MM-DD'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing weekly report URL:', error);
    return null;
  }
};

export const getMachineEnergyCostsURL = () => {
  try {
    return API_ENDPOINTS.MACHINE_ENERGY_COSTS;
  } catch (error) {
    console.error('Error constructing machine energy costs URL:', error);
    return null;
  }
};

export const getTotalEnergyCostsURL = (date) => {
  try {
    const url = new URL(API_ENDPOINTS.TOTAL_ENERGY_COSTS);
    url.searchParams.append('date', moment(date).format('YYYY-MM-DD'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing total energy costs URL:', error);
    return null;
  }
};

export const getDailyEnergyConsumptionURL = (date) => {
  try {
    const url = new URL(API_ENDPOINTS.DAILY_ENERGY_CONSUMPTION);
    url.searchParams.append('date', moment(date).format('YYYY-MM-DD'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing daily energy consumption URL:', error);
    return null;
  }
};

export const authService = {
  async register({ email, username, password, role, adminPassKey }) {
    if (role === 'admin' && adminPassKey !== '6565') {
      throw new Error('Invalid admin pass key');
    }

    try {
      const response = await axios.post(`${BASE_URL}/register`, {
        email,
        username,
        password,
        role
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async login(username, password) {
    try {
      const response = await axios.post(`${BASE_URL}/auth`, {
        username,
        password
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

export const getMachineStatesURL = (date) => {
  try {
    const url = new URL(`${BASE_URL}/prod_graph/get_graph_data`);
    url.searchParams.append('date', moment(date).format('YYYY-MM-DD'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing machine states URL:', error);
    return null;
  }
};

export const fetchMachineStates = async (date) => {
  try {
    const response = await fetch(getMachineStatesURL(date));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching machine states:', error);
    return null;
  }
};

export const getMachineStatusURL = (date) => {
  try {
    const url = new URL(`${BASE_URL}/prod_graph/get_graph_data`);
    url.searchParams.append('date', moment(date).format('YYYY-MM-DD'));
    return url.toString();
  } catch (error) {
    console.error('Error constructing machine status URL:', error);
    return null;
  }
};

export const fetchMachineStatus = async (date) => {
  try {
    const response = await fetch(getMachineStatusURL(date));
    if (!response.ok) {
      console.warn(`API returned status ${response.status} for date ${date}. Using default empty data.`);
      return { dataPoints: [] };
    }
    const data = await response.json();
    console.log('Raw status data:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching machine status:', error);
    return { dataPoints: [] };
  }
};