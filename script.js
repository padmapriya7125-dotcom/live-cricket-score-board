// Add your CricketData API key here.
// Do not publish a real key in a public repository.;

var liveMatches = [];
var watchlist = JSON.parse(localStorage.getItem("cricketWatchlist")) || [];
var featuredMatchId = localStorage.getItem("featuredCricketMatch") || "";

function loadLiveScores() {
  var message = document.getElementById("statusMessage");


  message.textContent = "Loading live scores...";

  fetch("/api/scores")
    .then(function(response) {
      if (!response.ok) {
        throw new Error("The API request failed.");
      }
      return response.json();
    })
    .then(function(result) {
      if (result.status !== "success" || !result.data) {
        throw new Error("The API did not return match data.");
      }

      liveMatches = result.data;
      updateStatusOptions();
      showLiveMatches();
      updateDashboard();
      updateFeaturedOptions();
      updateSavedScores();

      message.textContent = "Scores loaded from CricketData.";
      document.getElementById("lastUpdated").textContent =
        "Checked at " + new Date().toLocaleTimeString();
    })
    .catch(function() {
      message.textContent =
        "Could not load scores. Check your API key and internet connection.";
    });
}

function statusCategory(status) {
  var text = (status || "").toLowerCase();

  if (
    text.indexOf("won by") !== -1 ||
    text.indexOf("draw") !== -1 ||
    text.indexOf("no result") !== -1 ||
    text.indexOf("abandoned") !== -1 ||
    text.indexOf("completed") !== -1 ||
    text.indexOf("finished") !== -1
  ) {
    return "Completed";
  }

  if (
    text.indexOf("not started") !== -1 ||
    text.indexOf("starts at") !== -1 ||
    text.indexOf("scheduled") !== -1 ||
    text.indexOf("upcoming") !== -1
  ) {
    return "Upcoming";
  }

  return "Live";
}

function updateStatusOptions() {
  var select = document.getElementById("statusFilter");
  var oldValue = select.value;
  var values = [];

  select.textContent = "";

  var allOption = document.createElement("option");
  allOption.value = "All";
  allOption.textContent = "All statuses";
  select.appendChild(allOption);

  for (var i = 0; i < liveMatches.length; i++) {
    var category = statusCategory(liveMatches[i].status);
    var exists = false;

    for (var j = 0; j < values.length; j++) {
      if (values[j] === category) {
        exists = true;
      }
    }

    if (!exists) {
      values.push(category);
    }
  }

  for (var k = 0; k < values.length; k++) {
    var option = document.createElement("option");
    option.value = values[k];
    option.textContent = values[k];
    select.appendChild(option);
  }

  select.value = oldValue;

  if (select.value === "") {
    select.value = "All";
  }
}

function showLiveMatches() {
  var list = document.getElementById("matchList");
  var search = document.getElementById("searchInput").value.toLowerCase();
  var selectedStatus = document.getElementById("statusFilter").value;
  var count = 0;

  list.textContent = "";

  for (var i = 0; i < liveMatches.length; i++) {
    var match = liveMatches[i];
    var teams = "";

    if (match.teams) {
      for (var j = 0; j < match.teams.length; j++) {
        teams += match.teams[j] + " ";
      }
    }

    var category = statusCategory(match.status);
    var searchable = (
      (match.name || "") + " " + teams + " " + (match.status || "")
    ).toLowerCase();

    var nameMatches = searchable.indexOf(search) !== -1;
    var statusMatches =
      selectedStatus === "All" || category === selectedStatus;

    if (nameMatches && statusMatches) {
      var card = document.createElement("article");
      card.className = "match-card";

      if (String(match.id) === featuredMatchId) {
        card.className += " featured";
      }

      var title = document.createElement("h3");
      title.textContent = match.name || "Cricket match";
      card.appendChild(title);

      var status = document.createElement("p");
      status.textContent =
        "Status: " + (match.status || "Unavailable") + " (" + category + ")";
      card.appendChild(status);

      if (match.venue) {
        var venue = document.createElement("p");
        venue.textContent = "Venue: " + match.venue;
        card.appendChild(venue);
      }

      if (match.score && match.score.length > 0) {
        for (var k = 0; k < match.score.length; k++) {
          var inning = match.score[k];
          var scoreLine = document.createElement("p");
          scoreLine.textContent =
            inning.inning + ": " + inning.r + "/" + inning.w +
            " (" + inning.o + " overs)";
          card.appendChild(scoreLine);
        }
      } else {
        var noScore = document.createElement("p");
        noScore.textContent = "Score not available yet.";
        card.appendChild(noScore);
      }

      var actions = document.createElement("div");
      actions.className = "card-actions";

      var saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.textContent = "Save to watchlist";
      saveButton.setAttribute("data-match-index", i);
      saveButton.addEventListener("click", function() {
        saveMatch(Number(this.getAttribute("data-match-index")));
      });

      actions.appendChild(saveButton);
      card.appendChild(actions);
      list.appendChild(card);
      count++;
    }
  }

  document.getElementById("noMatches").hidden = count > 0;
}

function updateDashboard() {
  var live = 0;
  var upcoming = 0;
  var completed = 0;

  for (var i = 0; i < liveMatches.length; i++) {
    var category = statusCategory(liveMatches[i].status);

    if (category === "Live") live++;
    if (category === "Upcoming") upcoming++;
    if (category === "Completed") completed++;
  }

  document.getElementById("totalCount").textContent = liveMatches.length;
  document.getElementById("liveCount").textContent = live;
  document.getElementById("upcomingCount").textContent = upcoming;
  document.getElementById("completedCount").textContent = completed;
}

function saveMatch(index) {
  var match = liveMatches[index];
  var id = String(match.id || match.name);

  for (var i = 0; i < watchlist.length; i++) {
    if (watchlist[i].id === id) {
      document.getElementById("statusMessage").textContent =
        "That match is already saved.";
      return;
    }
  }

  watchlist.push({
    id: id,
    name: match.name || "Cricket match",
    note: ""
  });

  saveWatchlist();
  showWatchlist();
}

function saveWatchlist() {
  localStorage.setItem("cricketWatchlist", JSON.stringify(watchlist));
}

function showWatchlist() {
  var area = document.getElementById("watchlistItems");
  area.textContent = "";

  document.getElementById("emptyWatchlist").hidden = watchlist.length > 0;

  for (var i = 0; i < watchlist.length; i++) {
    var item = watchlist[i];
    var card = document.createElement("article");
    card.className = "saved-card";

    var title = document.createElement("h3");
    title.textContent = item.name;
    card.appendChild(title);

    var noteLabel = document.createElement("label");
    noteLabel.textContent = "My note (optional, up to 80 characters)";

    var note = document.createElement("input");
    note.className = "note-input";
    note.maxLength = 80;
    note.value = item.note || "";
    note.setAttribute("data-watch-index", i);

    noteLabel.appendChild(note);
    card.appendChild(noteLabel);

    var actions = document.createElement("div");
    actions.className = "card-actions";

    var updateButton = document.createElement("button");
    updateButton.type = "button";
    updateButton.textContent = "Save note";
    updateButton.setAttribute("data-watch-index", i);
    updateButton.addEventListener("click", function() {
      var index = Number(this.getAttribute("data-watch-index"));
      var input = document.querySelector(
        '.note-input[data-watch-index="' + index + '"]'
      );

      watchlist[index].note = input.value.trim();
      saveWatchlist();

      document.getElementById("statusMessage").textContent =
        "Watchlist note saved.";
    });

    var deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "Remove";
    deleteButton.setAttribute("data-watch-index", i);
    deleteButton.addEventListener("click", function() {
      var index = Number(this.getAttribute("data-watch-index"));
      watchlist.splice(index, 1);
      saveWatchlist();
      showWatchlist();
    });

    actions.appendChild(updateButton);
    actions.appendChild(deleteButton);
    card.appendChild(actions);
    area.appendChild(card);
  }
}

function updateSavedScores() {
  for (var i = 0; i < watchlist.length; i++) {
    for (var j = 0; j < liveMatches.length; j++) {
      var liveId = String(liveMatches[j].id || liveMatches[j].name);

      if (watchlist[i].id === liveId) {
        watchlist[i].name = liveMatches[j].name || watchlist[i].name;
      }
    }
  }

  saveWatchlist();
  showWatchlist();
}

function updateFeaturedOptions() {
  var select = document.getElementById("featuredMatch");
  select.textContent = "";

  var emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "No featured match";
  select.appendChild(emptyOption);

  for (var i = 0; i < liveMatches.length; i++) {
    var option = document.createElement("option");
    option.value = String(liveMatches[i].id || liveMatches[i].name);
    option.textContent = liveMatches[i].name || "Cricket match";
    select.appendChild(option);
  }

  select.value = featuredMatchId;
}

document.getElementById("profileForm").addEventListener("submit", function(event) {
  event.preventDefault();

  var name = document.getElementById("displayName").value.trim();

  if (name.length < 2) {
    document.getElementById("profileHeading").textContent =
      "Enter at least 2 characters.";
    return;
  }

  localStorage.setItem("cricketDemoProfile", name);
  showProfile();
});

function showProfile() {
  var name = localStorage.getItem("cricketDemoProfile");

  document.getElementById("profileName").textContent = name || "Guest";
  document.getElementById("profileButton").textContent =
    name ? "Profile" : "Sign in";
  document.getElementById("displayName").value = name || "";
  document.getElementById("profileHeading").textContent =
    name ? "Profile: " + name : "Demo profile";
  document.getElementById("signOutButton").hidden = !name;
}

document.getElementById("profileButton").addEventListener("click", function() {
  document.getElementById("profilePanel").scrollIntoView({ behavior: "smooth" });
  document.getElementById("displayName").focus();
});

document.getElementById("signOutButton").addEventListener("click", function() {
  localStorage.removeItem("cricketDemoProfile");
  showProfile();
});

document.getElementById("searchInput").addEventListener("input", showLiveMatches);
document.getElementById("statusFilter").addEventListener("change", showLiveMatches);
document.getElementById("refreshButton").addEventListener("click", loadLiveScores);

document.getElementById("saveFeaturedButton").addEventListener("click", function() {
  featuredMatchId = document.getElementById("featuredMatch").value;
  localStorage.setItem("featuredCricketMatch", featuredMatchId);
  showLiveMatches();

  document.getElementById("adminMessage").textContent =
    "Featured selection saved in this browser.";
});

document.getElementById("clearWatchlistButton").addEventListener("click", function() {
  if (confirm("Clear the watchlist saved in this browser?")) {
    watchlist = [];
    saveWatchlist();
    showWatchlist();
  }
});

showProfile();
showWatchlist();
loadLiveScores();

// One-minute updates use the API's daily request allowance.
// This interval is intended for a short classroom demo.
setInterval(loadLiveScores, 300000);
