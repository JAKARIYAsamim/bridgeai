// MIMO's own characters, drawn as vector shapes: Haati the elephant and Bagh the tiger cub.
(() => {
  const eye = (x, y, r = 7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1d1b33"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.32}" fill="#fff"/>`;
  const happy = (x, y) => `<path d="M${x - 8} ${y + 2}q8-11 16 0" fill="none" stroke="#1d1b33" stroke-width="4" stroke-linecap="round"/>`;

  /** Haati. mood: 'hi' (arms up), 'calm', 'proud' (eyes closed, happy). extra: 'doctor' adds a stethoscope. */
  function ele({ mood = 'hi', extra = '', flame = false } = {}) {
    const arms = mood === 'calm'
      ? `<ellipse cx="56" cy="158" rx="13" ry="22" transform="rotate(18 56 158)" fill="#8377ee"/><ellipse cx="144" cy="158" rx="13" ry="22" transform="rotate(-18 144 158)" fill="#8377ee"/>`
      : `<ellipse cx="40" cy="132" rx="13" ry="24" transform="rotate(-38 40 132)" fill="#8377ee"/><ellipse cx="160" cy="132" rx="13" ry="24" transform="rotate(38 160 132)" fill="#8377ee"/>`;
    const eyes = mood === 'proud' ? happy(76, 84) + happy(124, 84) : eye(76, 84) + eye(124, 84);
    const aura = flame
      ? `<g fill="#ff8fa9" opacity=".55"><path d="M100 2c14 22 46 20 52 52 22 4 40 30 34 62-6 44-44 74-86 74S20 160 14 116c-6-32 12-58 34-62 6-32 38-30 52-52Z"/></g>
         <g fill="#ffb9c8" opacity=".8"><path d="M100 24c10 18 36 18 40 42 18 4 30 24 26 50-5 34-34 58-66 58s-61-24-66-58c-4-26 8-46 26-50 4-24 30-24 40-42Z"/></g>`
      : '';
    const steth = extra === 'doctor'
      ? `<path d="M74 142c-2 22 8 34 26 34s28-12 26-34" fill="none" stroke="#3d3a5c" stroke-width="4.500" stroke-linecap="round"/><circle cx="100" cy="178" r="8" fill="#fff" stroke="#3d3a5c" stroke-width="4"/>
         <rect x="86" y="20" width="28" height="18" rx="6" fill="#fff"/><path d="M100 24v10M95 29h10" stroke="#ff6f91" stroke-width="3.500" stroke-linecap="round"/>`
      : '';
    return `<svg viewBox="0 0 200 204" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${aura}
      <ellipse cx="72" cy="194" rx="20" ry="9" fill="#766ae6"/><ellipse cx="128" cy="194" rx="20" ry="9" fill="#766ae6"/>
      <ellipse cx="100" cy="160" rx="48" ry="38" fill="#8377ee"/><ellipse cx="100" cy="168" rx="29" ry="23" fill="#ffd3de"/>
      ${arms}
      <ellipse cx="44" cy="84" rx="34" ry="40" fill="#8f84f2"/><ellipse cx="46" cy="86" rx="20" ry="26" fill="#ffc4d3"/>
      <ellipse cx="156" cy="84" rx="34" ry="40" fill="#8f84f2"/><ellipse cx="154" cy="86" rx="20" ry="26" fill="#ffc4d3"/>
      <circle cx="100" cy="86" r="56" fill="#a59bf8"/>
      <path d="M92 36q8-12 16 0" fill="none" stroke="#8377ee" stroke-width="5" stroke-linecap="round"/>
      ${eyes}
      <ellipse cx="60" cy="102" rx="10" ry="6.500" fill="#ff9fb8" opacity=".85"/><ellipse cx="140" cy="102" rx="10" ry="6.500" fill="#ff9fb8" opacity=".85"/>
      <path d="M100 96c0 22-4 36 10 40 9 2 14-4 13-12" fill="none" stroke="#9388f4" stroke-width="22" stroke-linecap="round"/>
      <path d="M92 108h16M93 119h15" stroke="#8377ee" stroke-width="2.500" stroke-linecap="round" opacity=".7"/>
      ${steth}</svg>`;
  }

  /** Bagh the tiger cub: a face only. */
  function tiger({ mood = 'hi' } = {}) {
    const eyes = mood === 'proud' ? happy(56, 74) + happy(104, 74) : eye(56, 74, 6.500) + eye(104, 74, 6.500);
    return `<svg viewBox="0 0 160 136" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="36" cy="34" r="22" fill="#ff8b3d"/><circle cx="37" cy="36" r="11" fill="#ffd0ae"/>
      <circle cx="124" cy="34" r="22" fill="#ff8b3d"/><circle cx="123" cy="36" r="11" fill="#ffd0ae"/>
      <ellipse cx="80" cy="78" rx="64" ry="55" fill="#ff9b4e"/>
      <g fill="#e2681c"><path d="M80 24c5 8 5 16 0 22-5-6-5-14 0-22Z"/><path d="M60 28c6 6 8 13 5 20-6-4-8-12-5-20Z"/><path d="M100 28c-6 6-8 13-5 20 6-4 8-12 5-20Z"/>
        <path d="M17 74c9-1 16 2 20 8-8 2-16-1-20-8Z"/><path d="M143 74c-9-1-16 2-20 8 8 2 16-1 20-8Z"/><path d="M22 94c8-3 15-1 20 4-8 3-15 2-20-4Z"/><path d="M138 94c-8-3-15-1-20 4 8 3 15 2 20-4Z"/></g>
      <ellipse cx="80" cy="100" rx="32" ry="23" fill="#fff4e8"/>
      ${eyes}
      <ellipse cx="42" cy="92" rx="9" ry="6" fill="#ff7f9d" opacity=".7"/><ellipse cx="118" cy="92" rx="9" ry="6" fill="#ff7f9d" opacity=".7"/>
      <path d="M72 88h16l-8 9-8-9Z" fill="#1d1b33" stroke="#1d1b33" stroke-width="3" stroke-linejoin="round"/>
      <path d="M80 97v6M80 103q-8 9-17 3M80 103q8 9 17 3" fill="none" stroke="#1d1b33" stroke-width="3.500" stroke-linecap="round"/>
      <path d="M72 108q8 10 16 0Z" fill="#ff6f91"/></svg>`;
  }

  const cloud = () => `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="#fff"><circle cx="30" cy="40" r="20"/><circle cx="56" cy="28" r="26"/><circle cx="86" cy="38" r="22"/><rect x="20" y="40" width="80" height="20" rx="10"/></g></svg>`;
  const spark = (c = '#ffc233') => `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2c.800 6 4 9.200 10 10-6 .800-9.200 4-10 10-.800-6-4-9.200-10-10 6-.800 9.200-4 10-10Z" fill="${c}"/></svg>`;

  window.M = { ele, tiger, cloud, spark };
})();
