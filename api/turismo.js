function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { lat, lon, type } = req.query;
  if (!lat || !lon || !type) return res.status(400).json({ error: 'Faltan parámetros' });

  const latN = parseFloat(lat);
  const lonN = parseFloat(lon);

  let tipoTexto = 'puntos de interés turístico';
  let instrucciones = 'No incluyas restaurantes ni bares.';

  if (type === 'comer') {
    tipoTexto = 'restaurantes, cafés, bares y lugares para comer';
    instrucciones = 'Incluye todo tipo de establecimientos para comer y beber: restaurantes, cafés, bares, pizzerías, taquerías, etc.';
  } else if (type === 'gasolineras') {
    tipoTexto = 'gasolineras y estaciones de servicio';
    instrucciones = 'Solo gasolineras tradicionales con surtidor de combustible.';
  }

  const prompt = `Eres un guía de turismo experto. La ubicación exacta del usuario es: lat=${latN}, lon=${lonN}.

Dame una lista de exactamente 8 ${tipoTexto} cerca de esta ubicación.
${instrucciones}

Para cada lugar:
- Proporciona las coordenadas GPS reales y precisas del lugar
- Calcula la distancia en km usando la fórmula de Haversine desde lat=${latN}, lon=${lonN} hasta las coordenadas del lugar
- Ordena la lista de menor a mayor distancia real calculada

Responde SOLO con un array JSON válido, sin texto adicional, sin markdown, sin explicaciones:
[
  {
    "nombre": "Nombre del lugar",
    "ciudad": "Ciudad donde está",
    "descripcion": "Descripción breve de 1-2 frases",
    "distancia_km": 2.5,
    "lat": 42.123,
    "lon": -8.456
  }
]`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'Eres un guía de turismo experto. Respondes SIEMPRE con JSON válido, sin markdown, sin texto adicional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const lugares = JSON.parse(clean);
    
    // Recalculate distances using real coordinates
    const lugaresConDistancia = lugares.map(l => ({
      ...l,
      distancia_km: parseFloat(haversine(latN, lonN, l.lat, l.lon))
    }));
    
    // Re-sort by actual distance
    lugaresConDistancia.sort((a, b) => a.distancia_km - b.distancia_km);
    
    return res.status(200).json(lugaresConDistancia);

  } catch (e) {
    return res.status(500).json({ error: 'Error consultando la IA', detalle: e.message });
  }
}
