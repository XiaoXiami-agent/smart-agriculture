const cloud = require('wx-server-sdk')
const https = require('https')
const zlib = require('zlib')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const apiKey = 'cd2bb3e6afb74b419f29840889edf909'

// 统一的 HTTP 请求方法
function httpRequest(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 8000
    }
    
    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const encoding = res.headers['content-encoding']
        
        let data = buffer
        if (encoding === 'gzip') {
          data = zlib.gunzipSync(buffer)
        } else if (encoding === 'deflate') {
          data = zlib.inflateSync(buffer)
        }
        
        try {
          const json = JSON.parse(data.toString())
          resolve(json)
        } catch (e) {
          resolve({ parseError: true, raw: data.toString().substring(0, 200) })
        }
      })
    })
    
    req.on('error', e => resolve({ error: e.message }))
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.end()
  })
}

// 获取实时天气（支持 location ID 或 经纬度）
async function getNowWeather(location) {
  const url = `https://mp2r6y7ug8.re.qweatherapi.com/v7/weather/now?location=${location}&key=${apiKey}`
  return await httpRequest(url)
}

// 获取天气预报 (3天)
async function getForecast(location) {
  const url = `https://mp2r6y7ug8.re.qweatherapi.com/v7/weather/3d?location=${location}&key=${apiKey}`
  return await httpRequest(url)
}

// 城市搜索（通过城市名获取 location ID）
async function searchCity(city) {
  const url = `https://mp2r6y7ug8.re.qweatherapi.com/v2/city/lookup?location=${encodeURIComponent(city)}&key=${apiKey}`
  return await httpRequest(url)
}

// 逆地理编码（通过坐标获取城市信息）
async function reverseGeocoder(lat, lon) {
  // 尝试多个逆地理编码 API
  const apis = [
    // 和风天气城市查询（用坐标直接查）
    { url: `https://mp2r6y7ug8.re.qweatherapi.com/v2/city/lookup?location=${lon},${lat}&key=${apiKey}`, parser: 'hefeng' },
    // 高德地图逆地理编码
    { url: `https://restapi.amap.com/v3/geocode/regeo?key=&location=${lon},${lat}`, parser: 'amap' }
  ]
  
  for (const api of apis) {
    try {
      const result = await httpRequest(api.url)
      if (api.parser === 'hefeng' && result.code === '200') return { success: true, data: result, type: 'hefeng' }
      if (api.parser === 'amap' && result.status === '1') return { success: true, data: result, type: 'amap' }
    } catch (e) {
      continue
    }
  }
  
  return { success: false }
}

exports.main = async (event, context) => {
  const { location, city, type, latitude, longitude } = event
  
  // 逆地理编码（通过坐标获取城市）
  if (latitude && longitude) {
    // 和风天气 API 支持直接用坐标查询天气
    const [now, forecast] = await Promise.all([
      getNowWeather(`${longitude},${latitude}`),
      getForecast(`${longitude},${latitude}`)
    ])
    return { 
      now, 
      forecast, 
      locationInfo: { id: null, name: '未知', lat: latitude, lon: longitude }
    }
  }
  
  // 城市搜索
  if (type === 'search') {
    return await searchCity(city || location)
  }
  
  // 默认使用 location ID
  const loc = location || '101280601'
  const dataType = type || 'all'

  if (dataType === 'all') {
    const [now, forecast] = await Promise.all([
      getNowWeather(loc),
      getForecast(loc)
    ])
    return { now, forecast }
  } else if (dataType === 'forecast') {
    return await getForecast(loc)
  } else {
    return await getNowWeather(loc)
  }
}
