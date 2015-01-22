rm -rf countries
git clone --depth 1 git://github.com/johan/world.geo.json.git
mv world.geo.json/countries countries
rm -rf world.geo.json
grep -Po "name\":\"[A-Za-z ]+" countries/*.json | tr ' ' '_' | tr ':"' ' ' | awk '{print "<input type=\"checkbox\" name=\"country\" value=\"" $1 "\">" $3 "<br>"}' | tee checkboxes
echo "Printed to checkboxes file"
