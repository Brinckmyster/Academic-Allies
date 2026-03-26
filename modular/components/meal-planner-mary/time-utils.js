/* Claude: 2026-03-25 — converted to ES5 var/function style */
function to12Hour(time) {
  if(!time) return time;
  var match = time.match(/(\d+):(\d+)/);
  if(!match) return time;
  var hours = parseInt(match[1]);
  var minutes = match[2];
  var ampm = hours >= 12 ? 'PM' : 'AM';
  var h12 = hours % 12 || 12;
  return h12 + ':' + minutes + ' ' + ampm;
}
