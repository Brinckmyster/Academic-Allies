/* Claude: 2026-03-25 — converted to ES5 var/function style */
// Universal Meal Suggestor for Academic Allies
// Inject this logic into your HTML (script tag, bottom) after var basePlan = null;
// This replaces generateSuggestions() to ensure everyone sees real meals.

function generateSuggestions() {
  // Pull candidate lists from ANY base plan format, or revert to sensible defaults
  var carbs = (basePlan && basePlan.carbs) ? basePlan.carbs : [
    "White rice", "Mashed potatoes", "Soft pasta", "White sandwich bread", "Crackers"
  ];
  var proteins = (basePlan && basePlan.proteins) ? basePlan.proteins : [
    "Chicken", "Deli turkey", "Eggs", "Greek yogurt", "Lentils", "Tofu"
  ];
  var vegs = (basePlan && basePlan.vegs) ? basePlan.vegs : [
    "Steamed green beans", "Soft-cooked carrots", "Peeled apple", "Cucumber", "Broccoli"
  ];
  var fats = (basePlan && basePlan.fats) ? basePlan.fats : [
    "Olive oil", "Lactose-free butter", "Sunflower oil"
  ];

  // Most typical meal times
  var mealTimes = ["08:00", "12:00", "18:00"];
  var suggestions = [];

  for (var i = 0; i < mealTimes.length; i++) {
    // Pick random index for each group
    var carb = carbs[Math.floor(Math.random() * carbs.length)];
    var protein = proteins[Math.floor(Math.random() * proteins.length)];
    var veg = vegs[Math.floor(Math.random() * vegs.length)];
    var fat = fats[Math.floor(Math.random() * fats.length)];

    suggestions.push({
      name: protein + ' with ' + carb,
      time: mealTimes[i],
      notes: 'Include: ' + veg + ', prepared with ' + fat + '.'
    });
  }
  renderSuggestions(suggestions);
}
