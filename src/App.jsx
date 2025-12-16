import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Map from '../src/components/Map';
import Machine from './components/Machine';
import Productivity from './components/Productivity';
import Report from './components/Report';
import MachineDetails from './components/MachineDetails';
import NotFound from './components/NotFound';
import DetailedGraph from './components/DetailedGraph';
import Production from './components/Production';
import { authService } from './services/authService';
import Login from './pages/Login';
import Register from './pages/Register';
import axios from 'axios';
import ReportView from './components/ReportView';

// Configure axios defaults
axios.defaults.baseURL = 'http://your-backend-url'; // Replace with your actual backend URL

// Add interceptors for better error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    if (error.response?.status === 500) {
      // Handle 500 error
      console.error('Server error:', error.response.data);
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <Router>
      <div className="relative">
        <video autoPlay loop muted className="absolute top-0 left-0 w-full h-full object-cover z-[-1]">
          <source src="/Assets/789.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/energymonitoring" 
            element={
              authService.isAuthenticated() ? 
                <Navigate to="/energymonitoring/map" replace /> : 
                <Login />
            } 
          />
          <Route 
            path="/energymonitoring/register" 
            element={
              authService.isAuthenticated() ? 
                <Navigate to="/energymonitoring/map" replace /> : 
                <Register />
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/energymonitoring/map" 
            element={
              <Map />
            } 
          />
          <Route 
            path="/energymonitoring/machine" 
            element={
              <Machine />
            } 
          />
          <Route 
            path="/energymonitoring/productivity" 
            element={
              <Productivity />
            } 
          />
          <Route 
            path="/energymonitoring/report" 
            element={
              <Report />
            } 
          />
          <Route 
            path="/energymonitoring/machine/:machineId" 
            element={
              <MachineDetails />
            } 
          />
          <Route 
            path="/energymonitoring/detailed-graph" 
            element={
              <DetailedGraph />
            } 
          />
          <Route 
            path="/energymonitoring/production" 
            element={
              <Production />
            } 
          />
          <Route 
            path="/energymonitoring/report-view/:encodedData" 
            element={
              <ReportView />
            } 
          />
          <Route 
            path="/energymonitoring/real-time-graph" 
            element={
              <NotFound />
            } 
          />

          {/* Root redirect */}
          <Route 
            path="/" 
            element={<Navigate to="/energymonitoring" replace />} 
          />

          {/* Not Found Route */}
          <Route path="*" element={<Navigate to="/energymonitoring/real-time-graph" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;