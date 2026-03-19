import { WeatherData } from './weather';

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,visibility,pressure_msl',
    hourly: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,precipitation,visibility,uv_index',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  
  if (!response.ok) {
    throw new Error(`天气数据获取失败: ${response.status}`);
  }

  return response.json();
}

// 逆地理编码 - 使用 BigDataCloud 免费 API（支持 CORS）
export async function fetchLocationName(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
    );
    
    if (!response.ok) {
      return '当前位置';
    }
    
    const data = await response.json();
    
    // BigDataCloud 返回字段说明：
    // city - 城市
    // locality - 地区/区
    // principalSubdivision - 省/直辖市
    // countryName - 国家
    
    const parts: string[] = [];
    
    // 城市
    if (data.city) {
      parts.push(data.city);
    }
    
    // 区/县（locality 在中国通常是区）
    if (data.locality && data.locality !== data.city) {
      parts.push(data.locality);
    }
    
    // 如果没有城市，用省
    if (parts.length === 0 && data.principalSubdivision) {
      parts.push(data.principalSubdivision);
    }
    
    // 如果还是没有，用国家
    if (parts.length === 0 && data.countryName) {
      parts.push(data.countryName);
    }
    
    if (parts.length > 0) {
      return parts.join(' · ');
    }
    
    return '当前位置';
  } catch (error) {
    console.error('获取位置名称失败:', error);
    return '当前位置';
  }
}
