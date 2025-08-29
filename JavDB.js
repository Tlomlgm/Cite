const url = $request.url;
let header = $request.headers;

if (url.includes("/api/v1/movies/") && url.includes("/play?")) {
  header.authorization =
    "Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MzU4NDg3NywidXNlcm5hbWUiOiJjaHhtMTAyNCJ9.RI3cy6hTiFd7NgzDxN8UJwWlCQEJtGGxqRryWW8jr-w";
  $done({ headers: header });
} else {
  $done({});
}
