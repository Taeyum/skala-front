export async function fetchWeather(lat, lon) {
    var url =
        "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
        "&longitude=" + lon +
        "&current=temperature_2m,relative_humidity_2m";

    var response = await fetch(url);
    var data = await response.json();

    return {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m
    };
}
