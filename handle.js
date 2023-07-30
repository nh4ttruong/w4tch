const API_URL = "https://phimmoiyyy.net/wp-json/dooplay/search/";
const PROXY_URL_REDIRECT = "https://api.allorigins.win/get?url=";
const PROXY_URL = "https://corsproxy.io/?";
const ADMIN_AJAX_URL = "https://phimmoiyyy.net/wp-admin/admin-ajax.php";

document
  .getElementById("movieName")
  .addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      const movieName = document.getElementById("movieName").value;
      if (movieName) {
        searchMovies();
      }
    }
  });

window.onbeforeunload = function () {
  const movieListContainer = document.getElementById("movieList");
  movieListContainer.innerHTML = "";
  movieListContainer.classList.remove("season-container");
  const searchResult = document.getElementById("searchResult");
  searchResult.innerHTML = "";
};

function addCorsProxy(url, isRedirect = false) {
  return (isRedirect ? PROXY_URL_REDIRECT : PROXY_URL) + url;
}

function getPostIdFromUrl(url) {
  const postIdMatch = url.match(/https:\/\/phimmoiyyy.net\/\?p=(\d+)/);
  return postIdMatch ? postIdMatch[1] : "";
}

async function searchMovies() {
  const movieName = document.getElementById("movieName").value;
  if (!movieName) {
    alert("Nhập gì đó !");
    return;
  }

  const loadingModal = document.getElementById("loadingModal");
  loadingModal.style.display = "block";

  const keyword = encodeURIComponent(movieName);
  const searchUrl = addCorsProxy(
    API_URL + `?keyword=${keyword}&nonce=ab2604e03e`
  );

  try {
    
    const messageElement = document.getElementById("searchResult");
    messageElement.innerHTML = "";
   
    const response = await fetch(searchUrl);
    const data = await response.json();
    const movieListContainer = document.getElementById("movieList");

    if (data === null || data.hasOwnProperty("error")) {
      movieListContainer.innerHTML =
        "<p class='home-caption1'>Không tìm thấy kết quả nào.</p>";
      return;
    }

    if (movieListContainer.classList.contains("season-container")) {
      movieListContainer.classList.remove("season-container");
      movieListContainer.innerHTML = "";
      const searchResult = document.getElementById("searchResult");
      searchResult.innerHTML = "";
    }

    document.getElementById("movieName").value = "";
    displayMovies(data, keyword);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    loadingModal.style.display = "none";
  }
}

function addMovieToList(movie) {
  const movieListContainer = document.getElementById("movieList");

  const movieItem = document.createElement("a");
  movieItem.classList.add("home-offer-container");
  movieItem.href = "#tomorrow-sunflower-will-bloom";

  if (movie.url.includes("phim-le")) {
    movieItem.classList.add("movie");
  } else {
    movieItem.classList.add("tv");
  }

  movieItem.addEventListener("click", function () {
    openMovieLink(movie.url);
    // clear search result
    const searchResult = document.getElementById("searchResult");
    searchResult.innerHTML = "";
  });

  const offerContainer = document.createElement("div");
  offerContainer.classList.add("offer-offer");
  movieItem.appendChild(offerContainer);

  const movieImage = document.createElement("img");
  movieImage.src = movie.img;
  movieImage.alt = movie.title;
  movieImage.classList.add("offer-image");
  offerContainer.appendChild(movieImage);

  const offerContent = document.createElement("div");
  offerContent.classList.add("offer-content");
  offerContainer.appendChild(offerContent);

  const offerDetails = document.createElement("div");
  offerDetails.classList.add("offer-details");
  offerContent.appendChild(offerDetails);

  const offerText = document.createElement("span");
  offerText.classList.add("offer-text");
  offerDetails.appendChild(offerText);

  const movieTitle = document.createElement("span");
  movieTitle.textContent = movie.title;
  offerText.appendChild(movieTitle);

  const offerText1 = document.createElement("span");
  offerText1.classList.add("offer-text1");
  offerDetails.appendChild(offerText1);

  const imdb = movie.extra.imdb;
  const imdbText = document.createElement("span");
  //imdb will be false or string

  imdbText.textContent = imdb ? `IMDB: ${imdb}` : "IMDB: N/A";
  offerText1.appendChild(imdbText);

  movieListContainer.appendChild(movieItem);
}

function displayMovies(movies, keyword) {
  const movieListContainer = document.getElementById("movieList");
  movieListContainer.innerHTML = "";

  const loadingModal = document.getElementById("loadingModal");
  loadingModal.style.display = "block";

  const messageElement = document.getElementById("searchResult");
  const keywordElement = document.createElement("p");
  keywordElement.textContent = `Kết quả tìm kiếm cho: ${decodeURIComponent(
    keyword
  )}`;

  try {
    if (!movies || Object.keys(movies).length === 0) {
      keywordElement.textContent = `Không tìm thấy gì cạ`;
      return;
    }
  
    messageElement.appendChild(keywordElement);
    
    for (const movieId in movies) {
      if (movies.hasOwnProperty(movieId)) {
        const movie = movies[movieId];
        addMovieToList(movie);
      }
    }
  }
  catch (error) {
    console.error("Error:", error);
  }
  finally {
    loadingModal.style.display = "none";
    messageElement.scrollIntoView({ behavior: "smooth" });
  }
}

async function openMovieLink(url) {
  const moviePageUrl = addCorsProxy(url);
  const filmType = moviePageUrl.includes("phim-le") ? "movie" : "tv";

  const loadingModal = document.getElementById("loadingModal");
  loadingModal.style.display = "block";

  try {
    const response = await fetch(moviePageUrl);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const shortlinkElement = doc.querySelector('link[rel="shortlink"]');

    if (!shortlinkElement) {
      alert("Không tìm thấy thông tin tập phim.");
      return;
    }

    const shortlinkUrl = shortlinkElement.getAttribute("href");

    if (filmType === "tv") {
      fetchTvSeriesEpisodes(shortlinkUrl);
    } else {
      fetchMovieLink(shortlinkUrl, "movie");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    loadingModal.style.display = "none";
  }
}

async function fetchMovieLink(url, filmType) {

  const loadingModal = document.getElementById("loadingModal");
  loadingModal.style.display = "block";

  try {
    const corsProxyAdminAjaxUrl = addCorsProxy(ADMIN_AJAX_URL);
    const filmId = getPostIdFromUrl(url);

    const formData = new FormData();
    formData.append("action", "doo_player_ajax");
    formData.append("post", filmId);
    formData.append("nume", "1");
    formData.append("type", filmType);

    const response = await fetch(corsProxyAdminAjaxUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(formData),
    });

    const data = await response.json();

    if (data.type === "iframe" || data.type === "mp4") {
      const movieLink = data.embed_url;

      if (movieLink.includes("vk.com")) {
        const match = movieLink.match(/oid=(\d+)&id=(\d+)/);

        const vkId = match[2];
        const vkOwnerId = match[1];

        const vkUrl = `https://vk.com/video${vkOwnerId}_${vkId}`;
        window.open(vkUrl, "_blank");
        return;
      }

      window.open(movieLink, "_blank");
    } else {
      alert("Không tìm thấy thông tin phim.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    loadingModal.style.display = "none";
  }
}

async function fetchTvSeriesEpisodes(url) {
  const loadingModal = document.getElementById("loadingModal");
  loadingModal.style.display = "block";

  try {
    const response = await fetch(addCorsProxy(url, true));

    if (!response.ok) {
      alert("Server đang quá tải rùi!");
      return;
    }

    const data = await response.json();
    const doc = new DOMParser().parseFromString(data.contents, "text/html");
    const episodesContainer = doc.getElementById("seasons");

    seasons = episodesContainer.querySelectorAll("ul.episodios");

    if (!seasons) {
      alert("Không tìm thấy thông tin tập phim.");
      return;
    }

    episodes = seasons[0]["childNodes"];
    seasonsLength = episodes.length;

    const divInfo = document.createElement("div");
    divInfo.classList.add("season-info");
    divInfo.textContent = "Phim " + doc.querySelector("h1").textContent;

    divInfo.scrollIntoView({ behavior: "smooth" });

    const movieListContainer = document.getElementById("movieList");
    movieListContainer.innerHTML = "";
    movieListContainer.classList.add("season-container");
    movieListContainer.appendChild(divInfo);

    const divSeason = document.createElement("div");
    divSeason.classList.add("season");
    divSeason.textContent = "Danh sách tập:";

    // create a div has ul
    const ulSeason = document.createElement("ul");
    ulSeason.classList.add("season-list");
    divSeason.appendChild(ulSeason);

    for (let i = 0; i < seasonsLength; i++) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = "Tập " + (i + 1);
      li.appendChild(a);
      ulSeason.appendChild(li);

      a.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          const corsEpLink = addCorsProxy(episodes[i].querySelector("a").href);
          const response = await fetch(corsEpLink);
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const shortlinkElement = doc.querySelector('link[rel="shortlink"]');

          if (!shortlinkElement) {
            alert("Không tìm thấy thông tin tập phim.");
            return;
          }

          const shortlinkUrl = shortlinkElement.getAttribute("href");
          fetchMovieLink(shortlinkUrl, "tv");
        } catch (error) {
          console.error("Error:", error);
        }
      });
    }

    movieListContainer.appendChild(divSeason);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    loadingModal.style.display = "none";
  }
}
