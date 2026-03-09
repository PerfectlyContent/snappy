import { google } from 'googleapis';

export async function createContact(auth, contactData) {
  const people = google.people({ version: 'v1', auth });

  const person = {
    names: contactData.name ? [{ givenName: contactData.name }] : [],
    organizations: contactData.company ? [{
      name: contactData.company,
      title: contactData.title || '',
    }] : [],
    emailAddresses: contactData.email ? [{ value: contactData.email }] : [],
    phoneNumbers: contactData.phone ? [{ value: contactData.phone }] : [],
    urls: contactData.website ? [{ value: contactData.website }] : [],
    addresses: contactData.address ? [{ formattedValue: contactData.address }] : [],
    biographies: [{ value: 'Added by Snappy', contentType: 'TEXT_PLAIN' }],
  };

  const res = await people.people.createContact({
    requestBody: person,
    personFields: 'names,emailAddresses,phoneNumbers,organizations,urls,addresses,biographies',
  });

  const contactId = res.data.resourceName?.replace('people/', '');
  return {
    resourceName: res.data.resourceName,
    contactUrl: contactId ? `https://contacts.google.com/person/${contactId}` : null,
    name: contactData.name,
    email: contactData.email,
    phone: contactData.phone,
  };
}

export async function searchContacts(auth, query) {
  const people = google.people({ version: 'v1', auth });

  // Use searchContacts for query-based lookup across all user contacts
  if (query && query.length >= 1) {
    const res = await people.people.searchContacts({
      query,
      readMask: 'names,emailAddresses',
      pageSize: 10,
    });

    return (res.data.results || [])
      .map(r => r.person)
      .filter(p => p?.emailAddresses?.length)
      .map(person => ({
        name: person.names?.[0]?.displayName || '',
        email: person.emailAddresses[0].value,
      }));
  }

  // No query — return contacts that have email addresses
  const res = await people.people.connections.list({
    resourceName: 'people/me',
    pageSize: 20,
    sortOrder: 'LAST_MODIFIED_DESCENDING',
    personFields: 'names,emailAddresses',
  });

  return (res.data.connections || [])
    .filter(p => p.emailAddresses?.length)
    .map(person => ({
      name: person.names?.[0]?.displayName || '',
      email: person.emailAddresses[0].value,
    }))
    .slice(0, 10);
}

export async function getRecentContacts(auth, count = 10) {
  const people = google.people({ version: 'v1', auth });

  const res = await people.people.connections.list({
    resourceName: 'people/me',
    pageSize: count,
    sortOrder: 'LAST_MODIFIED_DESCENDING',
    personFields: 'names,emailAddresses,phoneNumbers,organizations,biographies',
  });

  return (res.data.connections || [])
    .filter(p => p.biographies?.some(b => b.value?.includes('Snappy')))
    .map(person => ({
      resourceName: person.resourceName,
      name: person.names?.[0]?.displayName || '',
      email: person.emailAddresses?.[0]?.value || '',
      phone: person.phoneNumbers?.[0]?.value || '',
      company: person.organizations?.[0]?.name || '',
    }));
}
