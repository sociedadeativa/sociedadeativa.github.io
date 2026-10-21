/**
 * Testes determinísticos de validação da integração meteorológica (Clima & Previsão).
 * Utiliza simulação controlada (mock) de requisições de rede para garantir execução determinística e offline.
 */

import assert from "node:assert";
import {
  mapWmoCodeToCondition,
  degreesToCompass,
  getUvLevel,
  getAirQualityLevel,
  fetchRealCityWeather,
  searchOpenMeteoCities,
  fetchMacroRegionsPanorama,
  WORLD_CITIES,
  LIVE_WEATHER_SOURCE,
} from "../src/data/weatherData.ts";

console.log("===========================================================================");
console.log("EXECUÇÃO DE TESTES FOCADOS: INTEGRAÇÃO METEOROLÓGICA OPEN-METEO (CLIMA)");
console.log("===========================================================================\n");

// Gerador de datas para fixtures
const today = new Date();
const dates7Days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});

const hourlyTimes = Array.from({ length: 24 }, (_, i) => {
  const d = new Date(today);
  d.setHours(d.getHours() + i, 0, 0, 0);
  return d.toISOString().slice(0, 16);
});

// Fixture padrão de previsão Open-Meteo
const mockForecastPayload = {
  timezone: "America/Sao_Paulo",
  current: {
    temperature_2m: 24.5,
    apparent_temperature: 25.2,
    relative_humidity_2m: 65,
    weather_code: 0,
    surface_pressure: 1012.3,
    wind_speed_10m: 14.2,
    wind_direction_10m: 90,
    wind_gusts_10m: 18.5,
    dew_point_2m: 17.5,
    visibility: 10000,
  },
  daily: {
    time: dates7Days,
    weather_code: [0, 1, 2, 61, 3, 0, 1],
    temperature_2m_max: [28.0, 27.5, 26.0, 24.0, 25.5, 27.0, 28.5],
    temperature_2m_min: [18.0, 17.5, 17.0, 16.5, 16.0, 17.0, 18.0],
    apparent_temperature_max: [29.0, 28.5, 27.0, 25.0, 26.5, 28.0, 29.5],
    apparent_temperature_min: [18.0, 17.5, 17.0, 16.5, 16.0, 17.0, 18.0],
    sunrise: dates7Days.map((d) => `${d}T05:45`),
    sunset: dates7Days.map((d) => `${d}T18:15`),
    uv_index_max: [6.2, 5.8, 6.0, 4.5, 5.0, 6.5, 7.0],
    precipitation_sum: [0.0, 0.2, 1.5, 8.2, 0.0, 0.0, 0.0],
    precipitation_probability_max: [10, 25, 45, 80, 20, 10, 15],
    wind_speed_10m_max: [15, 14, 18, 22, 16, 14, 15],
  },
  hourly: {
    time: hourlyTimes,
    temperature_2m: hourlyTimes.map((_, i) => 20 + Math.sin(i / 3) * 5),
    precipitation_probability: hourlyTimes.map((_, i) => (i % 4 === 0 ? 30 : 10)),
    weather_code: hourlyTimes.map(() => 0),
  },
};

// Fixture para macro-regiões (5 capitais em lote)
const mockMacroPayload = [
  { current: { temperature_2m: 31.0, relative_humidity_2m: 80, weather_code: 61 } }, // Manaus
  { current: { temperature_2m: 29.5, relative_humidity_2m: 72, weather_code: 1 } },  // Salvador
  { current: { temperature_2m: 26.0, relative_humidity_2m: 55, weather_code: 0 } },  // Brasília
  { current: { temperature_2m: 23.0, relative_humidity_2m: 68, weather_code: 2 } },  // São Paulo
  { current: { temperature_2m: 21.0, relative_humidity_2m: 75, weather_code: 3 } },  // Porto Alegre
];

// Fixture de geocodificação com desambiguação
const mockGeocodeParisPayload = {
  results: [
    {
      id: 2988507,
      name: "Paris",
      latitude: 48.85341,
      longitude: 2.3488,
      country_code: "FR",
      country: "França",
      admin1: "Ilha de França",
      feature_code: "PPLC",
      timezone: "Europe/Paris",
    },
    {
      id: 4717560,
      name: "Paris",
      latitude: 33.66094,
      longitude: -95.55551,
      country_code: "US",
      country: "Estados Unidos",
      admin1: "Texas",
      feature_code: "PPLA2",
      timezone: "America/Chicago",
    },
  ],
};

const originalFetch = globalThis.fetch;

async function runTests() {
  try {
    // -------------------------------------------------------------------------
    // TESTE 1: Mapeamento WMO, rosa dos ventos, UV e faixas de qualidade do ar
    // -------------------------------------------------------------------------
    console.log("[TESTE 1] Validação de utilitários de domínio: WMO, bússola, UV e EAQI");
    assert.strictEqual(mapWmoCodeToCondition(0).key, "ensolarado");
    assert.strictEqual(mapWmoCodeToCondition(0).label, "Céu Limpo");
    assert.strictEqual(mapWmoCodeToCondition(2).key, "parcialmente_nublado");
    assert.strictEqual(mapWmoCodeToCondition(3).key, "nublado");
    assert.strictEqual(mapWmoCodeToCondition(45).key, "neblina");
    assert.strictEqual(mapWmoCodeToCondition(61).key, "chuva_leve");
    assert.strictEqual(mapWmoCodeToCondition(63).key, "chuva_moderada");
    assert.strictEqual(mapWmoCodeToCondition(65).key, "chuva_forte");
    assert.strictEqual(mapWmoCodeToCondition(71).key, "neve");
    assert.strictEqual(mapWmoCodeToCondition(95).key, "tempestade");
    console.log("  [PASS] 1. Códigos WMO da OMM mapeados para chaves e rótulos em português.");

    assert.strictEqual(degreesToCompass(0), "N");
    assert.strictEqual(degreesToCompass(90), "L");
    assert.strictEqual(degreesToCompass(180), "S");
    assert.strictEqual(degreesToCompass(270), "O");
    assert.strictEqual(degreesToCompass(45), "NE");
    assert.strictEqual(degreesToCompass(135), "SE");
    assert.strictEqual(degreesToCompass(225), "SO");
    assert.strictEqual(degreesToCompass(315), "NO");
    console.log("  [PASS] 2. Rosa dos ventos (0-360°) mapeada para siglas em português.");

    assert.strictEqual(getUvLevel(1), "Baixo");
    assert.strictEqual(getUvLevel(4), "Moderado");
    assert.strictEqual(getUvLevel(7), "Alto");
    assert.strictEqual(getUvLevel(9), "Muito Alto");
    assert.strictEqual(getUvLevel(12), "Extremo");
    console.log("  [PASS] 3. Classificação de índice UV validada.");

    // Validação estrita de faixas EAQI e ausência de fallback sintetizado
    assert.strictEqual(getAirQualityLevel(15), "Excelente");
    assert.strictEqual(getAirQualityLevel(35), "Boa");
    assert.strictEqual(getAirQualityLevel(60), "Moderada");
    assert.strictEqual(getAirQualityLevel(90), "Ruim");
    assert.strictEqual(getAirQualityLevel(null), "Indisponível");
    assert.strictEqual(getAirQualityLevel(undefined), "Indisponível");
    assert.strictEqual(getAirQualityLevel(NaN), "Indisponível");
    console.log("  [PASS] 4. Classificação EAQI e tratamento estrito de valor indisponível (sem default sintetizado).");

    // -------------------------------------------------------------------------
    // TESTE 2: Consulta à Forecast API com qualidade do ar válida e atribuição correta
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 2] Consulta mockada à Open-Meteo Forecast API com dados válidos de ar");
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("api.open-meteo.com/v1/forecast")) {
        return {
          ok: true,
          status: 200,
          json: async () => JSON.parse(JSON.stringify(mockForecastPayload)),
        };
      }
      if (urlStr.includes("air-quality-api.open-meteo.com")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ current: { european_aqi: 25 } }),
        };
      }
      throw new Error(`Chamada inesperada de fetch: ${urlStr}`);
    };

    const brasilia = WORLD_CITIES.find((c) => c.id === "brasilia-df-br");
    assert.ok(brasilia, "Brasília deve existir em WORLD_CITIES");

    const weather = await fetchRealCityWeather(brasilia);
    assert.strictEqual(typeof weather.current.tempC, "number");
    assert.strictEqual(weather.current.tempC, 24.5);
    assert.strictEqual(weather.current.humidityPercent, 65);
    assert.strictEqual(weather.current.windSpeedKmH, 14);
    assert.strictEqual(weather.current.pressureHpa, 1012);
    assert.strictEqual(weather.current.dataSource, LIVE_WEATHER_SOURCE);
    assert.strictEqual(weather.current.dataSource, "Open-Meteo API");
    assert.ok(!weather.current.dataSource.includes("INMET"), "Não deve alegar dados verificados do INMET");
    assert.ok(!weather.current.dataSource.includes("ECMWF"), "Não deve alegar dados diretos do ECMWF");
    assert.strictEqual(weather.current.airQualityIndex, 25);
    assert.strictEqual(weather.current.airQualityLevel, "Boa");
    assert.strictEqual(weather.forecast7Days.length, 7);
    assert.strictEqual(weather.hourly.length, 24);
    assert.strictEqual(weather.alerts.length, 0, "Nenhum alerta simulado deve existir");
    console.log("  [PASS] 1. Previsão e qualidade do ar estruturadas com atribuição verificada à Open-Meteo API.");
    console.log("  [PASS] 2. Alertas simulados completamente ausentes.");

    // -------------------------------------------------------------------------
    // TESTE 3: Falha na API de Qualidade do Ar não deve produzir fallback sintético
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 3] Comportamento defensivo quando a API de Qualidade do Ar falha ou retorna vazio");
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("api.open-meteo.com/v1/forecast")) {
        return {
          ok: true,
          status: 200,
          json: async () => JSON.parse(JSON.stringify(mockForecastPayload)),
        };
      }
      if (urlStr.includes("air-quality-api.open-meteo.com")) {
        // Simula falha HTTP 500 no endpoint de qualidade do ar
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: true }),
        };
      }
      throw new Error(`Chamada inesperada de fetch: ${urlStr}`);
    };

    const weatherNoAqi = await fetchRealCityWeather(brasilia);
    assert.strictEqual(
      weatherNoAqi.current.airQualityIndex,
      null,
      "airQualityIndex deve ser estritamente null quando a API de ar falha (nunca 28 ou outro default)"
    );
    assert.strictEqual(
      weatherNoAqi.current.airQualityLevel,
      "Indisponível",
      "airQualityLevel deve ser 'Indisponível' quando o índice é nulo"
    );
    console.log("  [PASS] 1. Falha no endpoint de ar resulta em null e 'Indisponível' sem substituição sintética.");

    // -------------------------------------------------------------------------
    // TESTE 4: Geocodificação com desambiguação de homônimos (Paris, FR vs Paris, US)
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 4] Geocodificação e desambiguação sem acesso externo");
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("geocoding-api.open-meteo.com")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockGeocodeParisPayload,
        };
      }
      throw new Error(`Chamada inesperada de fetch: ${urlStr}`);
    };

    const geoResults = await searchOpenMeteoCities("Paris");
    assert.strictEqual(geoResults.length, 2);
    const franceParis = geoResults.find((c) => c.countryCode === "FR");
    const usParis = geoResults.find((c) => c.countryCode === "US");
    assert.ok(franceParis, "Deve conter Paris na França");
    assert.ok(usParis, "Deve conter Paris no Texas, Estados Unidos");
    assert.strictEqual(franceParis.stateOrRegion, "Ilha de França");
    assert.strictEqual(usParis.stateOrRegion, "Texas");
    console.log(`  [PASS] 1. Homônimos desambiguados com sucesso (${franceParis.name}, ${franceParis.country} e ${usParis.name}, ${usParis.stateOrRegion}).`);

    // -------------------------------------------------------------------------
    // TESTE 5: Panorama Macro-Regional em lote e tratamento de erro
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 5] Panorama Macro-Regional das 5 macro-regiões");
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("api.open-meteo.com/v1/forecast")) {
        return {
          ok: true,
          status: 200,
          json: async () => mockMacroPayload,
        };
      }
      throw new Error(`Chamada inesperada de fetch: ${urlStr}`);
    };

    const macroResults = await fetchMacroRegionsPanorama();
    assert.strictEqual(macroResults.length, 5, "Devem retornar exatamente 5 macro-regiões");
    const macroCapitals = macroResults.map((m) => m.capitalRef);
    assert.deepStrictEqual(macroCapitals, [
      "Manaus",
      "Salvador",
      "Brasília",
      "São Paulo",
      "Porto Alegre",
    ]);
    assert.strictEqual(macroResults[0].temp, 31);
    assert.strictEqual(macroResults[3].temp, 23);
    console.log(`  [PASS] 1. Panorama das 5 capitais obtido via lote: ${macroCapitals.join(", ")}.`);

    // Falha no panorama macro-regional deve lançar erro e não retornar dados mockados
    globalThis.fetch = async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: true }),
    });

    await assert.rejects(
      async () => {
        await fetchMacroRegionsPanorama();
      },
      /Falha no panorama regional Open-Meteo/,
      "Falha na API deve lançar erro explícito em vez de retornar dados falsos silenciosamente"
    );
    console.log("  [PASS] 2. Falha de rede no panorama regional rejeita com erro explícito.");

    // -------------------------------------------------------------------------
    // TESTE 6: Tratamento de erro estrito sem dados sintetizados
    // -------------------------------------------------------------------------
    console.log("\n[TESTE 6] Tratamento estrito de erro em falha geográfica ou indisponibilidade total");
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("geocoding-api.open-meteo.com")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ results: [] }),
        };
      }
      throw new Error(`Chamada inesperada de fetch: ${urlStr}`);
    };

    const invalidCity = {
      id: "cidade-inexistente-xyz",
      name: "CidadeInexistenteZyxWvu123456789",
      stateOrRegion: "Nenhum",
      country: "Nenhum",
      countryCode: "XX",
    };

    await assert.rejects(
      async () => {
        await fetchRealCityWeather(invalidCity);
      },
      /não encontrada na base geográfica Open-Meteo/,
      "Deve falhar com mensagem clara e nunca gerar dados fictícios"
    );
    console.log("  [PASS] 1. Cidade inexistente rejeitada com erro explícito sem fallback simulado.");

    console.log("\n===========================================================================");
    console.log("TODOS OS TESTES DETERMINÍSTICOS DA INTEGRAÇÃO CLIMÁTICA PASSARAM!");
    console.log("===========================================================================");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runTests().catch((err) => {
  console.error("FALHA NOS TESTES:", err);
  process.exit(1);
});
