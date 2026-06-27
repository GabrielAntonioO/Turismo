// api/wikipedia.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro query' });
  }

  try {
    // Buscar en Wikipedia
    const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
      return res.status(200).json({ fotos: [] });
    }

    // Tomar el primer resultado
    const pageTitle = searchData.query.search[0].title;
    
    // Obtener las imágenes de la página
    const imagesUrl = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&format=json&origin=*`;
    const imagesResponse = await fetch(imagesUrl);
    const imagesData = await imagesResponse.json();
    
    const pages = imagesData.query.pages;
    const pageId = Object.keys(pages)[0];
    const images = pages[pageId].images || [];
    
    // Filtrar solo imágenes (no archivos .svg, .ogg, etc.)
    const imageFiles = images
      .filter(img => img.title.match(/\.(jpg|jpeg|png|gif)$/i))
      .slice(0, 5);
    
    // Obtener URLs de las imágenes
    const fotos = [];
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

    return res.status(200).json({ fotos });

  } catch (error) {
    console.error('Error en Wikipedia:', error);
    return res.status(500).json({ 
      error: 'Error consultando Wikipedia',
      detalle: error.message 
    });
  }
}
