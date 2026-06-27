// api/pexels.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro query' });
  }

  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  
  if (!PEXELS_API_KEY) {
    return res.status(500).json({ error: 'Falta la API key de Pexels' });
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels error: ${response.status}`);
    }

    const data = await response.json();
    
    const fotos = data.photos.slice(0, 3).map(foto => ({
      id: foto.id,
      urls: {
        small: foto.src.small,
        medium: foto.src.medium,
        large: foto.src.large,
        original: foto.src.original
      },
      alt: foto.alt || query,
      photographer: {
        name: foto.photographer,
        url: foto.photographer_url
      }
    }));

    return res.status(200).json({ fotos });

  } catch (error) {
    console.error('Error en Pexels:', error);
    return res.status(500).json({ 
      error: 'Error consultando Pexels',
      detalle: error.message 
    });
  }
}
