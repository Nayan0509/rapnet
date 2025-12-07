require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Token management
let tokenData = {
  access_token: null,
  expires_at: null
};

// Get access token with auto-refresh
async function getAccessToken() {
  const now = Date.now();
  
  // Check if token exists and is still valid (refresh 5 minutes before expiry)
  if (tokenData.access_token && tokenData.expires_at && now < tokenData.expires_at - 300000) {
    return tokenData.access_token;
  }

  // Fetch new token
  try {
    const response = await axios.post('https://authztoken.api.rapaport.com/api/get', {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    tokenData.access_token = response.data.access_token;
    tokenData.expires_at = now + (response.data.expires_in * 1000);
    
    console.log('New token obtained, expires in', response.data.expires_in, 'seconds');
    return tokenData.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error.response?.data || error.message);
    throw new Error('Failed to obtain access token');
  }
}

// API endpoint to search diamonds
app.post('/api/diamonds/search', async (req, res) => {
  try {
    const token = await getAccessToken();
    
    const searchParams = req.body;
    
    const response = await axios.post(
      'https://technet.rapnetapis.com/instant-inventory/api/Diamonds',
      { request: { body: searchParams } },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error searching diamonds:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to search diamonds',
      details: error.response?.data || error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    tokenValid: tokenData.access_token && Date.now() < tokenData.expires_at
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
