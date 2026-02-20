# Recovery Mode Updates Needed

## Changes to Make:

### 1. Image Alt Text
Change the `<img>` alt attribute to show the actual flower name instead of "Flower to identify"

**Find this line:**
```html
<img id="flower-image" class="flower-image" src="" alt="Mystery flower - identify this flower">
```

**In the loadNewFlower() function, add:**
```javascript
imgElement.alt = currentFlower.name; // Shows actual flower name for screen readers
```

### 2. Multiple Images Per Flower
Change `image:` to `images:` (array) in flower data structure

**Old:**
```javascript
{ name: 'Myrtle (Myrtus)', image: 'url...', options: [...] }
```

**New:**
```javascript
{ name: 'Myrtle (Myrtus)', images: ['url1', 'url2', 'url3'], mustKnow: true, options: [...] }
```

### 3. Mark First 20 as "Must Know"
Add `mustKnow: true` to first 20 flowers, `mustKnow: false` to rest

### 4. Update Upload Function
```javascript
function uploadFlowerImage() {
    const file = document.getElementById('upload-image').files[0];
    if (!file) return;
    
    if (!currentFlower) {
        alert('Please load a flower first!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Get existing custom images or create new array
        const customImages = JSON.parse(localStorage.getItem('customFlowerImages') || '{}');
        
        // Initialize array for this flower if doesn't exist
        if (!customImages[currentFlower.name]) {
            customImages[currentFlower.name] = [];
        }
        
        // ADD to the array (don't replace!)
        customImages[currentFlower.name].push(e.target.result);
        
        localStorage.setItem('customFlowerImages', JSON.stringify(customImages));
        
        // Update the flower's images array
        const flowerIndex = flowers.findIndex(f => f.name === currentFlower.name);
        if (flowerIndex !== -1) {
            flowers[flowerIndex].images.push(e.target.result);
        }
        
        alert(`✅ Photo ${customImages[currentFlower.name].length} uploaded for ${currentFlower.name}!`);
    };
    reader.readAsDataURL(file);
}
```

### 5. Update loadNewFlower() to Pick Random Image
```javascript
function loadNewFlower() {
    currentFlower = flowers[Math.floor(Math.random() * flowers.length)];
    
    // Pick a random image from the array
    const randomImageIndex = Math.floor(Math.random() * currentFlower.images.length);
    const selectedImage = currentFlower.images[randomImageIndex];
    
    const imgElement = document.getElementById('flower-image');
    imgElement.src = selectedImage;
    imgElement.alt = currentFlower.name; // SHOW ACTUAL NAME for accessibility!
    
    // Rest of function...
}
```

### 6. Add Visual Indicator for "Must Know" Flowers
Add a star badge to quiz for the first 20:

```javascript
if (currentFlower.mustKnow) {
    const badge = document.createElement('div');
    badge.innerHTML = '⭐ TEST FLOWER - Must Know!';
    badge.style.cssText = 'background: gold; color: #333; padding: 8px; border-radius: 8px; margin: 10px 0; font-weight: bold; text-align: center;';
    document.getElementById('flower-quiz-content').insertBefore(badge, document.getElementById('quiz-options'));
}
```

### First 20 "Must Know" Flowers:
1. Myrtle (Myrtus)
2. Pittosporum
3. Grevillea
4. Salal (Gaultheria)
5. Italian Ruscus
6. Israeli Ruscus
7. Seeded Eucalyptus
8. Lilly Grass (Liriope)
9. Bear Grass (Xerophyllum)
10. Leather Leaf (Rumohra)
11. Gerber Daisy (Gerbera)
12. Iris
13. Anthurium
14. Billy Balls (Craspedia)
15. Lily (Lilium)
16. Disbud Mum (Chrysanthemum)
17. Bird of Paradise (Strelitzia)
18. Tulip (Tulipa)
19. Calla Lily (Zantedeschia)
20. Sunflower (Helianthus)

All remaining flowers get `mustKnow: false`
