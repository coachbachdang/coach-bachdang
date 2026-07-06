const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbymRkZ6Mh8MMrc4kigoNNZAxLW-m3BXQPar42oRvKf6Z4mBlKkDzCCCjJ4gl0wynlgqPQ/exec';

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
