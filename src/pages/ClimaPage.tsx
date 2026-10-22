import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  RefreshCw,
  Radio,
} from "lucide-react";
import {
  WORLD_CITIES,
  CityLocation,
  CityWeatherData,
  WeatherConditionKey,
  LIVE_WEATHER_SOURCE,
  MacroRegionItem,
  fetchRealCityWeather,
  searchOpenMeteoCities,
  fetchMacroRegionsPanorama,
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

  // Escala de temperatura (°C ou °F) - Padrão métrico (°C)
  const [unit, setUnit] = useState<"C" | "F">("C");

  // Estado dos dados climáticos da cidade selecionada
  const [weatherData, setWeatherData] = useState<CityWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Campo de busca e dropdown com geocodificação
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchingGeocoding, setIsSearchingGeocoding] = useState(false);
  const [geocodedSuggestions, setGeocodedSuggestions] = useState<CityLocation[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Tab de visualização de previsão (7 Dias ou Próximas Horas)
  const [forecastTab, setForecastTab] = useState<"7dias" | "horaria">("7dias");

  // Macro-regiões do Brasil com dados meteorológicos em tempo real
  const [macroRegions, setMacroRegions] = useState<MacroRegionItem[]>([]);
  const [isMacroLoading, setIsMacroLoading] = useState<boolean>(true);

  // Cache em memória com TTL de 5 minutos para evitar requisições redundantes
  const weatherCacheRef = useRef<Map<string, { data: CityWeatherData; timestamp: number }>>(
    new Map()
  );

  // Identificador sequencial da requisição ativa para evitar race conditions
  const activeRequestIdRef = useRef<number>(0);
  const searchRequestIdRef = useRef<number>(0);

  // Conversor de temperatura auxiliar
  const formatTemp = (tempC?: number) => {
    if (typeof tempC !== "number" || isNaN(tempC)) return "--";
    if (unit === "F") {
      const f = Math.round((tempC * 9) / 5 + 32);
      return `${f}°F`;
    }
    return `${Math.round(tempC)}°C`;
  };

  const formatTempDecimal = (tempC?: number) => {
    if (typeof tempC !== "number" || isNaN(tempC)) return "--";
    if (unit === "F") {
      const f = Math.round(((tempC * 9) / 5 + 32) * 10) / 10;
      return `${f}°F`;
    }
    return `${tempC}°C`;
  };

  // Carrega dados meteorológicos em tempo real da cidade
  const loadWeatherData = useCallback(
    async (city: CityLocation, forceRefresh = false) => {
      const requestId = ++activeRequestIdRef.current;
      const cacheKey = `${city.countryCode}-${city.name.toLowerCase()}`;
      const now = Date.now();
      const cached = weatherCacheRef.current.get(cacheKey);

      // Reutiliza cache recente (5 min) se não for refresh forçado
      if (!forceRefresh && cached && now - cached.timestamp < 5 * 60 * 1000) {
        setWeatherData(cached.data);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchRealCityWeather(city);

        // Se uma busca mais recente tiver sido disparada, ignora resposta obsoleta
        if (requestId !== activeRequestIdRef.current) return;

        // Atualiza cache
        weatherCacheRef.current.set(cacheKey, { data, timestamp: now });

        setWeatherData(data);
        setError(null);
      } catch (err: any) {
        if (requestId !== activeRequestIdRef.current) return;

        // Se já existirem dados prévios para esta cidade, preserva rotulando como desatualizado
        if (cached) {
          const staleData: CityWeatherData = {
            ...cached.data,
            isStale: true,
            staleMessage: `Não foi possível obter dados recentes da API (${err.message || "Erro de rede"}). Exibindo última leitura registrada às ${cached.data.current.updatedAt}.`,
          };
          setWeatherData(staleData);
          setError(null);
        } else {
          // NUNCA substituir silenciosamente por dados simulados fictícios
          setWeatherData(null);
          setError(
            err.message ||
              "Não foi possível obter dados meteorológicos em tempo real. Verifique sua conexão e tente novamente."
          );
        }
      } finally {
        if (requestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  // Carrega previsão da cidade selecionada
  useEffect(() => {
    loadWeatherData(selectedCity, false);
  }, [selectedCity, loadWeatherData]);

  // Carrega panorama das Macro-Regiões do Brasil
  const loadMacro = useCallback(async () => {
    setIsMacroLoading(true);
    try {
      const items = await fetchMacroRegionsPanorama();
      setMacroRegions(items);
    } catch {
      setMacroRegions([]);
    } finally {
      setIsMacroLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMacro();
  }, [loadMacro]);

  // Busca de cidades com debounce e resolução de duplicatas via Open-Meteo Geocoding
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setGeocodedSuggestions([]);
      setIsSearchingGeocoding(false);
      return;
    }

    const searchId = ++searchRequestIdRef.current;
    setIsSearchingGeocoding(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchOpenMeteoCities(q);
        if (searchId === searchRequestIdRef.current) {
          setGeocodedSuggestions(results);
        }
      } catch {
        if (searchId === searchRequestIdRef.current) {
          setGeocodedSuggestions([]);
        }
      } finally {
        if (searchId === searchRequestIdRef.current) {
          setIsSearchingGeocoding(false);
        }
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cidades sugeridas no dropdown (combina prévias locais com resultados da geocodificação da API)
  const displaySuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return WORLD_CITIES.slice(0, 10);

    // Filtra lista prévia local
    const localMatches = WORLD_CITIES.filter((city) => {
      const matchName = city.name.toLowerCase().includes(q);
      const matchRegion = city.stateOrRegion.toLowerCase().includes(q);
      const matchCountry = city.country.toLowerCase().includes(q);
      const matchCode = city.countryCode.toLowerCase().includes(q);
      const matchDisambiguation = city.disambiguation?.toLowerCase().includes(q);
      return matchName || matchRegion || matchCountry || matchCode || matchDisambiguation;
    });

    // Mescla sugestões da API sem duplicar por nome e região/país
    const combined: CityLocation[] = [...localMatches];
    const seen = new Set(
      localMatches.map((c) => `${c.name.toLowerCase()}-${c.countryCode.toLowerCase()}`)
    );

    for (const g of geocodedSuggestions) {
      const key = `${g.name.toLowerCase()}-${g.countryCode.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(g);
      }
    }

    return combined.slice(0, 12);
  }, [searchQuery, geocodedSuggestions]);

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

  // Submete busca livre (seleciona a primeira correspondência ou pesquisa diretamente)
  const handleCustomCitySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;

    if (displaySuggestions.length > 0) {
      handleSelectCity(displaySuggestions[0]);
      return;
    }

    // Busca direta sob demanda via Geocoding se ainda não tiver sugestões
    setIsSearchingGeocoding(true);
    try {
      const results = await searchOpenMeteoCities(clean);
      if (results.length > 0) {
        handleSelectCity(results[0]);
      } else {
        setError(
          `Nenhuma localidade encontrada para "${clean}". Tente digitar o nome completo e o país (ex: "Curitiba, Brasil" ou "Paris, França").`
        );
      }
    } catch (err: any) {
      setError(`Erro na busca de localidade: ${err.message || "Falha de conexão"}`);
    } finally {
      setIsSearchingGeocoding(false);
      setIsSearchOpen(false);
    }
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
        
        {/* 1. Barra de Status de Dados em Tempo Real e Transparência Editorial */}
        <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-sky-600 text-white rounded-xl shrink-0 mt-0.5 shadow-2xs">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping" />
                    Dados em Tempo Real
                  </span>
                  <span className="text-xs font-bold text-sky-950">
                    Integração Oficial Open-Meteo
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-sky-950/90 leading-relaxed">
                  Monitoramento atmosférico contínuo provido pela <strong>API Open-Meteo</strong> com base em previsões numéricas globais abertas. Valores observados e projeções horárias e semanais.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => loadWeatherData(selectedCity, true)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-sky-300 hover:bg-sky-100/60 text-sky-950 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="Buscar dados mais recentes da API"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-700 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "Atualizando..." : "Atualizar"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerta de Dados em Cache (se última tentativa de rede falhou) */}
        {weatherData?.isStale && (
          <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-950">
                <strong className="font-bold">Aviso de Dados em Cache:</strong> {weatherData.staleMessage}
              </div>
            </div>
          </div>
        )}

        {/* 2. Cabeçalho Editorial da Seção de Clima */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-800 mb-2">
                <CloudSun className="w-4 h-4 text-sky-600" />
                <span>Caderno de Clima &amp; Meteorologia · Sociedade Ativa</span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded text-[11px] font-bold">
                  TEMPO REAL
                </span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 text-balance">
                Previsão do Tempo e Monitoramento Climático
              </h1>
              <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
                Acompanhe condições atuais, sensação térmica, umidade, velocidade dos ventos, previsão horária para 24h e estendida para 7 dias com dados em tempo real e desambiguação geográfica para cidades do Brasil e do mundo.
              </p>
            </div>

            {/* Seletor de Escala Térmica (°C / °F) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl shrink-0 self-start md:self-end">
              <button
                type="button"
                onClick={() => setUnit("C")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  unit === "C"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Exibir temperaturas em graus Celsius (Métrico)"
              >
                °C (Celsius)
              </button>
              <button
                type="button"
                onClick={() => setUnit("F")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                  aria-label="Pesquisar previsão do tempo por cidade ou região"
                  className="w-full pl-11 pr-24 py-3.5 bg-white border border-slate-300 rounded-2xl shadow-xs text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all font-medium"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setGeocodedSuggestions([]);
                      }}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Limpar campo de pesquisa"
                      aria-label="Limpar campo de pesquisa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="min-h-[36px] px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
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
                  <span className="text-[11px] text-sky-800 font-bold">
                    {isSearchingGeocoding ? "Buscando coordenadas..." : "Open-Meteo Geocoding"}
                  </span>
                </div>

                {displaySuggestions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {displaySuggestions.map((c) => (
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
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm font-bold text-slate-800">
                      Nenhuma localidade encontrada com o termo "{searchQuery}".
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Verifique a grafia ou pesquise informando o país (ex: "Belo Horizonte, Brasil", "Miami, Estados Unidos").
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCustomCitySubmit()}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Buscar "{searchQuery}" via Geocodificação</span>
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

        {/* ESTADO DE ERRO: Quando falha e não há dados prévios */}
        {error && !weatherData && (
          <div className="mb-8 rounded-3xl border-2 border-rose-300 bg-rose-50 p-6 sm:p-8 text-center shadow-sm">
            <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
            <h2 className="font-heading text-xl sm:text-2xl font-black text-rose-950">
              Não foi possível carregar os dados meteorológicos
            </h2>
            <p className="text-sm text-rose-900 mt-2 max-w-lg mx-auto leading-relaxed">
              {error}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => loadWeatherData(selectedCity, true)}
                className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={() => {
                  const bsb = WORLD_CITIES.find((c) => c.id === "brasilia-df-br") || WORLD_CITIES[0];
                  setSelectedCity(bsb);
                }}
                className="px-5 py-2.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-100/50 text-rose-950 text-xs font-bold transition-colors cursor-pointer"
              >
                Voltar para Brasília (DF)
              </button>
            </div>
          </div>
        )}

        {/* ESTADO DE CARREGAMENTO: Skeleton enquanto a API responde */}
        {isLoading && !weatherData && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white shadow-sm p-8 sm:p-12 text-center animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-6 h-6 text-sky-600 animate-spin" />
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-800">
              Consultando condições em tempo real para {selectedCity.name}...
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Conectando aos servidores de dados meteorológicos globais da Open-Meteo.
            </p>
          </div>
        )}

        {/* 4. Cartão Principal: Condições Atuais da Localidade Selecionada (Dados Reais) */}
        {weatherData && (
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
                      {weatherData.city.name}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700 font-mono font-bold">
                      {weatherData.city.countryCode}
                    </span>
                    {isLoading && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-900 text-sky-200 font-bold animate-pulse">
                        Atualizando...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    <span className="font-semibold text-white">{weatherData.city.stateOrRegion}</span> · {weatherData.city.country}
                    {weatherData.city.disambiguation && (
                      <span className="text-sky-300 ml-1">
                        — {weatherData.city.disambiguation}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Fonte: {weatherData.current.dataSource || LIVE_WEATHER_SOURCE}
                </span>
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline" title="Última atualização registrada da API">
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
                      {weatherData.current.humidityPercent > 65
                        ? "Umidade elevada"
                        : weatherData.current.humidityPercent < 30
                        ? "Ar muito seco"
                        : "Faixa agradável"}
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
                    {weatherData.current.airQualityIndex !== null ? (
                      <>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                          {weatherData.current.airQualityIndex} <span className="text-xs font-sans font-bold">EAQI</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                          {weatherData.current.airQualityLevel}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-xl sm:text-2xl font-bold text-slate-400 font-heading">
                          --
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Dados indisponíveis
                        </p>
                      </>
                    )}
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
        )}

        {/* 5. Seção de Alertas e Avisos Meteorológicos Oficiais */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950">
                Avisos e Alertas Meteorológicos Oficiais
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Informação de Segurança Civil
            </span>
          </div>

          {/* Quadro Oficial de Orientação e Fontes Oficiais Autorizadas */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
                  <Info className="w-4 h-4 text-rose-600" />
                  <span>Transparência e Responsabilidade de Segurança Pública</span>
                </div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  Alertas civis oficiais requerem consulta direta aos órgãos governamentais de Defesa Civil
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  A presente integração com a API Open-Meteo fornece previsões numéricas e observações atmosféricas em tempo real, <strong>não contemplando a emissão de alertas civis de emergência ou decretos de calamidade</strong>. Para consultar avisos vigentes com validade jurídica de Defesa Civil no território brasileiro, utilize exclusivamente as plataformas oficiais autorizadas:
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <a
                    href="https://alertas2.inmet.gov.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-sky-800 uppercase block">INMET</span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-sky-900">Avisos Meteorológicos Especiais</span>
                    </div>
                    <div className="mt-2 text-[11px] text-sky-700 flex items-center gap-1 font-semibold">
                      <span>Acessar alertas</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>

                  <a
                    href="https://www.gov.br/mdr/pt-br/assuntos/protecao-e-defesa-civil"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Defesa Civil Nacional</span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-amber-900">Sistema de Alertas SMS e WhatsApp</span>
                    </div>
                    <div className="mt-2 text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
                      <span>Canal Oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>

                  <a
                    href="https://www.gov.br/cemaden/pt-br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">CEMADEN</span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-900">Monitoramento de Desastres Naturais</span>
                    </div>
                    <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                      <span>Acessar boletins</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                </div>
              </div>

              {/* Contatos de Emergência */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs shrink-0 md:w-64">
                <span className="font-bold uppercase tracking-wider text-slate-500 block text-[10px] mb-2">
                  Telefones de Emergência Nacional (Gratuitos):
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Defesa Civil</span>
                    <span className="font-mono font-black text-rose-700 text-sm">199</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">Corpo de Bombeiros</span>
                    <span className="font-mono font-black text-rose-700 text-sm">193</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">SAMU (Socorro)</span>
                    <span className="font-mono font-black text-rose-700 text-sm">192</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Previsão para 7 Dias e Previsão Horária (Abas Interativas) */}
        {weatherData && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-950">
                    Previsão Estendida para {weatherData.city.name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Projeções meteorológicas reais geradas por modelos de alta resolução para planejamento semanal.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-200">
                  Modelos Oficiais
                </span>
                <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setForecastTab("7dias")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      forecastTab === "horaria"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Próximas 24 Horas
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
        )}

        {/* 7. Quadro Regional: Panorama Meteorológico das Macro-Regiões do Brasil (Dados Reais) */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-slate-950">
                Panorama Meteorológico Regional do Brasil
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Valores reais observados nas cinco macro-regiões do território nacional via Open-Meteo.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              AO VIVO
            </span>
          </div>

          {isMacroLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse"
                >
                  <div className="h-4 w-24 bg-slate-200 rounded mb-3" />
                  <div className="h-7 w-16 bg-slate-200 rounded mb-2" />
                  <div className="h-3 w-full bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : macroRegions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {macroRegions.map((reg, rIdx) => (
                <button
                  key={rIdx}
                  type="button"
                  onClick={() => {
                    const found = WORLD_CITIES.find((c) => c.id === reg.capitalId) || {
                      id: reg.capitalId,
                      name: reg.capitalRef,
                      stateOrRegion: reg.region,
                      country: "Brasil",
                      countryCode: "BR",
                      latitude: reg.latitude,
                      longitude: reg.longitude,
                    };
                    handleSelectCity(found);
                  }}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider group-hover:text-sky-900">
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
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Dados do panorama macro-regional indisponíveis no momento.
              </p>
              <button
                type="button"
                onClick={() => loadMacro()}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar novamente</span>
              </button>
            </div>
          )}
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
