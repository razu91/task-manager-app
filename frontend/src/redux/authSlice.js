import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Base URL Configuration
const BASE_URL = 'http://localhost:8000';

// Initial State
const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null
};

// Login Thunk
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      // Get CSRF Cookie first (if using Laravel Sanctum)
      await axios.get(`${BASE_URL}/sanctum/csrf-cookie`);

      // Perform Login
      const response = await axios.post(`${BASE_URL}/api/login`, credentials);
      
      // Destructure token and user from response
      const { token, user } = response.data;

      // Store token and user in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { token, user };
    } catch (error) {
      // Handle different types of errors
      const message = error.response?.data?.message 
        || error.message 
        || 'Login failed';
      
      return rejectWithValue(message);
    }
  }
);

// Register Thunk
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      await axios.get(`${BASE_URL}/sanctum/csrf-cookie`);
      
      const response = await axios.post(`${BASE_URL}/api/register`, userData);
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message 
        || error.message 
        || 'Registration failed';
      
      return rejectWithValue(message);
    }
  }
);

// Logout Thunk
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Optional: Call backend logout endpoint
      await axios.post(`${BASE_URL}/api/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return null;
    } catch (error) {
      // Even if backend logout fails, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const message = error.response?.data?.message 
        || error.message 
        || 'Logout failed';
      
      return rejectWithValue(message);
    }
  }
);

// Refresh User Thunk (Optional: to validate token and get fresh user data)
export const refreshUser = createAsyncThunk(
  'auth/refreshUser',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return rejectWithValue('No token found');
    }

    try {
      const response = await axios.get(`${BASE_URL}/api/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      // If refresh fails, logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const message = error.response?.data?.message 
        || error.message 
        || 'Failed to refresh user';
      
      return rejectWithValue(message);
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Optional: Manual token reset
    resetError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login Reducers
    builder
    .addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    })
    .addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    })

    // Register Reducers
    .addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    })

    // Logout Reducers
    .addCase(logoutUser.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
    })

    // Refresh User Reducers
    .addCase(refreshUser.fulfilled, (state, action) => {
      state.user = action.payload;
    })
    .addCase(refreshUser.rejected, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });
  }
});

// Export actions and reducer
export const { resetError } = authSlice.actions;
export default authSlice.reducer;