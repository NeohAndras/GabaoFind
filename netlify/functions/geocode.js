exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    const { address } = event.queryStringParameters;
    if (!address) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Address required' }) };
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Gabon')}&countrycodes=GA&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'GabaoIndex/1.0' }
      });
      const data = await response.json();

      if (data.length > 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          })
        };
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Address not found' })
        };
      }
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};