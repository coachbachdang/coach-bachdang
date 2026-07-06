const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzs9xENbAa3JhQsyKHvy_nsFEPX4XPJd7lZ57E53lIoo8Y3LbBfuYm1fp18PGueiqKc/exec';

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
