// Example plugin — proves the mechanism works, not just documents it.
// Delete this file if you don't want a "gym" preset; it's not core.
module.exports = {
  presetName: 'gym',
  entities: [
    { name: 'Member', fields: [
      { name: 'name', type: 'string', required: true },
      { name: 'membershipActive', type: 'boolean', required: false },
    ]},
    { name: 'ClassSession', fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'date', type: 'date', required: true },
      { name: 'capacity', type: 'number', required: true },
    ]},
  ],
};
