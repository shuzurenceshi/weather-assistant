// Open-Meteo API 类型定义
export interface WeatherData {
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  precipitation: number;
  cloud_cover: number;
  visibility: number;
  pressure_msl: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  relative_humidity_2m: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  visibility: number[];
  uv_index: number[];
}

export interface DailyWeather {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  uv_index_max: number[];
}

// 天气代码转文字描述
export function getWeatherDescription(code: number): string {
  const weatherMap: Record<number, string> = {
    0: '晴朗',
    1: '晴间多云',
    2: '多云',
    3: '阴天',
    45: '雾',
    48: '雾凇',
    51: '小雨',
    53: '中雨',
    55: '大雨',
    56: '冻雨',
    57: '强冻雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    66: '冻雨',
    67: '强冻雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    77: '雪粒',
    80: '阵雨',
    81: '中阵雨',
    82: '大阵雨',
    85: '阵雪',
    86: '大阵雪',
    95: '雷暴',
    96: '雷暴伴小冰雹',
    99: '雷暴伴大冰雹',
  };
  return weatherMap[code] || '未知';
}

// 获取天气图标
export function getWeatherIcon(code: number, isDay: boolean = true): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 3) return isDay ? '⛅' : '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

// 获取背景主题
export function getWeatherTheme(code: number, isDay: boolean = true): string {
  if (!isDay) return 'weather-bg-night';
  if (code === 0) return 'weather-bg-sunny';
  if (code <= 3) return 'weather-bg-cloudy';
  if (code <= 48) return 'weather-bg-cloudy';
  if (code <= 67 || code <= 82) return 'weather-bg-rainy';
  if (code <= 86) return 'weather-bg-snowy';
  return 'weather-bg-sunny';
}

// 风向角度转文字
export function getWindDirection(degrees: number): string {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// 穿衣建议
export function getClothingAdvice(temp: number, windSpeed: number, weatherCode: number): string[] {
  const advice: string[] = [];
  
  if (temp >= 30) {
    advice.push('短袖短裤');
    advice.push('注意防晒');
  } else if (temp >= 25) {
    advice.push('短袖/薄长袖');
    advice.push('轻薄透气');
  } else if (temp >= 20) {
    advice.push('长袖衬衫');
    advice.push('薄外套备用');
  } else if (temp >= 15) {
    advice.push('长袖+薄外套');
    advice.push('早晚温差注意');
  } else if (temp >= 10) {
    advice.push('毛衣/卫衣');
    advice.push('外套必备');
  } else if (temp >= 5) {
    advice.push('厚外套');
    advice.push('围巾手套');
  } else {
    advice.push('羽绒服');
    advice.push('保暖内衣');
    advice.push('帽子手套');
  }
  
  if (windSpeed > 30) {
    advice.push('风大注意防风');
  }
  
  if (weatherCode >= 51 && weatherCode <= 67) {
    advice.push('带伞!');
  }
  
  if (weatherCode >= 71 && weatherCode <= 86) {
    advice.push('防滑鞋');
  }
  
  return advice;
}

// 出行指数
export function getTravelIndex(data: WeatherData): {
  overall: string;
  details: { label: string; value: string; level: 'good' | 'medium' | 'bad' }[];
} {
  const current = data.current;
  const details: { label: string; value: string; level: 'good' | 'medium' | 'bad' }[] = [];
  
  // 紫外线（用云量估算）
  const uvLevel = current.cloud_cover < 30 ? '高' : current.cloud_cover < 60 ? '中等' : '低';
  details.push({
    label: '紫外线',
    value: uvLevel,
    level: uvLevel === '高' ? 'bad' : uvLevel === '中等' ? 'medium' : 'good',
  });
  
  // 能见度
  const visibilityKm = current.visibility / 1000;
  const visibilityLevel = visibilityKm > 10 ? '优秀' : visibilityKm > 5 ? '良好' : '较差';
  details.push({
    label: '能见度',
    value: `${visibilityKm.toFixed(1)}km ${visibilityLevel}`,
    level: visibilityKm > 10 ? 'good' : visibilityKm > 5 ? 'medium' : 'bad',
  });
  
  // 风力
  const windLevel = current.wind_speed_10m < 15 ? '微风' : current.wind_speed_10m < 30 ? '有风' : '大风';
  details.push({
    label: '风力',
    value: `${windLevel} ${current.wind_speed_10m.toFixed(0)}km/h`,
    level: current.wind_speed_10m < 15 ? 'good' : current.wind_speed_10m < 30 ? 'medium' : 'bad',
  });
  
  // 降水
  const rainLevel = current.precipitation === 0 ? '无' : current.precipitation < 5 ? '微量' : '有雨';
  details.push({
    label: '降水',
    value: rainLevel === '无' ? '无降水' : `${current.precipitation}mm`,
    level: current.precipitation === 0 ? 'good' : current.precipitation < 5 ? 'medium' : 'bad',
  });
  
  // 综合评价
  const badCount = details.filter(d => d.level === 'bad').length;
  const overall = badCount === 0 ? '适宜出行' : badCount <= 1 ? '注意防护' : '不建议外出';
  
  return { overall, details };
}

// 助理消息生成
export function generateAssistantMessage(data: WeatherData): string {
  const current = data.current;
  const hourly = data.hourly;
  const messages: string[] = [];
  
  const temp = current.temperature_2m;
  const weatherCode = current.weather_code;
  const weather = getWeatherDescription(weatherCode);
  
  // 当前天气
  if (weatherCode === 0) {
    messages.push(`今天天气晴朗，温度${temp.toFixed(0)}°C，很适合出门活动！`);
  } else if (weatherCode <= 3) {
    messages.push(`今天是${weather}天气，气温${temp.toFixed(0)}°C，体感${current.apparent_temperature.toFixed(0)}°C。`);
  } else if (weatherCode >= 51 && weatherCode <= 67) {
    messages.push(`正在下雨，温度${temp.toFixed(0)}°C，出门记得带伞哦！`);
  } else if (weatherCode >= 71 && weatherCode <= 86) {
    messages.push(`下雪啦！温度${temp.toFixed(0)}°C，注意保暖，路面可能湿滑。`);
  }
  
  // 查看未来几小时是否有雨
  const currentHour = new Date().getHours();
  const nextHours = hourly.precipitation_probability.slice(currentHour, currentHour + 6);
  const willRain = nextHours.some(p => p > 50);
  
  if (willRain && weatherCode < 51) {
    const rainIndex = nextHours.findIndex(p => p > 50);
    if (rainIndex !== -1) {
      messages.push(`提醒：${rainIndex + 1}小时后可能会下雨，出门带把伞以防万一。`);
    }
  }
  
  // 温度提醒
  if (temp >= 30) {
    messages.push('高温天气，注意防暑降温，多喝水！');
  } else if (temp <= 5) {
    messages.push('天气寒冷，多穿点衣服，别着凉了。');
  }
  
  // 风力提醒
  if (current.wind_speed_10m > 40) {
    messages.push('今天风很大，外出注意安全！');
  }
  
  if (messages.length === 0) {
    messages.push(`当前${weather}，气温${temp.toFixed(0)}°C，祝你有美好的一天！`);
  }
  
  return messages.join(' ');
}

// 检查恶劣天气预警
export function checkWeatherAlert(data: WeatherData): {
  type: 'none' | 'yellow' | 'orange' | 'red';
  message: string;
} | null {
  const current = data.current;
  const hourly = data.hourly;
  const daily = data.daily;
  
  // 暴雨预警
  if (current.precipitation > 20 || hourly.precipitation.slice(0, 6).some(p => p > 30)) {
    return {
      type: 'orange',
      message: '⚠️ 暴雨预警：未来几小时可能有强降雨，请减少外出！',
    };
  }
  
  // 大风预警
  if (current.wind_speed_10m > 50 || daily.wind_speed_10m_max[0] > 70) {
    return {
      type: 'yellow',
      message: '⚠️ 大风预警：风力较大，外出注意安全！',
    };
  }
  
  // 高温预警
  if (current.temperature_2m > 38) {
    return {
      type: 'red',
      message: '🚨 高温预警：气温超过38°C，请避免户外活动！',
    };
  }
  
  // 寒潮预警
  if (current.temperature_2m < -5) {
    return {
      type: 'orange',
      message: '⚠️ 寒潮预警：气温极低，注意防寒保暖！',
    };
  }
  
  // 暴雪预警
  if (current.weather_code >= 73 && current.weather_code <= 75) {
    return {
      type: 'orange',
      message: '⚠️ 暴雪预警：雪量较大，路面湿滑，注意出行安全！',
    };
  }
  
  // 雷暴预警
  if (current.weather_code >= 95) {
    return {
      type: 'red',
      message: '🚨 雷暴预警：正在发生雷暴天气，请留在室内！',
    };
  }
  
  return null;
}
