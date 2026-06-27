// api/wikipedia.js - VERSIÓN MEJORADA
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro query' });
  }

  try {
    // GENERAR MÚLTIPLES VARIACIONES DE BÚSQUEDA
    const variaciones = [
      query,                                    // "Castrelos (Vigo)"
      query.replace(/\(.*\)/, '').trim(),      // "Castrelos"
      query.split('(')[0].trim(),              // "Castrelos"
      `${query} parque`,                       // "Castrelos (Vigo) parque"
      `${query} monumento`,                    // "Castrelos (Vigo) monumento"
      `${query} lugar turístico`,              // "Castrelos (Vigo) lugar turístico"
      query.split(' ').slice(0, 2).join(' '),  // "Castrelos Vigo"
      query.split(' ')[0],                     // "Castrelos"
      `${query.split(' ')[0]} ${query.split(' ')[1] || ''}`, // "Castrelos Vigo"
    ];

    // Eliminar duplicados y vacíos
    const busquedasUnicas = [...new Set(variaciones.filter(b => b.length > 0))];
    
    console.log(`🔍 Buscando "${query}" con ${busquedasUnicas.length} variaciones...`);

    let fotos = [];
    let paginaUsada = '';

    for (const busqueda of busquedasUnicas) {
      if (fotos.length > 0) break;
      
      try {
        // Buscar en Wikipedia
        const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(busqueda)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
          console.log(`⏭️ Sin resultados para: "${busqueda}"`);
          continue;
        }

        const pageTitle = searchData.query.search[0].title;
        paginaUsada = pageTitle;
        console.log(`✅ Encontrada página: "${pageTitle}" para búsqueda: "${busqueda}"`);
        
        // Obtener imágenes de la página
        const imagesUrl = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&format=json&origin=*`;
        const imagesResponse = await fetch(imagesUrl);
        const imagesData = await imagesResponse.json();
        
        const pages = imagesData.query.pages;
        const pageId = Object.keys(pages)[0];
        const images = pages[pageId].images || [];
        
        console.log(`🖼️ Encontradas ${images.length} imágenes en "${pageTitle}"`);
        
        // Filtrar solo imágenes (jpg, jpeg, png, gif)
        const imageFiles = images
          .filter(img => img.title.match(/\.(jpg|jpeg|png|gif)$/i))
          .slice(0, 5);
        
        for (const img of imageFiles) {
          const infoUrl = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
          const infoResponse = await fetch(infoUrl);
          const infoData = await infoResponse.json();
          
          const infoPages = infoData.query.pages;
          const infoPageId = Object.keys(infoPages)[0];
          const imageInfo = infoPages[infoPageId].imageinfo;
          
          if (imageInfo && imageInfo[0]) {
            fotos.push({
              url: imageInfo[0].url,
              title: img.title,
              description: `Imagen de ${pageTitle}`
            });
          }
        }
      } catch (e) {
        console.log(`❌ Error con "${busqueda}":`, e.message);
        continue;
      }
    }

    console.log(`📸 Total fotos encontradas: ${fotos.length}`);
    
    return res.status(200).json({ fotos: fotos.slice(0, 3) });

  } catch (error) {
    console.error('❌ Error en Wikipedia:', error);
    return res.status(500).json({ 
      error: 'Error consultando Wikipedia',
      detalle: error.message 
    });
  }
}
