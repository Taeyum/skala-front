import { fetchWeather } from "./weatherAPI.js";

var cityData = {
    seoul: { name: "서울", lat: 37.5665, lon: 126.9780 },
    busan: { name: "부산", lat: 35.1796, lon: 129.0756 },
    gwangju: { name: "광주", lat: 35.1595, lon: 126.8526 },
    incheon: { name: "인천", lat: 37.4563, lon: 126.7052 },
    jeju: { name: "제주", lat: 33.4996, lon: 126.5312 },
    tokyo: { name: "도쿄", lat: 35.6762, lon: 139.6503 },
    newyork: { name: "뉴욕", lat: 40.7128, lon: -74.0060 },
    paris: { name: "파리", lat: 48.8566, lon: 2.3522 },
    london: { name: "런던", lat: 51.5072, lon: -0.1276 },
    sydney: { name: "시드니", lat: -33.8688, lon: 151.2093 }
};

var citySelect = document.getElementById("city-select");
var weatherBox = document.getElementById("weather-box");
var cityMap = document.getElementById("city-map");

/*
    선택한 도시의 위경도를 중심으로 지도 범위(bbox)를 계산해서 OpenStreetMap 임베드 주소를 만듦.
    bbox는 "왼쪽,아래쪽,오른쪽,위쪽" 4개 경계값이라, lat/lon에서 delta만큼 상하좌우로 넓힌 사각형을 만들면 됨.
    marker 파라미터로 그 위치에 핀도 하나 찍음. 카카오맵과 달리 API 키/개발자 등록이 필요 없음.
*/
function updateMap(lat, lon) {
    var delta = 0.15;
    var bbox = (lon - delta) + "," + (lat - delta) + "," + (lon + delta) + "," + (lat + delta);

    cityMap.src =
        "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox +
        "&layer=mapnik&marker=" + lat + "," + lon;
}

async function showCityInfo() {
    var selectedCity = cityData[citySelect.value];

    updateMap(selectedCity.lat, selectedCity.lon);

    weatherBox.innerHTML =
        "<h4>" + selectedCity.name + "</h4>" +
        "<p>위도: " + selectedCity.lat + ", 경도: " + selectedCity.lon + "</p>" +
        "<p>로딩 중... ⏳</p>";

    try {
        var weather = await fetchWeather(selectedCity.lat, selectedCity.lon);

        weatherBox.innerHTML =
            "<h4>" + selectedCity.name + "</h4>" +
            "<p>위도: " + selectedCity.lat + ", 경도: " + selectedCity.lon + "</p>" +
            "<p>🌡️ 온도: " + weather.temperature + "°C</p>" +
            "<p>💧 습도: " + weather.humidity + "%</p>";
    } catch (error) {
        weatherBox.innerHTML =
            "<h4>" + selectedCity.name + "</h4>" +
            "<p>위도: " + selectedCity.lat + ", 경도: " + selectedCity.lon + "</p>" +
            "<p>⚠️ 날씨 정보를 가져오지 못했어요.</p>";
    }
}

citySelect.addEventListener("change", showCityInfo);

showCityInfo();
