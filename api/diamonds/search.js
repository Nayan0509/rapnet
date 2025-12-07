const axios = require('axios');

// Token cache (shared across function invocations)
let tokenData = {
  access_token: null,
  expires_at: null
};

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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received search request:', req.body);
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

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error searching diamonds:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to search diamonds',
      details: error.response?.data || error.message
    });
  }
};
