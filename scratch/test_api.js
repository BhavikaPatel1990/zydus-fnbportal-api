import { getHinaiOrders } from '../src/services/ipd/hinaiorder.service.js';

async function main() {
  const body = {
    site_id: '1',
    view_data: 'today',
    order_type: 'regular',
    list_type: 'ordered',
    page: 1,
    limit: 20,
    search: '',
    location: '',
    mark_discharge: '',
    discharge_intimation: ''
  };

  const jwtUser = {
    id: 1,
    siteID: 1,
    role: 'ADMIN'
  };

  console.log('--- Testing site_id: "1" ---');
  try {
    const result1 = await getHinaiOrders(body, jwtUser);
    console.log('Result for site_id "1":', result1.data ? result1.data.length : 0, 'records found');
    if (result1.data && result1.data.length > 0) {
      console.log('First record patient name:', result1.data[0].patient_name);
    }
  } catch (err) {
    console.error('Error for site_id "1":', err.message);
  }

  console.log('--- Testing site_id: "2" ---');
  try {
    const body2 = { ...body, site_id: '2' };
    const result2 = await getHinaiOrders(body2, jwtUser);
    console.log('Result for site_id "2":', result2.data ? result2.data.length : 0, 'records found');
    if (result2.data && result2.data.length > 0) {
      console.log('First record patient name:', result2.data[0].patient_name);
    }
  } catch (err) {
    console.error('Error for site_id "2":', err.message);
  }
}

main().catch(console.error);
