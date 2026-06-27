// api/buscar-fotos.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro query' });
  }

  // Lista de APIs a probar en orden
  const apis = [
    {
      name: 'Unsplash',
      url: `/api/unsplash?query=${encodeURIComponent(query)}`,
      key: 'UNSPLASH_ACCESS_KEY'
    },
    {
      name: 'Pexels',
      url: `/api/pexels?query=${encodeURIComponent(query)}`,
      key: 'PEXELS_API_KEY'
    },
    {
      name: 'Wikipedia',
      url: `/api/wikipedia?query=${encodeURIComponent(query)}`,
      key: null // Wikipedia no necesita clave
    }
  ];

  let fotos = [];
  let fuenteUsada = 'ninguna';
  
  for (const api of apis) {
    try {
      // Si la API necesita clave y no está configurada, saltar
      if (api.key && !process.env[api.key]) {
        console.log(`Saltando ${api.name}: falta API key`);
        continue;
      }
      
      const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${api.url}`);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data.fotos && data.fotos.length > 0) {
        fotos = data.fotos;
        fuenteUsada = api.name;
        console.log(`✅ Usando ${api.name} para: ${query}`);
        break;
      }
    } catch (error) {
      console.log(`❌ Error con ${api.name}:`, error.message);
    }
  }

  return res.status(200).json({ 
    fotos, 
    fuente: fuenteUsada,
    total: fotos.length
  });
}
