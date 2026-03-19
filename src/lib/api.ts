import { WeatherData } from './weather';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1';

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,visibility,pressure_msl',
    hourly: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,precipitation,visibility,uv_index',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max',
    timezone: 'auto',
    forecast_days: '2',
  });

  const response = await fetch(`${OPEN_METEO_URL}/forecast?${params}`);
  
  if (!response.ok) {
    throw new Error(`天气数据获取失败: ${response.status}`);
  }

  return response.json();
}

// 逆地理编码 - 获取城市名
export async function fetchLocationName(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`
    );
    
    if (!response.ok) {
      return '当前位置';
    }
    
    const data = await response.json();
    return data.address?.city || data.address?.town || data.address?.county || '当前位置';
  } catch {
    return '当前位置';
  }
}
