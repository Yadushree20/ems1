import moment from 'moment';
import axios from 'axios';

const BASE_URL = 'http://172.18.7.93:9999';

// Helper function to handle API responses
const handleApiResponse = async (response, errorMessage) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${errorMessage}: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// API Endpoints
export const API_ENDPOINTS = {
  getMachines: `${BASE_URL}/machines`,
  // getMachineById: (id) => `${BASE_URL}/machines/${id}`,
  // getMachineStatus: (id) => `${BASE_URL}/machines/${id}/status`,
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
  getProductionData: (machineId, date) => 
    `${BASE_URL}/prod_graph/get_production_data?machine_id=${machineId}&date=${date}`,
  getGraphData: (date) => 
    `${BASE_URL}/prod_graph/get_graph_data?date=${date}`,
  WORKSHOP_PRODUCTION: `${BASE_URL}/prod_graph/get_production_data`,
  MACHINES: `${BASE_URL}/machines`,
  MACHINE_BY_ID: (id) => `${BASE_URL}/machines/${id}`,
  MACHINE_PRODUCTION: (id, date) => `${BASE_URL}/prod_graph/get_production_data?machine_id=${id}&date=${date}`,
};

// API Functions
export const fetchMachineStatus = async (date) => {
  try {
    const response = await fetch(API_ENDPOINTS.getGraphData(date));
    return await handleApiResponse(response, 'Failed to fetch machine status');
  } catch (error) {
    console.error('Error fetching machine status:', error);
    return []; // Return empty array as fallback
  }
};

// URL generator functions
export const getProductionGraphURL = (machineId, date) => 
  API_ENDPOINTS.getProductionData(machineId, date);

export const getGraphDataURL = (date) => 
  API_ENDPOINTS.getGraphData(date);

export const getLiveRecentURL = (machineId) => {
  return `${API_ENDPOINTS.LIVE_RECENT}/${machineId}`;
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
    return `${BASE_URL}/shift_live_data`;
  } catch (error) {
    console.error('Error getting shift live data URL:', error);
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
    const url = new URL(API_ENDPOINTS.getMachines);
    return url.toString();
  } catch (error) {
    console.error('Error constructing machines URL:', error);
    return API_ENDPOINTS.getMachines;
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
  return `${API_ENDPOINTS.SHIFT_LIVE_HISTORY}?date=${date}`;
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
  const url = new URL(API_ENDPOINTS.TOTAL_ENERGY_COSTS);
  url.searchParams.append('date', date);
  return url.toString();
};

export const getDailyEnergyConsumptionURL = (date) => {
  const url = new URL(API_ENDPOINTS.DAILY_ENERGY_CONSUMPTION);
  url.searchParams.append('date', date);
  return url.toString();
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

export const getMachineStatusURL = (machineId) => 
    `${API_ENDPOINTS.MACHINES}/${machineId}/status`;

export const getMachineDataURL = (machineId) => {
  return `${API_ENDPOINTS.getMachineById(machineId)}`;
};

// Workshop Production URL generator
export const getWorkshopProductionURL = (date, machineId) => 
    `${API_ENDPOINTS.WORKSHOP_PRODUCTION}?date=${date}&machine_id=${machineId}`;

// Machine URL generators
export const getMachineDetailsURL = (machineId) => 
    `${API_ENDPOINTS.MACHINES}/${machineId}/details`;

export const getMachineProductionURL = (machineId, date) => 
    `${API_ENDPOINTS.MACHINE_PRODUCTION(machineId, date)}`;

// Helper function to fetch machine details
export const fetchMachineDetails = async (machineId) => {
    try {
        const response = await fetch(getMachineDetailsURL(machineId));
        if (!response.ok) {
            throw new Error(`Machine details fetch failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching machine details:', error);
        throw error;
    }
};

// Helper function to fetch machine production data
export const fetchMachineProduction = async (machineId, date) => {
    try {
        const formattedDate = date ? moment(date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
        const response = await fetch(getMachineProductionURL(machineId, formattedDate));
        if (!response.ok) {
            throw new Error(`Production data fetch failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching production data:', error);
        throw error;
    }
};

export default API_ENDPOINTS;