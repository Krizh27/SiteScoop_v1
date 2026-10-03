document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('cta-btn');
  const msg = document.getElementById('msg');

  if (btn && msg) {
    btn.addEventListener('click', () => {
      msg.textContent = 'Demo interaction verified! Recovered code runs smoothly.';
    });
  }
});
