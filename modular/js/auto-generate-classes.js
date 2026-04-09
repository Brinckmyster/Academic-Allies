function getUpcomingSpringClasses() {
  const now = new Date();
  const year = now.getFullYear();

  return SPRING_CLASSES.filter(function(cls) {
    const start = new Date(cls.start);
    return start.getFullYear() === year && start >= now;
  });
}

function generateClassSlots() {
  const studyContainer = document.getElementById("study-tools-auto");
  const battleContainer = document.getElementById("battle-mode-auto");

  if (!studyContainer || !battleContainer) return;

  const classes = getUpcomingSpringClasses();

  classes.forEach(function(cls) {
    var studyCard = document.createElement("div");
    studyCard.className = "class-card";
    studyCard.innerHTML =
      "<h3>" + cls.name + "</h3>" +
      "<p>Study tools coming soon</p>" +
      "<button>Open Study Mode</button>";
    studyContainer.appendChild(studyCard);

    var battleCard = document.createElement("div");
    battleCard.className = "battle-card";
    battleCard.innerHTML =
      "<h3>" + cls.name + "</h3>" +
      "<p>Battle Mode Ready</p>" +
      "<button>Start Battle</button>";
    battleContainer.appendChild(battleCard);
  });
}

document.addEventListener("DOMContentLoaded", generateClassSlots);