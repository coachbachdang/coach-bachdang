const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVfOFxDUAN6mPyPFeVzB8mIeFNYxlrlyCfkG8Jii3x/exec';

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
