/**
 * Direct SSB API test
 */

async function testDirect() {
  const url = 'https://data.ssb.no/api/v0/no/table/10974';

  const body = {
    query: [
      {
        code: 'NACE2007',
        selection: {
          filter: 'item',
          values: ['10-39']
        }
      },
      {
        code: 'SyssGrpIKT',
        selection: {
          filter: 'item',
          values: ['03']
        }
      },
      {
        code: 'Tid',
        selection: {
          filter: 'top',
          values: ['1']
        }
      }
    ],
    response: {
      format: 'json-stat2'
    }
  };

  console.log('Making request with body:', JSON.stringify(body, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const text = await response.text();
    console.log('Response body:', text);
    return;
  }

  const data = await response.json();
  console.log('Success!');
  console.log('Dimensions:', data.id);
  console.log('Sizes:', data.size);
  console.log('Values:', data.value);
}

testDirect().catch(console.error);
