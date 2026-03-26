function to12Hour(time) {
  if(!time) return time;
  const match = time.match(/(\d+):(\d+)/);
  if(!match) return time;
  const hours = parseInt(match[1]);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}
