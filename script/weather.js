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

function showCityInfo() {
    var selectedCity = cityData[citySelect.value];

    weatherBox.innerHTML =
        "<h4>" + selectedCity.name + "</h4>" +
        "<p>위도: " + selectedCity.lat + "</p>" +
        "<p>경도: " + selectedCity.lon + "</p>" +
        "<p><small>(날씨 정보는 아직 연결 전이에요)</small></p>";
}

citySelect.addEventListener("change", showCityInfo);

showCityInfo();
