/**
 * Dataset e estruturas de apoio para a seção de Clima & Meteorologia do portal Sociedade Ativa.
 * 
 * ATENÇÃO EDITORIAL: Todos os valores, temperaturas, índices e alertas meteorológicos contidos
 * ou gerados por este módulo são estritamente para DEMONSTRAÇÃO E TESTE DE INTERFACE (DADOS FICTÍCIOS).
 */

export const DEMO_WEATHER_NOTICE = "DEMONSTRAÇÃO — DADOS FICTÍCIOS";

export type WeatherConditionKey =
  | "ensolarado"
  | "parcialmente_nublado"
  | "nublado"
  | "chuva_leve"
  | "chuva_moderada"
  | "chuva_forte"
  | "tempestade"
  | "neblina"
  | "neve"
  | "ventania";

export interface CityLocation {
  id: string;
  name: string;
  stateOrRegion: string;
  country: string;
  countryCode: string;
  regionType: "capital_brasil" | "interior_brasil" | "capital_mundial" | "metropole_mundial";
  latitude?: number;
  longitude?: number;
  disambiguation?: string;
  baseTemp: number; // Temperatura base de referência para simulação realista (°C)
  climateZone: "tropical" | "subtropical" | "semiarido" | "equatorial" | "temperado" | "mediterraneo" | "continental";
}

export interface WeatherConditionDetails {
  key: WeatherConditionKey;
  label: string;
  iconName: string;
  colorClass: string;
  bgGradient: string;
  badgeBg: string;
}

export interface DayForecast {
  dayOfWeek: string;
  dateStr: string;
  condition: WeatherConditionKey;
  conditionLabel: string;
  tempMin: number;
  tempMax: number;
  rainProbability: number; // em %
  rainVolumeMm: number; // em mm
  windSpeedKmH: number;
  uvIndex: number;
}

export interface HourlyForecast {
  timeStr: string;
  temp: number;
  condition: WeatherConditionKey;
  conditionLabel: string;
  rainProbability: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  severity: "amarelo" | "laranja" | "vermelho";
  severityLabel: "Perigo Potencial" | "Perigo" | "Grande Perigo";
  severityColor: string;
  issuingAgency: string;
  issuedAt: string;
  validUntil: string;
  affectedAreas: string[];
  headline: string;
  description: string;
  safetyInstructions: string[];
  isDemo: true;
}

export interface CityWeatherData {
  city: CityLocation;
  current: {
    tempC: number;
    feelsLikeC: number;
    tempMinC: number;
    tempMaxC: number;
    condition: WeatherConditionKey;
    conditionLabel: string;
    humidityPercent: number;
    windSpeedKmH: number;
    windDirection: string;
    windGustKmH: number;
    uvIndex: number;
    uvLevel: "Baixo" | "Moderado" | "Alto" | "Muito Alto" | "Extremo";
    airQualityIndex: number;
    airQualityLevel: "Excelente" | "Boa" | "Moderada" | "Ruim";
    pressureHpa: number;
    visibilityKm: number;
    dewPointC: number;
    sunriseTime: string;
    sunsetTime: string;
    updatedAt: string;
  };
  forecast7Days: DayForecast[];
  hourly: HourlyForecast[];
  alerts: WeatherAlert[];
}

// Dicionário de condições climáticas para renderização consistente
export const WEATHER_CONDITIONS: Record<WeatherConditionKey, WeatherConditionDetails> = {
  ensolarado: {
    key: "ensolarado",
    label: "Ensolarado e Céu Aberto",
    iconName: "Sun",
    colorClass: "text-amber-500",
    bgGradient: "from-amber-50 to-orange-50",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-200",
  },
  parcialmente_nublado: {
    key: "parcialmente_nublado",
    label: "Sol com Algumas Nuvens",
    iconName: "CloudSun",
    colorClass: "text-sky-500",
    bgGradient: "from-sky-50 to-slate-50",
    badgeBg: "bg-sky-100 text-sky-900 border-sky-200",
  },
  nublado: {
    key: "nublado",
    label: "Nublado",
    iconName: "Cloud",
    colorClass: "text-slate-500",
    bgGradient: "from-slate-100 to-slate-50",
    badgeBg: "bg-slate-200 text-slate-800 border-slate-300",
  },
  chuva_leve: {
    key: "chuva_leve",
    label: "Chuva Leve / Garoa",
    iconName: "CloudDrizzle",
    colorClass: "text-blue-400",
    bgGradient: "from-blue-50 to-slate-50",
    badgeBg: "bg-blue-100 text-blue-900 border-blue-200",
  },
  chuva_moderada: {
    key: "chuva_moderada",
    label: "Chuva Moderada",
    iconName: "CloudRain",
    colorClass: "text-blue-600",
    bgGradient: "from-blue-100 to-slate-100",
    badgeBg: "bg-blue-200 text-blue-950 border-blue-300",
  },
  chuva_forte: {
    key: "chuva_forte",
    label: "Chuva Forte Persistente",
    iconName: "CloudRain",
    colorClass: "text-indigo-600",
    bgGradient: "from-indigo-100 to-slate-200",
    badgeBg: "bg-indigo-100 text-indigo-950 border-indigo-300",
  },
  tempestade: {
    key: "tempestade",
    label: "Tempestade com Raios e Trovoadas",
    iconName: "CloudLightning",
    colorClass: "text-purple-600",
    bgGradient: "from-purple-100 to-slate-200",
    badgeBg: "bg-purple-100 text-purple-950 border-purple-300",
  },
  neblina: {
    key: "neblina",
    label: "Neblina / Nevoeiro",
    iconName: "CloudFog",
    colorClass: "text-slate-400",
    bgGradient: "from-slate-100 to-slate-200",
    badgeBg: "bg-slate-200 text-slate-800 border-slate-300",
  },
  neve: {
    key: "neve",
    label: "Precipitação de Neve",
    iconName: "CloudSnow",
    colorClass: "text-cyan-500",
    bgGradient: "from-cyan-50 to-slate-100",
    badgeBg: "bg-cyan-100 text-cyan-950 border-cyan-300",
  },
  ventania: {
    key: "ventania",
    label: "Ventos Fortes / Rajadas",
    iconName: "Wind",
    colorClass: "text-teal-600",
    bgGradient: "from-teal-50 to-slate-100",
    badgeBg: "bg-teal-100 text-teal-950 border-teal-300",
  },
};

// Ampla lista de cidades do Brasil e do mundo com disambiguação explícita
export const WORLD_CITIES: CityLocation[] = [
  // --- CAPITAIS DO BRASIL ---
  {
    id: "brasilia-df-br",
    name: "Brasília",
    stateOrRegion: "Distrito Federal (DF)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Distrito Federal, Brasil — Centro-Oeste",
    baseTemp: 26,
    climateZone: "tropical",
  },
  {
    id: "sao-paulo-sp-br",
    name: "São Paulo",
    stateOrRegion: "São Paulo (SP)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "São Paulo (SP), Brasil — Região Metropolitana",
    baseTemp: 24,
    climateZone: "subtropical",
  },
  {
    id: "rio-de-janeiro-rj-br",
    name: "Rio de Janeiro",
    stateOrRegion: "Rio de Janeiro (RJ)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Rio de Janeiro (RJ), Brasil — Região Metropolitana",
    baseTemp: 29,
    climateZone: "tropical",
  },
  {
    id: "belo-horizonte-mg-br",
    name: "Belo Horizonte",
    stateOrRegion: "Minas Gerais (MG)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Minas Gerais (MG), Brasil — Região Central",
    baseTemp: 25,
    climateZone: "tropical",
  },
  {
    id: "salvador-ba-br",
    name: "Salvador",
    stateOrRegion: "Bahia (BA)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Bahia (BA), Brasil — Litoral Nordestino",
    baseTemp: 28,
    climateZone: "tropical",
  },
  {
    id: "fortaleza-ce-br",
    name: "Fortaleza",
    stateOrRegion: "Ceará (CE)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Ceará (CE), Brasil — Litoral Norte",
    baseTemp: 30,
    climateZone: "tropical",
  },
  {
    id: "curitiba-pr-br",
    name: "Curitiba",
    stateOrRegion: "Paraná (PR)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Paraná (PR), Brasil — Primeiro Planalto",
    baseTemp: 19,
    climateZone: "subtropical",
  },
  {
    id: "porto-alegre-rs-br",
    name: "Porto Alegre",
    stateOrRegion: "Rio Grande do Sul (RS)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Rio Grande do Sul (RS), Brasil — Região Metropolitana",
    baseTemp: 22,
    climateZone: "subtropical",
  },
  {
    id: "recife-pe-br",
    name: "Recife",
    stateOrRegion: "Pernambuco (PE)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Pernambuco (PE), Brasil — Zona da Mata",
    baseTemp: 29,
    climateZone: "tropical",
  },
  {
    id: "manaus-am-br",
    name: "Manaus",
    stateOrRegion: "Amazonas (AM)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Amazonas (AM), Brasil — Bacia Amazônica",
    baseTemp: 32,
    climateZone: "equatorial",
  },
  {
    id: "belem-pa-br",
    name: "Belém",
    stateOrRegion: "Pará (PA)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Pará (PA), Brasil — Litoral Norte Amazônico",
    baseTemp: 31,
    climateZone: "equatorial",
  },
  {
    id: "goiania-go-br",
    name: "Goiânia",
    stateOrRegion: "Goiás (GO)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Goiás (GO), Brasil — Centro-Oeste",
    baseTemp: 28,
    climateZone: "tropical",
  },
  {
    id: "florianopolis-sc-br",
    name: "Florianópolis",
    stateOrRegion: "Santa Catarina (SC)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Santa Catarina (SC), Brasil — Litoral Sul",
    baseTemp: 21,
    climateZone: "subtropical",
  },
  {
    id: "vitoria-es-br",
    name: "Vitória",
    stateOrRegion: "Espírito Santo (ES)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Espírito Santo (ES), Brasil — Litoral Sudeste",
    baseTemp: 27,
    climateZone: "tropical",
  },
  {
    id: "cuiaba-mt-br",
    name: "Cuiabá",
    stateOrRegion: "Mato Grosso (MT)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Mato Grosso (MT), Brasil — Pantanal/Centro-Oeste",
    baseTemp: 34,
    climateZone: "tropical",
  },
  {
    id: "campo-grande-ms-br",
    name: "Campo Grande",
    stateOrRegion: "Mato Grosso do Sul (MS)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Mato Grosso do Sul (MS), Brasil — Centro-Oeste",
    baseTemp: 27,
    climateZone: "tropical",
  },
  {
    id: "natal-rn-br",
    name: "Natal",
    stateOrRegion: "Rio Grande do Norte (RN)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Rio Grande do Norte (RN), Brasil — Litoral Potiguar",
    baseTemp: 29,
    climateZone: "tropical",
  },
  {
    id: "joao-pessoa-pb-br",
    name: "João Pessoa",
    stateOrRegion: "Paraíba (PB)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Paraíba (PB), Brasil — Litoral Paraibano",
    baseTemp: 29,
    climateZone: "tropical",
  },
  {
    id: "maceio-al-br",
    name: "Maceió",
    stateOrRegion: "Alagoas (AL)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Alagoas (AL), Brasil — Litoral Alagoano",
    baseTemp: 28,
    climateZone: "tropical",
  },
  {
    id: "aracaju-se-br",
    name: "Aracaju",
    stateOrRegion: "Sergipe (SE)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Sergipe (SE), Brasil — Litoral Sergipano",
    baseTemp: 28,
    climateZone: "tropical",
  },
  {
    id: "teresina-pi-br",
    name: "Teresina",
    stateOrRegion: "Piauí (PI)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Piauí (PI), Brasil — Meio-Norte",
    baseTemp: 35,
    climateZone: "semiarido",
  },
  {
    id: "sao-luis-ma-br",
    name: "São Luís",
    stateOrRegion: "Maranhão (MA)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Maranhão (MA), Brasil — Ilha de Upaon-Açu",
    baseTemp: 30,
    climateZone: "tropical",
  },
  {
    id: "palmas-to-br",
    name: "Palmas",
    stateOrRegion: "Tocantins (TO)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Tocantins (TO), Brasil — Região Norte",
    baseTemp: 33,
    climateZone: "tropical",
  },
  {
    id: "porto-velho-ro-br",
    name: "Porto Velho",
    stateOrRegion: "Rondônia (RO)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Rondônia (RO), Brasil — Vale do Rio Madeira",
    baseTemp: 31,
    climateZone: "equatorial",
  },
  {
    id: "rio-branco-ac-br",
    name: "Rio Branco",
    stateOrRegion: "Acre (AC)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Acre (AC), Brasil — Vale do Rio Acre",
    baseTemp: 30,
    climateZone: "equatorial",
  },
  {
    id: "boa-vista-rr-br",
    name: "Boa Vista",
    stateOrRegion: "Roraima (RR)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Roraima (RR), Brasil — Extremo Norte",
    baseTemp: 32,
    climateZone: "equatorial",
  },
  {
    id: "macapa-ap-br",
    name: "Macapá",
    stateOrRegion: "Amapá (AP)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "capital_brasil",
    disambiguation: "Amapá (AP), Brasil — Linha do Equador",
    baseTemp: 31,
    climateZone: "equatorial",
  },

  // --- POLOS REGIONAIS E CASOS DE HOMÔNIMOS / DESAMBIGUAÇÃO NO BRASIL ---
  {
    id: "campinas-sp-br",
    name: "Campinas",
    stateOrRegion: "São Paulo (SP)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "interior_brasil",
    disambiguation: "São Paulo (SP), Brasil — Interior Paulista",
    baseTemp: 25,
    climateZone: "subtropical",
  },
  {
    id: "santos-sp-br",
    name: "Santos",
    stateOrRegion: "São Paulo (SP)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "interior_brasil",
    disambiguation: "São Paulo (SP), Brasil — Baixada Santista",
    baseTemp: 26,
    climateZone: "subtropical",
  },
  {
    id: "ribeirao-preto-sp-br",
    name: "Ribeirão Preto",
    stateOrRegion: "São Paulo (SP)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "interior_brasil",
    disambiguation: "São Paulo (SP), Brasil — Nordeste Paulista",
    baseTemp: 29,
    climateZone: "tropical",
  },
  {
    id: "uberlandia-mg-br",
    name: "Uberlândia",
    stateOrRegion: "Minas Gerais (MG)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "interior_brasil",
    disambiguation: "Minas Gerais (MG), Brasil — Triângulo Mineiro",
    baseTemp: 27,
    climateZone: "tropical",
  },
  {
    id: "londrina-pr-br",
    name: "Londrina",
    stateOrRegion: "Paraná (PR)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "interior_brasil",
    disambiguation: "Paraná (PR), Brasil — Norte Paranaense",
    baseTemp: 24,
    climateZone: "subtropical",
  },
  {
    id: "joinville-sc-br",
    name: "Joinville",
    stateOrRegion: "Santa Catarina (SC)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "interior_brasil",
    disambiguation: "Santa Catarina (SC), Brasil — Norte Catarinense",
    baseTemp: 22,
    climateZone: "subtropical",
  },
  {
    id: "caxias-do-sul-rs-br",
    name: "Caxias do Sul",
    stateOrRegion: "Rio Grande do Sul (RS)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "interior_brasil",
    disambiguation: "Rio Grande do Sul (RS), Brasil — Serra Gaúcha",
    baseTemp: 18,
    climateZone: "subtropical",
  },
  {
    id: "santiago-rs-br",
    name: "Santiago",
    stateOrRegion: "Rio Grande do Sul (RS)",
    country: "Brasil",
    countryCode: "BR",
    regionType: "interior_brasil",
    disambiguation: "Rio Grande do Sul (RS), Brasil — Região Centro-Oeste Gaúcha",
    baseTemp: 20,
    climateZone: "subtropical",
  },
  {
    id: "cordoba-es",
    name: "Córdoba",
    stateOrRegion: "Andaluzia",
    country: "Espanha",
    countryCode: "ES",
    regionType: "metropole_mundial",
    disambiguation: "Andaluzia, Espanha — Península Ibérica",
    baseTemp: 23,
    climateZone: "mediterraneo",
  },
  {
    id: "cordoba-ar",
    name: "Córdoba",
    stateOrRegion: "Província de Córdoba",
    country: "Argentina",
    countryCode: "AR",
    regionType: "metropole_mundial",
    disambiguation: "Província de Córdoba, Argentina — Região Central",
    baseTemp: 21,
    climateZone: "subtropical",
  },
  {
    id: "santiago-cl",
    name: "Santiago",
    stateOrRegion: "Región Metropolitana",
    country: "Chile",
    countryCode: "CL",
    regionType: "capital_mundial",
    disambiguation: "Región Metropolitana, Chile — Vale Central dos Andes",
    baseTemp: 19,
    climateZone: "mediterraneo",
  },

  // --- CAPITAIS E METRÓPOLES MUNDIAIS ---
  {
    id: "buenos-aires-ar",
    name: "Buenos Aires",
    stateOrRegion: "Cidade Autônoma (CABA)",
    country: "Argentina",
    countryCode: "AR",
    regionType: "capital_mundial",
    disambiguation: "CABA, Argentina — Rio da Prata",
    baseTemp: 19,
    climateZone: "subtropical",
  },
  {
    id: "montevideu-uy",
    name: "Montevidéu",
    stateOrRegion: "Departamento de Montevidéu",
    country: "Uruguai",
    countryCode: "UY",
    regionType: "capital_mundial",
    disambiguation: "Montevidéu, Uruguai — Litoral do Prata",
    baseTemp: 18,
    climateZone: "subtropical",
  },
  {
    id: "lima-pe",
    name: "Lima",
    stateOrRegion: "Província de Lima",
    country: "Peru",
    countryCode: "PE",
    regionType: "capital_mundial",
    disambiguation: "Lima, Peru — Costa Central do Pacífico",
    baseTemp: 20,
    climateZone: "semiarido",
  },
  {
    id: "bogota-co",
    name: "Bogotá",
    stateOrRegion: "Cundinamarca",
    country: "Colômbia",
    countryCode: "CO",
    regionType: "capital_mundial",
    disambiguation: "Distrito Capital, Colômbia — Savana Andina",
    baseTemp: 15,
    climateZone: "subtropical",
  },
  {
    id: "cidade-do-mexico-mx",
    name: "Cidade do México",
    stateOrRegion: "CDMX",
    country: "México",
    countryCode: "MX",
    regionType: "capital_mundial",
    disambiguation: "CDMX, México — Planalto Central",
    baseTemp: 22,
    climateZone: "subtropical",
  },
  {
    id: "nova-york-us",
    name: "Nova York",
    stateOrRegion: "Nova York (NY)",
    country: "Estados Unidos",
    countryCode: "US",
    regionType: "metropole_mundial",
    disambiguation: "Nova York (NY), Estados Unidos — Costa Leste",
    baseTemp: 16,
    climateZone: "temperado",
  },
  {
    id: "washington-us",
    name: "Washington, D.C.",
    stateOrRegion: "Distrito de Colúmbia",
    country: "Estados Unidos",
    countryCode: "US",
    regionType: "capital_mundial",
    disambiguation: "Distrito de Colúmbia, Estados Unidos — Capital Federal",
    baseTemp: 17,
    climateZone: "temperado",
  },
  {
    id: "miami-us",
    name: "Miami",
    stateOrRegion: "Flórida (FL)",
    country: "Estados Unidos",
    countryCode: "US",
    regionType: "metropole_mundial",
    disambiguation: "Flórida (FL), Estados Unidos — Sul da Flórida",
    baseTemp: 28,
    climateZone: "tropical",
  },
  {
    id: "los-angeles-us",
    name: "Los Angeles",
    stateOrRegion: "Califórnia (CA)",
    country: "Estados Unidos",
    countryCode: "US",
    regionType: "metropole_mundial",
    disambiguation: "Califórnia (CA), Estados Unidos — Costa Oeste do Pacífico",
    baseTemp: 22,
    climateZone: "mediterraneo",
  },
  {
    id: "toronto-ca",
    name: "Toronto",
    stateOrRegion: "Ontário",
    country: "Canadá",
    countryCode: "CA",
    regionType: "metropole_mundial",
    disambiguation: "Ontário, Canadá — Lago Ontário",
    baseTemp: 12,
    climateZone: "continental",
  },
  {
    id: "lisboa-pt",
    name: "Lisboa",
    stateOrRegion: "Distrito de Lisboa",
    country: "Portugal",
    countryCode: "PT",
    regionType: "capital_mundial",
    disambiguation: "Estremadura, Portugal — Foz do Tejo",
    baseTemp: 22,
    climateZone: "mediterraneo",
  },
  {
    id: "porto-pt",
    name: "Porto",
    stateOrRegion: "Distrito do Porto",
    country: "Portugal",
    countryCode: "PT",
    regionType: "metropole_mundial",
    disambiguation: "Norte de Portugal, Portugal — Foz do Douro",
    baseTemp: 19,
    climateZone: "mediterraneo",
  },
  {
    id: "madri-es",
    name: "Madri",
    stateOrRegion: "Comunidade de Madri",
    country: "Espanha",
    countryCode: "ES",
    regionType: "capital_mundial",
    disambiguation: "Comunidade de Madri, Espanha — Meseta Central",
    baseTemp: 21,
    climateZone: "mediterraneo",
  },
  {
    id: "paris-fr",
    name: "Paris",
    stateOrRegion: "Île-de-France",
    country: "França",
    countryCode: "FR",
    regionType: "capital_mundial",
    disambiguation: "Île-de-France, França — Rio Sena",
    baseTemp: 17,
    climateZone: "temperado",
  },
  {
    id: "paris-tx-us",
    name: "Paris",
    stateOrRegion: "Texas (TX)",
    country: "Estados Unidos",
    countryCode: "US",
    regionType: "metropole_mundial",
    disambiguation: "Texas (TX), Estados Unidos — Condado de Lamar",
    baseTemp: 24,
    climateZone: "subtropical",
  },
  {
    id: "londres-uk",
    name: "Londres",
    stateOrRegion: "Grande Londres / Inglaterra",
    country: "Reino Unido",
    countryCode: "GB",
    regionType: "capital_mundial",
    disambiguation: "Inglaterra, Reino Unido — Rio Tâmisa",
    baseTemp: 15,
    climateZone: "temperado",
  },
  {
    id: "londres-on-ca",
    name: "London",
    stateOrRegion: "Ontário",
    country: "Canadá",
    countryCode: "CA",
    regionType: "metropole_mundial",
    disambiguation: "Ontário, Canadá — Rio Thames canadense",
    baseTemp: 11,
    climateZone: "continental",
  },
  {
    id: "roma-it",
    name: "Roma",
    stateOrRegion: "Lácio",
    country: "Itália",
    countryCode: "IT",
    regionType: "capital_mundial",
    disambiguation: "Lácio, Itália — Península Itálica",
    baseTemp: 22,
    climateZone: "mediterraneo",
  },
  {
    id: "berlim-de",
    name: "Berlim",
    stateOrRegion: "Berlim",
    country: "Alemanha",
    countryCode: "DE",
    regionType: "capital_mundial",
    disambiguation: "Berlim, Alemanha — Planície Germânica",
    baseTemp: 14,
    climateZone: "temperado",
  },
  {
    id: "toquio-jp",
    name: "Tóquio",
    stateOrRegion: "Kanto",
    country: "Japão",
    countryCode: "JP",
    regionType: "capital_mundial",
    disambiguation: "Kanto, Japão — Baía de Tóquio",
    baseTemp: 20,
    climateZone: "subtropical",
  },
  {
    id: "pequim-cn",
    name: "Pequim",
    stateOrRegion: "Pequim",
    country: "China",
    countryCode: "CN",
    regionType: "capital_mundial",
    disambiguation: "Pequim, China — Planície do Norte da China",
    baseTemp: 18,
    climateZone: "continental",
  },
  {
    id: "cairo-eg",
    name: "Cairo",
    stateOrRegion: "Província do Cairo",
    country: "Egito",
    countryCode: "EG",
    regionType: "capital_mundial",
    disambiguation: "Cairo, Egito — Vale do Rio Nilo",
    baseTemp: 29,
    climateZone: "semiarido",
  },
  {
    id: "joanesburgo-za",
    name: "Joanesburgo",
    stateOrRegion: "Gauteng",
    country: "África do Sul",
    countryCode: "ZA",
    regionType: "metropole_mundial",
    disambiguation: "Gauteng, África do Sul — Planalto de Highveld",
    baseTemp: 23,
    climateZone: "subtropical",
  },
  {
    id: "sydney-au",
    name: "Sydney",
    stateOrRegion: "Nova Gales do Sul",
    country: "Austrália",
    countryCode: "AU",
    regionType: "metropole_mundial",
    disambiguation: "Nova Gales do Sul, Austrália — Costa Leste",
    baseTemp: 22,
    climateZone: "subtropical",
  },
];

// Gerador determinístico de previsão e dados climáticos simulados por cidade
export function generateCityWeather(city: CityLocation): CityWeatherData {
  // Gera hash simples para determinar variações consistentes
  let hash = 0;
  for (let i = 0; i < city.id.length; i++) {
    hash = (hash << 5) - hash + city.id.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const baseTemp = city.baseTemp;
  const tempOffset = (posHash % 7) - 3;
  const currentTemp = Math.round((baseTemp + tempOffset) * 10) / 10;
  const feelsLikeOffset = (posHash % 3) - 1;
  const feelsLike = Math.round((currentTemp + feelsLikeOffset + (city.climateZone === "tropical" ? 2 : 0)) * 10) / 10;

  const minOffset = 4 + (posHash % 4);
  const maxOffset = 3 + ((posHash >> 2) % 4);
  const tempMin = Math.round((currentTemp - minOffset) * 10) / 10;
  const tempMax = Math.round((currentTemp + maxOffset) * 10) / 10;

  // Condição atual simulada com base na zona climática
  const conditionsPool: WeatherConditionKey[] =
    city.climateZone === "tropical" || city.climateZone === "equatorial"
      ? ["ensolarado", "parcialmente_nublado", "chuva_moderada", "tempestade", "chuva_leve"]
      : city.climateZone === "semiarido"
      ? ["ensolarado", "ensolarado", "parcialmente_nublado", "ventania"]
      : city.climateZone === "subtropical"
      ? ["parcialmente_nublado", "ensolarado", "nublado", "chuva_leve", "neblina"]
      : ["nublado", "chuva_leve", "parcialmente_nublado", "ensolarado", "ventania"];

  const currentConditionKey = conditionsPool[posHash % conditionsPool.length];
  const conditionDetails = WEATHER_CONDITIONS[currentConditionKey];

  const humidity =
    city.climateZone === "equatorial"
      ? 75 + (posHash % 20)
      : city.climateZone === "semiarido"
      ? 30 + (posHash % 25)
      : 55 + (posHash % 30);

  const windSpeed = 10 + (posHash % 22);
  const windDirections = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  const windDir = windDirections[posHash % windDirections.length];
  const windGust = windSpeed + 8 + (posHash % 12);

  const uv =
    city.climateZone === "semiarido" || city.climateZone === "tropical"
      ? 7 + (posHash % 4)
      : 4 + (posHash % 5);
  const uvLevel =
    uv <= 2 ? "Baixo" : uv <= 5 ? "Moderado" : uv <= 7 ? "Alto" : uv <= 10 ? "Muito Alto" : "Extremo";

  const aqi = 25 + (posHash % 55);
  const aqiLevel =
    aqi <= 30 ? "Excelente" : aqi <= 50 ? "Boa" : aqi <= 80 ? "Moderada" : "Ruim";

  const pressure = 1010 + (posHash % 14);
  const visibility = currentConditionKey === "neblina" ? 3.5 : 10;
  const dewPoint = Math.round((currentTemp - ((100 - humidity) / 5)) * 10) / 10;

  // 7 dias de previsão
  const daysOfWeek = ["Hoje", "Amanhã", "Quinta", "Sexta", "Sábado", "Domingo", "Segunda", "Terça", "Quarta"];
  const dates = ["15/10", "16/10", "17/10", "18/10", "19/10", "20/10", "21/10"];

  const forecast7Days: DayForecast[] = [];
  for (let d = 0; d < 7; d++) {
    const daySeed = (posHash + d * 13) % conditionsPool.length;
    const condKey = conditionsPool[daySeed];
    const dMin = Math.round((tempMin + ((d * 3) % 4) - 1) * 10) / 10;
    const dMax = Math.round((tempMax + ((d * 5) % 5) - 2) * 10) / 10;
    const rainProb =
      condKey === "tempestade"
        ? 85 + (d * 2) % 15
        : condKey === "chuva_forte" || condKey === "chuva_moderada"
        ? 70 + (d * 3) % 25
        : condKey === "chuva_leve"
        ? 40 + (d * 5) % 25
        : 10 + (d * 7) % 20;
    const rainMm =
      rainProb > 60 ? Math.round((5 + (d * 4) % 25) * 10) / 10 : 0;

    forecast7Days.push({
      dayOfWeek: daysOfWeek[d],
      dateStr: dates[d],
      condition: condKey,
      conditionLabel: WEATHER_CONDITIONS[condKey].label,
      tempMin: dMin,
      tempMax: Math.max(dMin + 3, dMax),
      rainProbability: rainProb,
      rainVolumeMm: rainMm,
      windSpeedKmH: windSpeed + ((d * 3) % 7) - 2,
      uvIndex: Math.max(2, uv + (d % 3) - 1),
    });
  }

  // Previsão horária (próximas 8 janelas de 3 horas)
  const hourly: HourlyForecast[] = [];
  const hours = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "00:00", "03:00"];
  for (let h = 0; h < hours.length; h++) {
    const hOffset = Math.sin((h / 8) * Math.PI * 2) * 4;
    const hTemp = Math.round((currentTemp + hOffset) * 10) / 10;
    const hSeed = (posHash + h * 7) % conditionsPool.length;
    const hCond = conditionsPool[hSeed];
    hourly.push({
      timeStr: hours[h],
      temp: hTemp,
      condition: hCond,
      conditionLabel: WEATHER_CONDITIONS[hCond].label,
      rainProbability: (hCond.includes("chuva") || hCond === "tempestade") ? 65 + (h * 4) % 30 : 10 + (h * 3) % 15,
    });
  }

  // Alertas Meteorológicos Oficiais (simulados e explicitamente rotulados)
  const alerts: WeatherAlert[] = [];

  // Se for cidade brasileira, simula avisos com base no INMET / Defesa Civil
  if (city.countryCode === "BR") {
    if (posHash % 3 === 0) {
      alerts.push({
        id: `alert-inmet-${city.id}-1`,
        title: "Aviso de Tempestades e Chuvas Intensas",
        severity: "amarelo",
        severityLabel: "Perigo Potencial",
        severityColor: "border-amber-400 bg-amber-50 text-amber-950",
        issuingAgency: "INMET — Instituto Nacional de Meteorologia / Defesa Civil",
        issuedAt: "15/10/2026 às 04:00",
        validUntil: "16/10/2026 às 12:00",
        affectedAreas: [city.name, city.stateOrRegion, "Municípios limítrofes"],
        headline: `Precipitação entre 20 e 30 mm/h ou até 50 mm/dia, ventos intensos (40-60 km/h) previstos na região de ${city.name}.`,
        description: `Ambiente propício à formação de núcleos convectivos isolados durante a tarde e noite. Risco baixo de corte de energia elétrica, queda de galhos de árvores, alagamentos pontuais e de descargas elétricas.`,
        safetyInstructions: [
          "Não se abrigue debaixo de árvores em caso de rajadas de vento.",
          "Não estacione veículos próximos a torres de transmissão e placas de propaganda.",
          "Evite usar aparelhos eletrônicos ligados à tomada durante tempestades.",
          "Em caso de emergência, acione a Defesa Civil (telefone 199) ou o Corpo de Bombeiros (193).",
        ],
        isDemo: true,
      });
    } else if (posHash % 4 === 1 && (city.climateZone === "semiarido" || city.climateZone === "tropical")) {
      alerts.push({
        id: `alert-inmet-${city.id}-2`,
        title: "Aviso de Baixa Umidade Relativa do Ar",
        severity: "amarelo",
        severityLabel: "Perigo Potencial",
        severityColor: "border-amber-400 bg-amber-50 text-amber-950",
        issuingAgency: "INMET — Instituto Nacional de Meteorologia / Ministério da Saúde",
        issuedAt: "15/10/2026 às 08:00",
        validUntil: "15/10/2026 às 19:00",
        affectedAreas: [city.name, city.stateOrRegion],
        headline: `Umidade relativa do ar variando entre 20% e 30% nas horas mais quentes do dia.`,
        description: `Condições atmosféricas estáveis com poucas nuvens reduzem os índices de umidade na área central de ${city.name}. Risco leve à saúde e desconforto respiratório.`,
        safetyInstructions: [
          "Beba bastante líquido e mantenha a hidratação constante.",
          "Evite desgaste físico e atividades expostas ao sol nas horas mais secas (11h às 16h).",
          "Umidifique ambientes fechados com recipientes de água ou toalhas úmidas.",
          "Use protetor solar e mantenha a pele hidratada.",
        ],
        isDemo: true,
      });
    } else if (posHash % 5 === 0 && (city.climateZone === "subtropical")) {
      alerts.push({
        id: `alert-inmet-${city.id}-3`,
        title: "Aviso de Declínio Acentuado de Temperatura",
        severity: "laranja",
        severityLabel: "Perigo",
        severityColor: "border-orange-500 bg-orange-50 text-orange-950",
        issuingAgency: "INMET — Instituto Nacional de Meteorologia / Defesa Civil Estadual",
        issuedAt: "15/10/2026 às 06:00",
        validUntil: "17/10/2026 às 18:00",
        affectedAreas: [city.name, city.stateOrRegion, "Região Sul/Sudeste"],
        headline: `Queda brusca de temperatura superior a 5°C em relação à média sazonal com avanço de frente fria.`,
        description: `Massa de ar polar atinge a região de ${city.name}, com vento sul persistente e risco de geada em pontos elevados das serras.`,
        safetyInstructions: [
          "Atenção especial a idosos, crianças e pessoas em situação de vulnerabilidade térmica.",
          "Mantenha agasalhos adequados e abrigue animais domésticos durante a noite.",
          "Produtores rurais devem acompanhar boletins agrometeorológicos para proteção de culturas sensíveis.",
        ],
        isDemo: true,
      });
    }
  } else {
    // Alertas internacionais simulados
    if (posHash % 2 === 0) {
      alerts.push({
        id: `alert-intl-${city.id}`,
        title: `Aviso Meteorológico Regional — ${city.name} (${city.country})`,
        severity: "amarelo",
        severityLabel: "Perigo Potencial",
        severityColor: "border-amber-400 bg-amber-50 text-amber-950",
        issuingAgency: `Serviço Meteorológico Nacional (${city.country}) / OMM`,
        issuedAt: "15/10/2026 às 07:00 (UTC)",
        validUntil: "16/10/2026 às 20:00 (UTC)",
        affectedAreas: [city.name, city.stateOrRegion],
        headline: `Variação acentuada de pressão barométrica e ventos moderados a fortes na região de ${city.name}.`,
        description: `Sistema frontal atuando sobre o quadrante regional com possibilidade de pancadas intermitentes e rajadas convectivas.`,
        safetyInstructions: [
          "Verifique informes meteorológicos locais antes de viagens interurbanas.",
          "Mantenha-se atento a avisos da Defesa Civil e autoridades metropolitanas.",
        ],
        isDemo: true,
      });
    }
  }

  return {
    city,
    current: {
      tempC: currentTemp,
      feelsLikeC: feelsLike,
      tempMinC: tempMin,
      tempMaxC: tempMax,
      condition: currentConditionKey,
      conditionLabel: conditionDetails.label,
      humidityPercent: humidity,
      windSpeedKmH: windSpeed,
      windDirection: windDir,
      windGustKmH: windGust,
      uvIndex: uv,
      uvLevel,
      airQualityIndex: aqi,
      airQualityLevel: aqiLevel,
      pressureHpa: pressure,
      visibilityKm: visibility,
      dewPointC: dewPoint,
      sunriseTime: "05:46",
      sunsetTime: "18:18",
      updatedAt: "15/10/2026 às 08:30 (Horário de Brasília)",
    },
    forecast7Days,
    hourly,
    alerts,
  };
}

// Cria cidade dinâmica para qualquer busca livre mundial
export function createDynamicCity(cityName: string, disambiguationHint?: string): CityLocation {
  const cleanName = cityName.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: `custom-${slug}`,
    name: cleanName,
    stateOrRegion: disambiguationHint || "Região Metropolitana",
    country: "Busca Global",
    countryCode: "GL",
    regionType: "metropole_mundial",
    disambiguation: disambiguationHint
      ? `${cleanName} (${disambiguationHint})`
      : `${cleanName} — Localidade global simulada`,
    baseTemp: 22,
    climateZone: "temperado",
  };
}
