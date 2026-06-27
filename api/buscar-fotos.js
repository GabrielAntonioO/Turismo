// api/buscar-fotos.js - VERSIÓN SIMPLIFICADA (SOLO WIKIPEDIA)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro query' });
  }

  console.log('🔍 Buscando fotos para:', query);

  try {
    // Usar Wikipedia (no necesita clave)
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/wikipedia?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Wikipedia error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📸 Fotos encontradas:', data.fotos?.length || 0);
    
    return res.status(200).json({ 
      fotos: data.fotos || [],
      fuente: 'Wikipedia'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: 'Error buscando fotos',
      detalle: error.message 
    });
  }
}
