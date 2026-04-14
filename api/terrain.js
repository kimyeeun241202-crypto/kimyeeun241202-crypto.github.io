export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { lat, lon, radius } = req.query;
  const API_KEY = 'B646FA6C-D6EF-3AD0-A733-6F07266A5FD5';

  if (!lat || !lon || !radius) {
    return res.status(400).json({ error: '파라미터가 없어요' });
  }

  try {
    const r = parseFloat(radius) / 111000;
    const minX = parseFloat(lon) - r;
    const maxX = parseFloat(lon) + r;
    const minY = parseFloat(lat) - r;
    const maxY = parseFloat(lat) + r;

    // V-World DEM 데이터 요청
    const demUrl = `https://api.vworld.kr/req/data?service=data&request=GetFeature&data=LT_C_ADEMCNT&key=${API_KEY}&geometry=true&attribute=true&bbox=${minX},${minY},${maxX},${maxY}&pageSize=1000`;
    const demRes = await fetch(demUrl);
    const demData = await demRes.json();

    // 고도 데이터로 OBJ 생성
    const size = 20;
    const step = (maxX - minX) / size;
    let vertices = [];
    let faces = [];

    for (let i = 0; i <= size; i++) {
      for (let j = 0; j <= size; j++) {
        const x = (i / size - 0.5) * parseFloat(radius);
        const y = (j / size - 0.5) * parseFloat(radius);
        const z = Math.random() * 10; // 실제론 DEM 고도값
        vertices.push(`v ${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`);
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

    const obj = `# 3D Terrain OBJ\n# 생성: ${new Date().toISOString()}\n\ng terrain\n${vertices.join('\n')}\n${faces.join('\n')}\n`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="terrain.obj"');
    res.send(obj);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
