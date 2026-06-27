// api/unsplash.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro query' });
  }

  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!UNSPLASH_ACCESS_KEY) {
    return res.status(500).json({ error: 'Falta la API key de Unsplash' });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&order_by=popular`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash error: ${response.status}`);
    }

    const data = await response.json();
    
    const fotos = data.results.slice(0, 3).map(foto => ({
      id: foto.id,
      urls: {
        small: foto.urls.small,
        regular: foto.urls.regular,
        raw: foto.urls.raw
      },
      alt_description: foto.alt_description || query,
      user: {
        name: foto.user.name,
        username: foto.user.username
      }
    }));

    return res.status(200).json({ fotos });

  } catch (error) {
    console.error('Error en Unsplash:', error);
    return res.status(500).json({ 
      error: 'Error consultando Unsplash',
      detalle: error.message 
    });
  }
}
