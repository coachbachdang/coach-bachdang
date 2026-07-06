const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyu2m5n8g-nIoq2lVtYqsDbaMQIO8_PvD3sCzczxtf1zDSUGY5NrOvXPSP1raRFpPX70Q/exec';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(req.body),
      redirect: 'follow'
    });
  } catch (e) {}
  res.status(200).json({ ok: true });
};
