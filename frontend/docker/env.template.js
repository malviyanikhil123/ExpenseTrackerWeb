(function () {
  const host = window.location.hostname;

  let apiUrl;

  switch (host) {
    case "expensetracker.nikhilmalviya.online":
      apiUrl = "https://api-expensetracker.nikhilmalviya.online";
      break;

    case "100.113.63.36":
      apiUrl = "http://100.113.63.36:5003";
      break;

    case "localhost":
      apiUrl = "http://localhost:6003";
      break;

    default:
      apiUrl = "http://100.113.63.36:5003";
  }

  window.__APP_CONFIG__ = {
    VITE_API_URL: apiUrl,
  };
})();