/* Claude: 2026-03-20 — Direct Firestore write for Mary's final exam quizzes.
   Paste this entire script into the browser console while:
   1. Logged in on any Academic Allies page
   2. In Mary's mirror mode (AA_MIRROR_UID is set)
   Then hit Enter. It will write all 12 quizzes to Mary's studentConfig. */

(function() {
  'use strict';

  var uid = window.AA_MIRROR_UID;
  if (!uid) {
    console.error('[QUIZ LOADER] Not in mirror mode! Switch to Mary\'s mirror first.');
    alert('Not in mirror mode! Switch to Mary\'s mirror first.');
    return;
  }

  if (!window.AA || !window.AA.db) {
    console.error('[QUIZ LOADER] Firebase not ready. Wait for the page to fully load.');
    alert('Firebase not ready. Wait for the page to fully load.');
    return;
  }

  /* Claude: 2026-03-25 — sanitized console log to remove PII */
  if (window.AA_DEBUG) console.log('[QUIZ LOADER] Loading quizzes');

  var quizzes = [
    {
      "title": "HORT 235: Flower Names — Common to Scientific",
      "type": "flashcards",
      "description": "Match common flower names to their scientific/genus names. Final exam material.",
      "data": [
        { "term": "Rose", "answer": "Rosa", "hints": ["Starts with the same letters", "Think Rosa Parks", "Latin is almost the same"] },
        { "term": "Peruvian Lily / Alstro", "answer": "Alstroemeria", "hints": ["Also called Lily of the Incas", "Starts with Alstro-", "Named after Swedish botanist"] },
        { "term": "Lisianthus", "answer": "Eustoma", "hints": ["Eu means good in Greek", "Sounds like you-STOW-muh", "Think good mouth"] },
        { "term": "Peony", "answer": "Paeonia", "hints": ["Almost the same word", "Just tweak the spelling", "Pae-ON-ia"] },
        { "term": "Tulip", "answer": "Tulipa", "hints": ["Just add an a", "Simplest genus name ever", "Tu-LIP-ah"] },
        { "term": "Snapdragon", "answer": "Antirrhinum", "hints": ["Anti + rhinum (nose)", "Means like a snout", "An-tir-RYE-num"] },
        { "term": "Larkspur", "answer": "Delphinium / Consolida", "hints": ["Think dolphin (delphi-)", "The spur looks like a dolphins nose", "Two genus names accepted"] },
        { "term": "Stock", "answer": "Matthiola", "hints": ["Named after Italian botanist Mattioli", "Matth-ee-OH-la", "Think Matthew"] },
        { "term": "Bells of Ireland", "answer": "Moluccella", "hints": ["Named after Molucca Islands", "Mo-lu-CELL-a", "Nothing to do with Ireland!"] },
        { "term": "Curly Willow", "answer": "Salix", "hints": ["Same root as salicylic acid (aspirin)", "SAY-licks", "Latin for willow"] },
        { "term": "Babys Breath", "answer": "Gypsophila", "hints": ["Gypso = gypsum, phila = loving", "Loves chalky soil", "Gyp-SOFF-ill-ah"] },
        { "term": "Queen Annes Lace", "answer": "Ammi", "hints": ["Super short genus name", "Just 4 letters", "AM-ee"] },
        { "term": "Waxflower", "answer": "Chamelaucium", "hints": ["Came-LAU-see-um", "From Australia", "The petals feel waxy"] },
        { "term": "Sea Holly", "answer": "Eryngium", "hints": ["Er-IN-jee-um", "Spiky like a sea urchin", "Also called Eryngo"] },
        { "term": "Sunflower", "answer": "Helianthus", "hints": ["Helio = sun, anthus = flower", "Same root as heliocentric", "He-lee-AN-thus"] },
        { "term": "Calla Lily", "answer": "Zantedeschia", "hints": ["Zan-teh-DESK-ee-ah", "Named after Italian botanist", "Not a true lily!"] },
        { "term": "Daisy / Cushion Pom", "answer": "Chrysanthemum", "hints": ["Chrys = gold, anthemum = flower", "Kris-AN-the-mum", "Golden flower in Greek"] },
        { "term": "Myrtle", "answer": "Myrtus", "hints": ["Almost the same word", "Just swap the ending", "MER-tus"] },
        { "term": "Aster / China Aster", "answer": "Callistephus", "hints": ["Calli = beautiful, stephus = crown", "Cal-ih-STEF-us", "Beautiful crown flower"] },
        { "term": "Lily Grass", "answer": "Liriope", "hints": ["Lih-RYE-oh-pee", "Named after a Greek nymph", "Not actually a grass or lily"] },
        { "term": "Bear Grass", "answer": "Xerophyllum", "hints": ["Xero = dry, phyllum = leaf", "Zeer-oh-FILL-um", "Dry leaf plant"] },
        { "term": "Salal", "answer": "Gaultheria", "hints": ["Gawl-THEER-ee-ah", "Named after Dr. Gaulthier", "Common Pacific NW foliage"] },
        { "term": "Bird of Paradise", "answer": "Strelitzia", "hints": ["Streh-LIT-zee-ah", "Named after Queen Charlotte", "Looks like a tropical bird"] },
        { "term": "Statice / Caspia", "answer": "Limonium", "hints": ["Lih-MOH-nee-um", "Think lemon", "From Greek leimon (meadow)"] },
        { "term": "Safari Sunset", "answer": "Leucadendron", "hints": ["Loo-kah-DEN-dron", "Leuco = white, dendron = tree", "South African native"] },
        { "term": "Carnation", "answer": "Dianthus", "hints": ["Di = divine, anthus = flower", "Dye-AN-thus", "Divine flower"] },
        { "term": "Gladiolus / Gladiola", "answer": "Gladiolus", "hints": ["Same word IS the genus name", "Latin for little sword", "Glad-ee-OH-lus"] },
        { "term": "Orchid (Dendrobium type)", "answer": "Dendrobium", "hints": ["Dendro = tree, bium = life", "Den-DRO-bee-um", "Lives on trees"] },
        { "term": "Billy Balls / Drumstick", "answer": "Craspedia", "hints": ["Kras-PEE-dee-ah", "Little yellow balls on sticks", "From Greek kraspedon"] },
        { "term": "Disbud Chrysanthemum", "answer": "Chrysanthemum (single bloom)", "hints": ["A mum with side buds removed", "One large bloom per stem", "Football mum style"] }
      ]
    },
    {
      "title": "HORT 235: Elements & Principles of Design",
      "type": "fill-blank",
      "description": "Know the 7 Elements and 8 Principles of floral design with mnemonics. Final exam material.",
      "data": [
        { "term": "7 Elements of Design (mnemonic)", "answer": "Can Sally Sell Seashells From The Lake", "hints": ["Color, Shape, Space, Size, Fragrance, Texture, Line", "First letters: C-S-S-S-F-T-L", "Sally sells seashells..."] },
        { "term": "8 Principles of Design (mnemonic)", "answer": "FBCRUSHD — Facebook Crashed", "hints": ["Focus, Balance, Contrast, Rhythm, Unity, Scale/Proportion, Harmony, Depth", "F-B-C-R-U-S-H-D", "Said Facebook Crashed!"] },
        { "term": "The building blocks of all artistic compositions", "answer": "Elements of Design", "hints": ["The raw materials", "Color, Shape, Space, etc.", "Not the Principles"] },
        { "term": "Vertical line direction creates a feeling of", "answer": "Strength and masculinity", "hints": ["Think tall building or pillar", "Standing tall", "Powerful and upright"] },
        { "term": "Another word for rhythm in design", "answer": "Movement (eye movement, flow)", "hints": ["How your eye travels", "Visual motion", "Not physical movement"] },
        { "term": "4 types of visual balance", "answer": "Symmetrical, Asymmetrical, Radial, Open", "hints": ["Mirror image is one type", "Pinwheel is another", "One means unequal but balanced"] },
        { "term": "Physical balance is also called", "answer": "Mechanical balance", "hints": ["Will it tip over?", "Actual weight distribution", "Think of a scale"] },
        { "term": "The hole inside a donut is what kind of space?", "answer": "Negative space", "hints": ["The empty part", "Where nothing is", "Opposite of positive space"] },
        { "term": "Difference between shape and form", "answer": "Shape is 2D (outline), Form is 3D", "hints": ["Shape = flat, Form = depth", "Circle vs sphere", "Square vs cube"] },
        { "term": "Difference between fragrance and smell", "answer": "Fragrance is pleasant; smell can be good or bad", "hints": ["One is always nice", "The other could be a skunk", "Roses have fragrance"] },
        { "term": "3 different textures", "answer": "Rough, Smooth, Coarse", "hints": ["How it feels to touch", "Sandpaper vs silk vs burlap", "Three surface feels"] }
      ]
    },
    {
      "title": "HORT 235: Color Harmonies",
      "type": "fill-blank",
      "description": "Color wheel harmonies and terms for floral design. Final exam material.",
      "data": [
        { "term": "Analogous color harmony", "answer": "3 colors next to each other on the color wheel", "hints": ["Think neighbors", "Like red, red-orange, orange", "3 side-by-side colors"] },
        { "term": "Monochromatic color harmony", "answer": "3 versions of 1 color: True Value, Tint, Shade", "hints": ["Mono = one color", "Same hue, different lightness", "Pure + lighter + darker"] },
        { "term": "Split Complimentary", "answer": "3 colors: one color plus two on either side of its complement", "hints": ["Almost complementary but split", "Y-shape on color wheel", "3 colors total"] },
        { "term": "Double Complimentary", "answer": "4 colors: two pairs of complements", "hints": ["Two complementary pairs", "X-shape on color wheel", "4 colors total"] },
        { "term": "Near Complimentary", "answer": "2 colors: one color plus the color next to its complement", "hints": ["Almost across the wheel but not quite", "Slightly off from true complement", "2 colors total"] },
        { "term": "Triadic color harmony", "answer": "3 colors evenly spaced on the wheel (NOT primary)", "hints": ["Triangle shape on wheel", "Equal spacing", "Like secondary colors"] },
        { "term": "Tint", "answer": "Color + white (lighter)", "hints": ["Adding white", "Makes it pastel", "Pink is a tint of red"] },
        { "term": "Shade", "answer": "Color + black (darker)", "hints": ["Adding black", "Makes it deeper", "Maroon is a shade of red"] },
        { "term": "Tone", "answer": "Color + gray (muted)", "hints": ["Adding gray", "Makes it softer", "Less vibrant"] },
        { "term": "True Value", "answer": "The pure color with nothing added", "hints": ["Straight from the wheel", "No white, black, or gray", "Full saturation"] }
      ]
    },
    {
      "title": "HORT 235: Wiring Techniques",
      "type": "fill-blank",
      "description": "6+ wiring techniques, which flowers to use them on, wire gauge info. Final exam material.",
      "data": [
        { "term": "6 main wiring techniques", "answer": "Pierce, Cross-pierce, Hook, Hairpin, Wrap-around, Stitch", "hints": ["Some go through, some wrap", "One is for leaves", "Poke, cross-poke, hook, U-shape, wrap, sew"] },
        { "term": "Wiring technique for mums", "answer": "Hairpin and Hook", "hints": ["U-shape and hook shape", "Two techniques for flat-faced flowers", "Not pierce"] },
        { "term": "Wiring technique for carnations and roses", "answer": "Pierce and Cross-pierce", "hints": ["Goes through the calyx", "One straight, one crosses", "Sturdy base flowers"] },
        { "term": "Wiring technique for most fillers", "answer": "Wrap-around", "hints": ["Wraps around the stem", "For small multi-stem flowers", "Simplest technique"] },
        { "term": "Wiring technique for broad leaves like salal", "answer": "Stitch", "hints": ["Like sewing", "Goes through the leaf", "For flat broad surfaces"] },
        { "term": "Wire gauge 16 is ___ and gauge 30 is ___", "answer": "16 = thickest, 30 = thinnest", "hints": ["Smaller number = bigger wire", "Opposite of what youd think", "16 like coat hanger, 30 like thread"] },
        { "term": "Common gauges for corsages", "answer": "24, 26, 28", "hints": ["Middle-thin range", "Not too thick or thin", "Three gauges"] },
        { "term": "Making mini carnations from one standard carnation", "answer": "Feathering", "hints": ["Pulling apart petals", "Like feathering a bird", "Creates 2-3 mini carnations"] }
      ]
    },
    {
      "title": "HORT 235: Ribbon Sizes & Uses",
      "type": "fill-blank",
      "description": "7 ribbon sizes used in the floral industry and their applications.",
      "data": [
        { "term": "Ribbon size #1", "answer": "Corsage, boutonniere, floral crown", "hints": ["Smallest ribbon", "Tiny delicate work", "Personal flowers"] },
        { "term": "Ribbon size #3", "answer": "Corsage, boutonniere, wrapped flowers", "hints": ["Still small", "Step up from #1", "Hand-tied bouquets"] },
        { "term": "Ribbon size #5", "answer": "Wraps, potted plants", "hints": ["Medium-small", "Gift wrapping", "Potted plant dressing"] },
        { "term": "Ribbon size #9", "answer": "Funeral, bridal, potted plants, 12 roses", "hints": ["Medium workhorse", "Dozen roses", "Formal events"] },
        { "term": "Ribbon size #16", "answer": "Funerals, weddings", "hints": ["Getting bigger", "Formal large events", "Big bows"] },
        { "term": "Ribbon size #40", "answer": "Cuttings, open setting, big packages, car bows", "hints": ["Very wide", "Dramatic bows", "Car dealership bows"] },
        { "term": "How many loops does a 5-loop florist bow actually have?", "answer": "11", "hints": ["Way more than 5!", "Each loop is a pair plus extras", "Double plus one"] }
      ]
    },
    {
      "title": "HORT 235: Chain of Distribution",
      "type": "fill-blank",
      "description": "The 6 traditional stops in the flower distribution chain.",
      "data": [
        { "term": "6 stops in order", "answer": "Grower, Auction, Broker, Wholesaler, Retailer/Florist, Consumer", "hints": ["Farm to table for flowers", "Starts with growing, ends with buying", "6 stops total"] },
        { "term": "Grower role", "answer": "Plant, nurture, harvest, sort, label, package", "hints": ["The farm", "Where it starts", "Grow and package"] },
        { "term": "Auction role", "answer": "Buy and sell agricultural products; ship by air and truck", "hints": ["Buying and selling hub", "Dutch flower auctions", "Products change hands"] },
        { "term": "Broker role", "answer": "Coordinate shipping and customs; handle large quantities", "hints": ["The middleman", "Handles logistics", "Shipping expert"] },
        { "term": "Wholesaler role", "answer": "Source globally, sell to florists; ensure freshness; market intelligence", "hints": ["The warehouse", "Bridges grower and florist", "Bulk seller"] },
        { "term": "Retailer/Florist role", "answer": "Design and deliver to end customer; artistic talent; condition flowers", "hints": ["The flower shop", "Where designs are made", "The artist"] },
        { "term": "Consumer role", "answer": "Receive flowers; end point; final goal", "hints": ["You and me!", "Gets the bouquet", "End of chain"] }
      ]
    },
    {
      "title": "HORT 235: Silk Flowers & Preserving",
      "type": "fill-blank",
      "description": "Tools for silk flowers, benefits/negatives, and preserving methods.",
      "data": [
        { "term": "Pick machine use", "answer": "Anchor stem into foam", "hints": ["Attaches metal pick to stem", "Helps stick into foam", "Mechanical anchoring"] },
        { "term": "Wooden picks use", "answer": "Anchoring stem", "hints": ["Little wooden stake", "Extends or supports stem", "Low-tech"] },
        { "term": "Floral tape use", "answer": "Attach or cover", "hints": ["Stretchy green tape", "Wraps around wire and stems", "Hides mechanics"] },
        { "term": "Greening pins use", "answer": "Bobby pins for moss (cover foam)", "hints": ["U-shaped pins", "Hold moss onto foam", "Like tiny staples"] },
        { "term": "Anchor pins use", "answer": "Anchor foam to container", "hints": ["Holds foam in place", "Bottom of container", "Keeps foam from sliding"] },
        { "term": "5 methods of preserving flowers", "answer": "Air-drying, Drying by burying, Pressing, Glycerin, Freeze-drying", "hints": ["Some use air, some chemicals", "One uses a heavy book", "One is high-tech"] },
        { "term": "What is a desiccant?", "answer": "Something that sucks all the moisture out", "hints": ["Silica gel packets", "Absorbs water", "Used in burying method"] },
        { "term": "3 benefits of silk flowers", "answer": "Never wilt, rearrange, no allergies, any color, less expensive long-term", "hints": ["They last forever", "No watering", "Great for allergy sufferers"] },
        { "term": "3 negatives of silk flowers", "answer": "Fade, collect dust, become outdated, lack fragrance, need maintenance", "hints": ["They get dusty", "No smell", "Styles change"] }
      ]
    },
    {
      "title": "Cooking: Pie Vocabulary",
      "type": "fill-blank",
      "description": "Key terms for pie-making. Final exam material.",
      "data": [
        { "term": "Dont do this with dough when placing into pie pan", "answer": "Stretch", "hints": ["Pulling the dough", "Itll shrink back", "Let it relax"] },
        { "term": "Pumpkin pie is this type of pie", "answer": "Custard", "hints": ["Egg-based filling", "Baked until set", "Smooth and creamy"] },
        { "term": "Has only one purpose: add flavor", "answer": "Salt", "hints": ["Just a pinch", "Seasoning only", "No structural role"] },
        { "term": "Mixture of flour, fat, cold water, and salt", "answer": "Pastry", "hints": ["The basic dough", "Four simple ingredients", "What pie crust is"] },
        { "term": "This action forms more gluten, adding toughness", "answer": "Overmixing", "hints": ["Too much kneading", "Stop when just combined", "Enemy of tender crust"] },
        { "term": "Enemy of tender crust, makes it tough", "answer": "Gluten", "hints": ["Formed from flour + water + mixing", "Protein strands", "Want LESS in pie crust"] },
        { "term": "Added a little at a time into flour mixture", "answer": "Water", "hints": ["Cold or ice cold", "Sprinkle gradually", "Too much = tough"] },
        { "term": "Inhibits gluten development, makes pastry tender", "answer": "Fat", "hints": ["Butter, shortening, or lard", "Coats flour proteins", "Keep it COLD"] },
        { "term": "Should be even, tender, nicely browned", "answer": "Crust", "hints": ["Outside of the pie", "Golden brown", "What you see first"] },
        { "term": "Light and airy pie with gelatin and beaten egg whites", "answer": "Chiffon", "hints": ["Like a cloud", "Fluffy and light", "Gelatin for structure"] },
        { "term": "Sealing of the crust edges", "answer": "Fluting", "hints": ["Crimping the edges", "Pretty pattern around rim", "Pinch and press"] },
        { "term": "Most accurate way to measure flour", "answer": "By weight", "hints": ["Use a scale", "Cups can vary", "Most precise method"] },
        { "term": "Temperature of water for pie dough", "answer": "Ice cold", "hints": ["As cold as possible", "Keeps fat solid", "Add ice cubes first"] }
      ]
    },
    {
      "title": "Cooking: Sauces & Gravies",
      "type": "fill-blank",
      "description": "5 mother sauces, roux types, and thickening agents. Final exam material.",
      "data": [
        { "term": "5 mother sauces", "answer": "Bechamel, Veloute, Hollandaise, Espagnole, Tomato", "hints": ["BVHET: Be Very Happy Eating Tomatoes", "One uses butter and eggs", "French chef Escoffier codified these"] },
        { "term": "Bechamel", "answer": "White sauce: roux + milk", "hints": ["The white one", "Mac and cheese base", "Butter, flour, milk"] },
        { "term": "Veloute", "answer": "Roux + light stock (chicken, fish, veal)", "hints": ["Means velvety in French", "Like bechamel but with stock", "Light-colored stock"] },
        { "term": "Hollandaise", "answer": "Butter + egg yolks (emulsion)", "hints": ["Goes on Eggs Benedict", "Warm emulsion sauce", "No roux!"] },
        { "term": "Espagnole", "answer": "Brown sauce: brown roux + brown stock", "hints": ["The dark brown one", "Spanish-sounding name", "Rich and dark"] },
        { "term": "What happens adding flour to hot soup?", "answer": "It clumps. Must make a slurry first", "hints": ["Lumpy disaster", "Mix with cold liquid first", "Never dump straight in"] }
      ]
    },
    {
      "title": "Cooking: Sanitation, Safety & Knife Skills",
      "type": "fill-blank",
      "description": "Food safety, temperature danger zone, knife safety. Final exam material.",
      "data": [
        { "term": "Temperature Danger Zone", "answer": "40F to 140F", "hints": ["Below 40 is safe (fridge)", "Above 140 is safe (cooking)", "Dangerous middle zone"] },
        { "term": "A dull blade is more dangerous because", "answer": "Requires more force, more likely to slip", "hints": ["You push harder", "It slides off food", "Sharp = safe"] },
        { "term": "3 main food hazards", "answer": "Physical (hair, glass), Chemical (cleaners), Biological (bacteria)", "hints": ["Things you can see, things you cant", "Foreign objects, poison, germs", "Physical, Chemical, Biological"] },
        { "term": "What does TCS stand for?", "answer": "Time/Temperature Control for Safety", "hints": ["Foods needing refrigeration", "Meat, dairy, eggs", "Keep cold or keep hot"] },
        { "term": "What is mise en place?", "answer": "Everything in its place", "hints": ["French kitchen term", "Prep before you cook", "All ingredients ready"] },
        { "term": "Measurement: 1 gallon =", "answer": "4 quarts", "hints": ["G-Q-P-C: 4-2-2", "Quarter of a gallon", "Basic kitchen math"] },
        { "term": "High altitude baking adjustments", "answer": "Add more flour, decrease baking soda, increase oven temp", "hints": ["Things rise faster up high", "Less leavening needed", "All of the above"] },
        { "term": "Poultry should be used or frozen within", "answer": "1-2 days of purchase", "hints": ["Very short window", "Dont wait!", "Fridge life is brief"] }
      ]
    },
    {
      "title": "Cooking: Semester Final Definitions",
      "type": "flashcards",
      "description": "Key terms from the FCS Semester Final Review study guide.",
      "data": [
        { "term": "Cross-Contamination", "answer": "Bacteria moving from raw meat to other food, hands to food, etc.", "hints": ["Raw chicken touching salad", "Wash your hands!", "Separate cutting boards"] },
        { "term": "Stock", "answer": "Flavorful liquid from simmering bones and veggies", "hints": ["Bones are the key", "Base for soups", "Simmer for hours"] },
        { "term": "Proofing", "answer": "Letting yeast dough rise", "hints": ["Yeast bread step", "Dough doubles in size", "Warm place, covered"] },
        { "term": "Braising", "answer": "Brown meat first, then cook slow in a little liquid", "hints": ["Two-step process", "Sear then simmer", "Pot roast method"] },
        { "term": "Roasting", "answer": "Cooking in dry oven heat", "hints": ["Open pan in oven", "No liquid added", "Thanksgiving turkey"] },
        { "term": "Searing", "answer": "Cooking quickly in hot pan to brown the outside", "hints": ["High heat, fast", "Maillard browning", "Flavor on the surface"] },
        { "term": "Maillard Reaction", "answer": "Browning that gives roasted/grilled flavor and color", "hints": ["Not caramelization!", "Proteins + sugars + heat", "Toast, steak, cookies"] },
        { "term": "Carry-over Cooking", "answer": "Food keeps cooking after removed from heat", "hints": ["Internal temp keeps rising", "Rest your steak!", "5-10 degrees more"] },
        { "term": "Gluten", "answer": "Stretchy protein in dough, makes bread chewy", "hints": ["From wheat flour", "Good in bread, bad in pie", "Develops with kneading"] },
        { "term": "Fresh Pasta", "answer": "Pasta made with eggs", "hints": ["Not dried pasta", "Eggs are key", "Cooks much faster"] },
        { "term": "Pesto", "answer": "Sauce from basil, garlic, pine nuts, cheese, oil", "hints": ["Green sauce", "Italian origin", "No cooking required"] },
        { "term": "Emulsion", "answer": "Oil + water mixed together (usually separates)", "hints": ["Oil and vinegar separate", "Temporary mixture", "Needs shaking"] },
        { "term": "Permanent Emulsion", "answer": "Emulsion that stays mixed (like mayo)", "hints": ["Has an emulsifier", "Egg yolk holds it", "Mayo and hollandaise"] },
        { "term": "Fabrication", "answer": "Cutting or shaping raw meat", "hints": ["Butchering skills", "Breaking down a chicken", "Portioning and trimming"] },
        { "term": "Al dente", "answer": "Pasta cooked firm, slight bite", "hints": ["Italian for to the tooth", "Not mushy!", "Slight resistance"] },
        { "term": "Marbling", "answer": "Fat streaks throughout meat", "hints": ["White lines in steak", "More = more flavor", "Wagyu has lots"] },
        { "term": "Pasteurization", "answer": "Heating to kill bacteria without fully cooking", "hints": ["Milk goes through this", "Named after Pasteur", "Makes food safer"] },
        { "term": "Sachet despices", "answer": "Little bag of spices in cheesecloth", "hints": ["French spice bag", "Goes in soups/stocks", "Easy to remove"] },
        { "term": "Sweating vegetables", "answer": "Cooking slowly to release moisture without browning", "hints": ["Low heat, no color", "Onions go translucent", "Gentle cooking"] }
      ]
    },
    {
      "title": "Cooking: Eggs, Dairy, Vegetables & Plant Parts",
      "type": "fill-blank",
      "description": "Egg grades, vegetable plant parts, and cooking fundamentals. Final exam material.",
      "data": [
        { "term": "Brown vs white eggs", "answer": "No nutritional difference, just different chicken breeds", "hints": ["Color doesnt matter", "Its the hen not the egg", "Same nutrition"] },
        { "term": "Egg grades", "answer": "AA (best), A, B", "hints": ["AA is top quality", "Firmer white, rounder yolk", "B for baking"] },
        { "term": "Functions of eggs in cooking", "answer": "Thickener, emulsifier, leavener, binder, coating, garnish", "hints": ["They do everything!", "Hold things together", "Make things rise"] },
        { "term": "3 parts of whole grain kernel", "answer": "Bran (outer, fiber), Endosperm (80%, starch), Germ (2%, fat/vitamins)", "hints": ["Outside, middle, tiny inside", "Bran = fiber, Endosperm = bulk", "Germ is the baby plant"] },
        { "term": "Primal cuts of beef", "answer": "Chuck, Rib, Loin, Sirloin, Round, Brisket, Plate, Flank", "hints": ["Front to back on the cow", "Chuck is the shoulder", "Loin is most tender"] },
        { "term": "Vegetables from FRUITS", "answer": "Avocado, Cucumber, Eggplant, Peppers, Squash, Tomato", "hints": ["Has seeds inside", "Botanically a fruit", "Tomato is famous example"] },
        { "term": "Vegetables from FLOWERS", "answer": "Artichoke, Broccoli, Cauliflower", "hints": ["Youre eating the flower!", "Three common ones", "Broccoli = flower buds"] },
        { "term": "Vegetables from STEMS", "answer": "Asparagus, Celery, Kohlrabi, Rhubarb", "hints": ["Long and stalky", "Stem is what you eat", "Celery is the classic"] },
        { "term": "Baking soda vs baking powder", "answer": "Soda needs acid to activate; powder already contains acid", "hints": ["Soda needs a buddy", "Powder is self-contained", "Both are leaveners"] },
        { "term": "Moist vs Dry heat cooking", "answer": "Moist: braise, boil, steam, simmer, poach. Dry: roast, bake, broil, saute, grill", "hints": ["Moist uses liquid", "Dry uses air or fat", "Braising = moist, Roasting = dry"] }
      ]
    }
  ];

  /* Get current config and merge quizzes in */
  var docRef = window.AA.db.collection('studentConfig').doc(uid);

  docRef.get().then(function(doc) {
    var existing = doc.exists ? doc.data() : {};
    var existingQuizzes = existing.quizzes || [];

    /* Check for duplicates by title */
    var existingTitles = {};
    existingQuizzes.forEach(function(q) { existingTitles[q.title] = true; });

    var added = 0;
    var skipped = 0;
    quizzes.forEach(function(q) {
      if (existingTitles[q.title]) {
        if (window.AA_DEBUG) console.log('[QUIZ LOADER] Skipping duplicate:', q.title);
        skipped++;
      } else {
        existingQuizzes.push(q);
        added++;
      }
    });

    /* Write back to Firestore */
    return docRef.set({
      quizzes: existingQuizzes,
      configuredAt: window.AA.Timestamp.now(),
      configuredBy: window.AA.auth.currentUser ? window.AA.auth.currentUser.uid : null
    }, { merge: true }).then(function() {
      var msg = '[QUIZ LOADER] Done! Added ' + added + ' quizzes, skipped ' + skipped + ' duplicates.';
      if (window.AA_DEBUG) console.log(msg);
      alert(msg);

      /* Audit log */
      return window.AA.db.collection('auditLog').doc(uid).collection('entries').add({
        action: 'quizzes_loaded',
        targetUid: uid,
        actorUid: window.AA.auth.currentUser ? window.AA.auth.currentUser.uid : null,
        timestamp: window.AA.Timestamp.now(),
        details: { quizzesAdded: added, quizzesSkipped: skipped, totalQuizzes: existingQuizzes.length }
      });
    });
  }).then(function() {
    if (window.AA_DEBUG) console.log('[QUIZ LOADER] Audit log entry created.');
  }).catch(function(err) {
    console.error('[QUIZ LOADER] Error:', err);
    alert('Error loading quizzes: ' + err.message);
  });

})();
