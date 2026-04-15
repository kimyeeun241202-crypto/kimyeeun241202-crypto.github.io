export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, address, lat, lon, radius } = req.query;
  const API_KEY = 'B646FA6C-D6EF-3AD0-A733-6F07266A5FD5';

  try {
    if (action === 'search') {
      const encoded = encodeURIComponent(address);
      const url = `https://api.vworld.kr/req/address?service=address&request=getcoord&crs=epsg:4326&address=${encoded}&format=json&type=PARCEL&key=${API_KEY}`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const text = await response.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch(e) {
        return res.status(500).json({ error: 'V-World 응답 오류: ' + text.substring(0, 100) });
      }

      if (data.response.status !== 'OK') {
        return res.status(404).json({ error: '주소를 찾을 수 없어요', raw: data });
      }

      return res.status(200).json({
        x: data.response.result.point.x,
        y: data.response.result.point.y
      });
    }

    if (action === 'terrain') {
      const r = parseFloat(radius);
      const size = 30;
      let vertices = [];
      let faces = [];

      for (let i = 0; i <= size; i++) {
        for (let j = 0; j <= size; j++) {
          const x = ((i / size) - 0.5) * r;
          const y = ((j / size) - 0.5) * r;
          vertices.push(`v ${x.toFixed(2)} 0.00 ${y.toFixed(2)}`);
        }
      }

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const a = i * (size + 1) + j + 1;
          const b = a + 1;
          const c = a + (size + 1);
          const d = c + 1;
          faces.push(`f ${a} ${b} ${d}`);
          faces.push(`f ${a} ${d} ${c}`);
        }
      }

      const obj = [
        '# 3D Terrain',
        `# lat: ${lat}, lon: ${lon}, radius: ${radius}m`,
        '',
        'g terrain',
        ...vertices,
        ...faces
      ].join('\n');

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="terrain.obj"');
      return res.send(obj);
    }

    return res.status(400).json({ error: 'action 파라미터가 없어요' });

  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
