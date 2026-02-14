#!/bin/bash
echo '{"flowers":[' > modular/icons/flowers/flowers.json

for file in modular/icons/flowers/flower*.png; do
    basename "$file"
done | sed 's/flower\([0-9]*\)-[0-9]* \(.*\)\.png/\1:\2/' | sort -u | while IFS=: read num name; do
    images=$(ls modular/icons/flowers/flower${num}-*.png 2>/dev/null | sed 's|modular|"/Academic-Allies/modular|; s|$|"|' | paste -sd,)
    clean_name=$(echo "$name" | sed 's/^ *//; s/ *$//')
    
    echo "  {\"name\":\"$clean_name\",\"images\":[$images],\"quiz\":1},"
done >> modular/icons/flowers/flowers.json

echo ']}' >> modular/icons/flowers/flowers.json
echo "Generated flowers.json with all flower data!"
