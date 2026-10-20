import React, { useState, useMemo, useRef, useEffect } from "react";
import { NewsItem } from "../types/news";
import {
  CloudSun,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSnow,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  AlertTriangle,
  Search,
  MapPin,
  Globe,
  ChevronRight,
  ShieldAlert,
  Info,
  Calendar,
  Clock,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import {
  DEMO_WEATHER_NOTICE,
  WORLD_CITIES,
  CityLocation,
  CityWeatherData,
  generateCityWeather,
  createDynamicCity,
  WEATHER_CONDITIONS,
  WeatherConditionKey,
} from "../data/weatherData";

interface ClimaPageProps {
  articles?: NewsItem[];
  onOpenArticleDetails?: (article: NewsItem) => void;
}

export const ClimaPage: React.FC<ClimaPageProps> = ({
  articles = [],
  onOpenArticleDetails,
}) => {
  // Cidade selecionada (inicia com Brasília por ser a capital federal do portal Sociedade Ativa)
  const [selectedCity, setSelectedCity] = useState<CityLocation>(
    () => WORLD_CITIES.find((c) => c.id === "brasilia-df-br") || WORLD_CITIES[0]
  );

  // Escala de temperatura (°C ou °F)
  const [unit, setUnit] = useState<"C" | "F">("C");

  // Campo de busca e estado do dropdown
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Tab de visualização de previsão
  const [forecastTab, setForecastTab] = useState<"7dias" | "horaria">("7dias");

  // Dados climáticos simulados da cidade selecionada
  const weatherData: CityWeatherData = useMemo(() => {
    return generateCityWeather(selectedCity);
  }, [selectedCity]);

  // Conversor de temperatura auxiliar
  const formatTemp = (tempC: number) => {
    if (unit === "F") {
      const f = Math.round((tempC * 9) / 5 + 32);
      return `${f}°F`;
    }
    return `${Math.round(tempC)}°C`;
  };

  const formatTempDecimal = (tempC: number) => {
    if (unit === "F") {
      const f = Math.round(((tempC * 9) / 5 + 32) * 10) / 10;
      return `${f}°F`;
    }
    return `${tempC}°C`;
  };

  // Cidades filtradas com desambiguação por estado/região e país
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return WORLD_CITIES.slice(0, 10);

    return WORLD_CITIES.filter((city) => {
      const matchName = city.name.toLowerCase().includes(q);
      const matchRegion = city.stateOrRegion.toLowerCase().includes(q);
      const matchCountry = city.country.toLowerCase().includes(q);
      const matchCode = city.countryCode.toLowerCase().includes(q);
      const matchDisambiguation = city.disambiguation?.toLowerCase().includes(q);
      return matchName || matchRegion || matchCountry || matchCode || matchDisambiguation;
    }).slice(0, 12);
  }, [searchQuery]);

  // Fecha o dropdown de busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Seleciona cidade da lista
  const handleSelectCity = (city: CityLocation) => {
    setSelectedCity(city);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  // Submete busca livre (permite qualquer cidade do mundo mesmo fora da lista inicial)
  const handleCustomCitySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;

    // Se houver uma correspondência exata ou primeira, usa
    const exact = WORLD_CITIES.find(
      (c) => c.name.toLowerCase() === clean.toLowerCase()
    );
    if (exact) {
      handleSelectCity(exact);
      return;
    }

    if (filteredCities.length > 0) {
      handleSelectCity(filteredCities[0]);
      return;
    }

    // Se for uma cidade desconhecida do mundo, gera dinamicamente com suporte a desambiguação
    const dynamicCity = createDynamicCity(clean);
    setSelectedCity(dynamicCity);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  // Notícias relacionadas a clima, meio ambiente, chuvas e alertas do dataset real
  const climateNews = useMemo(() => {
    return articles
      .filter((a) => {
        const text = `${a.title} ${a.summary} ${a.tags?.join(" ")}`.toLowerCase();
        return (
          text.includes("clima") ||
          text.includes("chuva") ||
          text.includes("temporal") ||
          text.includes("seca") ||
          text.includes("meio ambiente") ||
          text.includes("inmet") ||
          text.includes("defesa civil") ||
          text.includes("calor") ||
          text.includes("temperatura") ||
          text.includes("água") ||
          text.includes("ibama") ||
          text.includes("queimada") ||
          text.includes("energia")
        );
      })
      .slice(0, 4);
  }, [articles]);

  // Ícone dinâmico do clima
  const renderWeatherIcon = (condition: WeatherConditionKey, className = "w-8 h-8") => {
    switch (condition) {
      case "ensolarado":
        return <Sun className={`${className} text-amber-500`} />;
      case "parcialmente_nublado":
        return <CloudSun className={`${className} text-sky-500`} />;
      case "nublado":
        return <Cloud className={`${className} text-slate-500`} />;
      case "chuva_leve":
        return <CloudDrizzle className={`${className} text-blue-400`} />;
      case "chuva_moderada":
      case "chuva_forte":
        return <CloudRain className={`${className} text-blue-600`} />;
      case "tempestade":
        return <CloudLightning className={`${className} text-purple-600`} />;
      case "neblina":
        return <CloudFog className={`${className} text-slate-400`} />;
      case "neve":
        return <CloudSnow className={`${className} text-cyan-500`} />;
      case "ventania":
        return <Wind className={`${className} text-teal-600`} />;
      default:
        return <CloudSun className={`${className} text-sky-500`} />;
    }
  };

  // Cidades em destaque rápido (Brasil e Mundo)
  const quickPills: { label: string; cityId: string }[] = [
    { label: "Brasília (DF)", cityId: "brasilia-df-br" },
    { label: "São Paulo (SP)", cityId: "sao-paulo-sp-br" },
    { label: "Rio de Janeiro (RJ)", cityId: "rio-de-janeiro-rj-br" },
    { label: "Salvador (BA)", cityId: "salvador-ba-br" },
    { label: "Curitiba (PR)", cityId: "curitiba-pr-br" },
    { label: "Manaus (AM)", cityId: "manaus-am-br" },
    { label: "Porto Alegre (RS)", cityId: "porto-alegre-rs-br" },
    { label: "Lisboa (PT)", cityId: "lisboa-pt" },
    { label: "Nova York (US)", cityId: "nova-york-us" },
    { label: "Buenos Aires (AR)", cityId: "buenos-aires-ar" },
    { label: "Paris (FR)", cityId: "paris-fr" },
    { label: "Tóquio (JP)", cityId: "toquio-jp" },
  ];

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Alerta Obrigatório e Proeminente de Demonstração / Dados Fictícios */}
        <div className="mb-8 rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-200/90 rounded-xl text-amber-950 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-900" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-600 text-white tracking-wide uppercase shadow-2xs">
                  {DEMO_WEATHER_NOTICE}
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Estrutura Visual &amp; Protótipo de Monitoramento Climático
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-950/95 leading-relaxed">
                Esta seção é um ambiente demonstrativo da nova editoria de meteorologia e previsão do tempo do portal <strong>Sociedade Ativa</strong>.
                Todas as <strong>temperaturas atuais, sensações térmicas, índices de umidade, velocidade dos ventos, previsões estendidas e alertas meteorológicos</strong> exibidos são <strong>DADOS FICTÍCIOS E SIMULADOS</strong> para validação de layout. <strong>NUNCA</strong> utilize estes dados para decisões de segurança civil, navegação marítima, operações aéreas ou atividades sujeitas a intempéries.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Cabeçalho Editorial da Seção de Clima */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-800 mb-2">
                <CloudSun className="w-4 h-4 text-sky-600" />
                <span>Caderno de Clima &amp; Meteorologia · Sociedade Ativa</span>
                <span className="text-slate-400">·</span>
                <span className="text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-[11px] font-bold">
                  {DEMO_WEATHER_NOTICE}
                </span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
                Previsão do Tempo e Monitoramento Climático
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
                Acompanhe condições atuais, sensação térmica, umidade, velocidade dos ventos, previsão detalhada para 7 dias e quadro de alertas meteorológicos oficiais para cidades do Brasil e do mundo com desambiguação regional.
              </p>
            </div>

            {/* Seletor de Escala Térmica (°C / °F) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl shrink-0 self-start md:self-end">
              <button
                type="button"
                onClick={() => setUnit("C")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  unit === "C"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Exibir temperaturas em graus Celsius"
              >
                °C (Celsius)
              </button>
              <button
                type="button"
                onClick={() => setUnit("F")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  unit === "F"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Exibir temperaturas em graus Fahrenheit"
              >
                °F (Fahrenheit)
              </button>
            </div>
          </div>
        </div>

        {/* 3. Barra de Busca Mundial com Desambiguação por Estado/Região e País */}
        <div className="mb-8" ref={searchContainerRef}>
          <div className="relative">
            <form onSubmit={handleCustomCitySubmit} className="relative">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Pesquise qualquer cidade do Brasil ou do mundo (ex: São Paulo, Paris, Santiago, Curitiba, Nova York, Roma...)"
                  className="w-full pl-11 pr-24 py-3.5 bg-white border border-slate-300 rounded-2xl shadow-xs text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all font-medium"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Limpar campo de pesquisa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </form>

            {/* Dropdown de Desambiguação e Sugestões Globais */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto">
                <div className="p-3 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-600" />
                    Cidades encontradas com desambiguação geográfica
                  </span>
                  <span className="text-[11px] text-amber-700 font-bold">
                    {DEMO_WEATHER_NOTICE}
                  </span>
                </div>

                {filteredCities.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {filteredCities.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCity(c)}
                        className={`w-full text-left px-4 py-3 hover:bg-sky-50/60 transition-colors flex items-center justify-between group cursor-pointer ${
                          selectedCity.id === c.id ? "bg-sky-50" : ""
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-slate-900 group-hover:text-sky-900 text-sm">
                              {c.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold">
                              {c.countryCode}
                            </span>
                            {c.regionType === "capital_brasil" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                Capital BR
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            <span className="font-medium text-slate-700">{c.stateOrRegion}</span> · {c.country}
                            {c.disambiguation && (
                              <span className="text-sky-700 font-semibold ml-1.5">
                                ({c.disambiguation})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                            {formatTemp(c.baseTemp)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm font-bold text-slate-800">
                      Nenhuma cidade pré-cadastrada com o termo "{searchQuery}".
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Deseja simular a previsão para <strong>"{searchQuery}"</strong> como uma nova localidade global?
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCustomCitySubmit()}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Simular Clima para "{searchQuery}"</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Atalhos Rápidos por Cidades e Capitais */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs font-bold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              Acesso Rápido:
            </span>
            {quickPills.map((p) => {
              const cityObj = WORLD_CITIES.find((c) => c.id === p.cityId);
              const isCurrent = selectedCity.id === p.cityId;
              return (
                <button
                  key={p.cityId}
                  type="button"
                  onClick={() => cityObj && handleSelectCity(cityObj)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Cartão Principal: Condições Atuais da Localidade Selecionada */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Faixa Superior de Localização e Desambiguação */}
          <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-sky-600/30 border border-sky-400/40 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg sm:text-2xl font-black tracking-tight truncate">
                    {selectedCity.name}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700 font-mono font-bold">
                    {selectedCity.countryCode}
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  <span className="font-semibold text-white">{selectedCity.stateOrRegion}</span> · {selectedCity.country}
                  {selectedCity.disambiguation && (
                    <span className="text-sky-300 ml-1">
                      — {selectedCity.disambiguation}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5" />
                {DEMO_WEATHER_NOTICE}
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                {weatherData.current.updatedAt}
              </span>
            </div>
          </div>

          {/* Destaque Central de Temperatura e Condição */}
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Bloco 1: Temperatura Principal e Sensação */}
              <div className="lg:col-span-5 flex items-center gap-6">
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 shrink-0 shadow-2xs">
                  {renderWeatherIcon(weatherData.current.condition, "w-16 h-16 sm:w-20 sm:h-20")}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-5xl sm:text-6xl font-black text-slate-950 tracking-tighter">
                      {formatTemp(weatherData.current.tempC)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {unit === "C" ? "Celsius" : "Fahrenheit"}
                    </span>
                  </div>
                  <div className="mt-1">
                    <p className="text-base sm:text-lg font-bold text-slate-800">
                      {weatherData.current.conditionLabel}
                    </p>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 mt-0.5">
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                        Sensação: {formatTempDecimal(weatherData.current.feelsLikeC)}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>
                        Mín {formatTemp(weatherData.current.tempMinC)} / Máx {formatTemp(weatherData.current.tempMaxC)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Métricas Essenciais (Umidade, Vento, UV e Qualidade do Ar) */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Umidade */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span>Umidade</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                    {weatherData.current.humidityPercent}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {weatherData.current.humidityPercent > 60
                      ? "Nível elevado"
                      : weatherData.current.humidityPercent < 30
                      ? "Alerta de ar seco"
                      : "Faixa confortável"}
                  </p>
                </div>

                {/* Vento */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <Wind className="w-4 h-4 text-teal-600" />
                    <span>Vento</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                    {weatherData.current.windSpeedKmH} <span className="text-xs font-sans font-bold">km/h</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={`Direção ${weatherData.current.windDirection} · Rajadas até ${weatherData.current.windGustKmH} km/h`}>
                    Dir. <strong>{weatherData.current.windDirection}</strong> · Rajada {weatherData.current.windGustKmH}k
                  </p>
                </div>

                {/* Índice UV */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Índice UV</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                    {weatherData.current.uvIndex} <span className="text-xs font-sans font-bold">/11</span>
                  </div>
                  <p className="text-[11px] text-amber-700 font-bold mt-0.5">
                    {weatherData.current.uvLevel}
                  </p>
                </div>

                {/* Qualidade do Ar */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <Gauge className="w-4 h-4 text-emerald-600" />
                    <span>Qualidade Ar</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                    {weatherData.current.airQualityIndex} <span className="text-xs font-sans font-bold">AQI</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                    {weatherData.current.airQualityLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Barra Inferior com Indicadores Complementares */}
          <div className="px-6 py-4 bg-slate-50/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pressão</span>
                <span className="font-mono font-bold text-slate-800">{weatherData.current.pressureHpa} hPa</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Visibilidade</span>
                <span className="font-mono font-bold text-slate-800">{weatherData.current.visibilityKm} km</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Ponto de Orvalho</span>
                <span className="font-mono font-bold text-slate-800">{formatTemp(weatherData.current.dewPointC)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Sunrise className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sol (Nascer / Pôr)</span>
                <span className="font-mono font-bold text-slate-800">
                  {weatherData.current.sunriseTime} · {weatherData.current.sunsetTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Seção de Alertas Meteorológicos Oficiais (INMET / Defesa Civil / OMM) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950">
                Alertas Meteorológicos Oficiais
              </h2>
            </div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wide">
              {DEMO_WEATHER_NOTICE}
            </span>
          </div>

          {weatherData.alerts.length > 0 ? (
            <div className="space-y-4">
              {weatherData.alerts.map((alert) => {
                const isLaranja = alert.severity === "laranja";
                const isVermelho = alert.severity === "vermelho";
                const borderBadge = isVermelho
                  ? "border-red-500 bg-red-50 text-red-950"
                  : isLaranja
                  ? "border-orange-500 bg-orange-50 text-orange-950"
                  : "border-amber-400 bg-amber-50 text-amber-950";

                return (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border-2 p-5 sm:p-6 shadow-sm ${borderBadge}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-black/10">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider text-white ${
                              isVermelho
                                ? "bg-red-600"
                                : isLaranja
                                ? "bg-orange-600"
                                : "bg-amber-600"
                            }`}
                          >
                            {alert.severityLabel}
                          </span>
                          <span className="text-xs font-bold opacity-80">
                            {alert.issuingAgency}
                          </span>
                          <span className="text-[11px] font-black bg-black/10 px-2 py-0.5 rounded">
                            {DEMO_WEATHER_NOTICE}
                          </span>
                        </div>
                        <h3 className="font-heading text-base sm:text-lg font-black tracking-tight">
                          {alert.title}
                        </h3>
                      </div>

                      <div className="text-xs font-mono opacity-80 shrink-0">
                        Vigência: <strong>{alert.validUntil}</strong>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-semibold leading-relaxed mb-2">
                        {alert.headline}
                      </p>
                      <p className="text-xs sm:text-sm opacity-90 leading-relaxed mb-4">
                        {alert.description}
                      </p>

                      {/* Instruções de Segurança da Defesa Civil */}
                      <div className="bg-white/80 rounded-xl p-3.5 border border-black/10">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-600" />
                          Instruções Recomendadas pela Defesa Civil:
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                          {alert.safetyInstructions.map((instruction, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-heading text-base font-bold text-slate-900">
                Nenhum Alerta Meteorológico Crítico Ativo no Momento para {selectedCity.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
                As condições climáticas simuladas para esta localidade encontram-se dentro dos parâmetros normais de sazonalidade.
              </p>
              <div className="mt-3 inline-block">
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  {DEMO_WEATHER_NOTICE}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 6. Previsão para 7 Dias e Previsão Horária (Abas Interativas) */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950">
                  Previsão Estendida para {selectedCity.name}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Valores climáticos diários e horários simulados para acompanhamento e planejamento semanal.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                {DEMO_WEATHER_NOTICE}
              </span>
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setForecastTab("7dias")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    forecastTab === "7dias"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  7 Dias
                </button>
                <button
                  type="button"
                  onClick={() => setForecastTab("horaria")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    forecastTab === "horaria"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Próximas Horas
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo da Aba 7 Dias */}
          {forecastTab === "7dias" && (
            <div className="divide-y divide-slate-100">
              {weatherData.forecast7Days.map((day, idx) => (
                <div
                  key={idx}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  {/* Dia e Condição */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="p-2.5 rounded-2xl bg-slate-100 shrink-0">
                      {renderWeatherIcon(day.condition, "w-6 h-6")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-sm text-slate-900">
                          {day.dayOfWeek}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {day.dateStr}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600">
                        {day.conditionLabel}
                      </span>
                    </div>
                  </div>

                  {/* Probabilidade de Chuva */}
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <Droplets className={`w-4 h-4 ${day.rainProbability > 50 ? "text-blue-600" : "text-slate-400"}`} />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">{day.rainProbability}%</span>
                      {day.rainVolumeMm > 0 && (
                        <span className="text-slate-500 ml-1">({day.rainVolumeMm} mm)</span>
                      )}
                    </div>
                  </div>

                  {/* Vento e UV */}
                  <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-teal-600" />
                      {day.windSpeedKmH} km/h
                    </span>
                    <span className="flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      UV {day.uvIndex}
                    </span>
                  </div>

                  {/* Barra e Amplitude de Temperatura */}
                  <div className="flex items-center gap-3 justify-end min-w-[160px]">
                    <span className="text-xs font-mono font-semibold text-blue-600 w-12 text-right">
                      {formatTemp(day.tempMin)}
                    </span>
                    <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-200 overflow-hidden relative">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-rose-500"
                        style={{
                          marginLeft: `${Math.max(0, Math.min(60, (day.tempMin - 10) * 3))}%`,
                          width: `${Math.max(25, Math.min(80, (day.tempMax - day.tempMin) * 8))}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono font-black text-rose-600 w-12">
                      {formatTemp(day.tempMax)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Conteúdo da Aba Horária (24 Horas) */}
          {forecastTab === "horaria" && (
            <div className="p-6">
              <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-2 scrollbar-thin">
                {weatherData.hourly.map((hour, hIdx) => (
                  <div
                    key={hIdx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center min-w-[105px] shrink-0 hover:bg-sky-50/50 hover:border-sky-300 transition-all"
                  >
                    <span className="font-mono text-xs font-bold text-slate-500 block mb-2">
                      {hour.timeStr}
                    </span>
                    <div className="my-2 flex justify-center">
                      {renderWeatherIcon(hour.condition, "w-7 h-7")}
                    </div>
                    <span className="font-heading font-black text-base text-slate-900 block">
                      {formatTemp(hour.temp)}
                    </span>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-blue-600 mt-2 font-semibold">
                      <Droplets className="w-3 h-3" />
                      <span>{hour.rainProbability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 7. Quadro Regional: Panorama Meteorológico das Macro-Regiões do Brasil */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-slate-950">
                Panorama Meteorológico Regional do Brasil
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visão comparativa das cinco macro-regiões do território nacional.
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
              {DEMO_WEATHER_NOTICE}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                region: "Região Norte",
                capitalRef: "Manaus",
                temp: 32,
                condition: "chuva_forte" as WeatherConditionKey,
                summary: "Pancadas de chuva típicas de floresta, umidade alta (85%).",
              },
              {
                region: "Região Nordeste",
                capitalRef: "Salvador",
                temp: 28,
                condition: "ensolarado" as WeatherConditionKey,
                summary: "Predomínio de sol no litoral e ar seco no semiárido.",
              },
              {
                region: "Centro-Oeste",
                capitalRef: "Brasília",
                temp: 26,
                condition: "parcialmente_nublado" as WeatherConditionKey,
                summary: "Sol com nuvens e umidade moderada no Planalto Central.",
              },
              {
                region: "Região Sudeste",
                capitalRef: "São Paulo",
                temp: 24,
                condition: "nublado" as WeatherConditionKey,
                summary: "Variação térmica moderada e ventos marítimos no litoral.",
              },
              {
                region: "Região Sul",
                capitalRef: "Porto Alegre",
                temp: 21,
                condition: "chuva_leve" as WeatherConditionKey,
                summary: "Avanço de frente fria fraca e temperaturas amenas.",
              },
            ].map((reg, rIdx) => (
              <div
                key={rIdx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {reg.region}
                  </span>
                  {renderWeatherIcon(reg.condition, "w-5 h-5")}
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-heading text-2xl font-black text-slate-950">
                    {formatTemp(reg.temp)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Ref. {reg.capitalRef}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {reg.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 8. Notícias Editoriais Relacionadas a Clima & Meio Ambiente */}
        {climateNews.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                  Jornalismo de Dados · Sociedade Ativa
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950 mt-1">
                  Despachos Oficiais: Clima, Recursos Hídricos e Meio Ambiente
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Fontes Oficiais: EBC, Agência Câmara, IBGE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {climateNews.map((article) => (
                <div
                  key={article.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-sky-50/50 hover:border-sky-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                      <span className="font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                        {article.category}
                      </span>
                      <span>·</span>
                      <span className="font-mono">{article.publishedAt}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-600">{article.source}</span>
                    </div>
                    <h3 className="font-heading text-base font-bold text-slate-950 leading-snug hover:text-sky-800 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    {onOpenArticleDetails && (
                      <button
                        type="button"
                        onClick={() => onOpenArticleDetails(article)}
                        className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ler matéria completa</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <a
                      href={article.articleUrl || article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <span>Fonte original</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
