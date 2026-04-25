const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Load data
      const dataPath = path.join(__dirname, '../../../data.json');
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    } else if (event.httpMethod === 'POST') {
      // Save data (Note: This won't work in production without persistent storage)
      const dataPath = path.join(__dirname, '../../../data.json');
      fs.writeFileSync(dataPath, JSON.stringify(JSON.parse(event.body), null, 2));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Data saved successfully' })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};