// api/buscar-fotos.js - VERSIÓN MEJORADA
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro query' });
  }

  console.log(`🔍 Buscando fotos para: "${query}"`);

  try {
    // 1. Intentar Wikipedia con la búsqueda mejorada
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/wikipedia?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Wikipedia error: ${response.status}`);
    }
    
    const data = await response.json();
    let fotos = data.fotos || [];
    
    console.log(`📸 Fotos encontradas: ${fotos.length}`);
    
    // 2. Si no hay fotos, intentar una búsqueda más genérica
    if (fotos.length === 0) {
      const queryGenerica = query.split('(')[0].trim();
      console.log(`🔄 Intentando búsqueda genérica: "${queryGenerica}"`);
      
      const response2 = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/wikipedia?query=${encodeURIComponent(queryGenerica)}`);
      const data2 = await response2.json();
      fotos = data2.fotos || [];
      console.log(`📸 Fotos en búsqueda genérica: ${fotos.length}`);
    }
    
    // 3. Si aún no hay fotos, usar imágenes de respaldo
    if (fotos.length === 0) {
      console.log(`🔄 Usando imágenes de respaldo para: "${query}"`);
      
      // Imágenes de respaldo para lugares comunes
      const respaldo = {
        'castrelos': [
          'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Vigo_-_Monte_del_Castro.jpg/800px-Vigo_-_Monte_del_Castro.jpg',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Vigo_-_Puerto_Deportivo.jpg/800px-Vigo_-_Puerto_Deportivo.jpg',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Vigo_-_Concatedral_de_Santa_Mar%C3%ADa.jpg/800px-Vigo_-_Concatedral_de_Santa_Mar%C3%ADa.jpg'
        ],
        'castillo de castro': [
          'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Vigo_-_Monte_del_Castro.jpg/800px-Vigo_-_Monte_del_Castro.jpg',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Vigo_-_Puerto_Deportivo.jpg/800px-Vigo_-_Puerto_Deportivo.jpg',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Vigo_-_Concatedral_de_Santa_Mar%C3%ADa.jpg/800px-Vigo_-_Concatedral_de_Santa_Mar%C3%ADa.jpg'
        ]
      };
      
      const clave = query.toLowerCase().trim();
      const imagenesRespaldo = respaldo[clave] || respaldo[clave.split(' ')[0]] || [];
      
      if (imagenesRespaldo.length > 0) {
        fotos = imagenesRespaldo.map(url => ({
          url: url,
          title: query,
          description: `Imagen de ${query}`
        }));
        console.log(`✅ Usando ${fotos.length} imágenes de respaldo`);
      }
    }
    
    return res.status(200).json({ 
      fotos: fotos.slice(0, 3),
      fuente: 'Wikipedia + Respaldo',
      total: fotos.length
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      fotos: [],
      error: 'Error buscando fotos',
      detalle: error.message 
    });
  }
}
