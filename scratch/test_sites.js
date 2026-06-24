import axios from 'axios';

async function main() {
  try {
    const res = await axios.get('http://localhost:7000/sampark-api/api/site/list');
    console.log('Site List:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Failed to get site list:', err.message);
  }
}

main().catch(console.error);
