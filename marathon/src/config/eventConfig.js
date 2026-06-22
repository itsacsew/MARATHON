// Configuration file for all event data
export const EVENT_CONFIG = {
  categories: [
    {
      id: 'open',
      name: 'OPEN CATEGORY',
      events: [
        { id: 'fun-run', name: 'FUN RUN', distance: '6KM', fee: 500 },
        { id: 'road-race', name: 'ROAD RACE', distance: '10KM', fee: 800 },
        { id: 'half-marathon', name: 'HALF MARATHON', distance: '21KM', fee: 1300 }
      ]
    },
    {
      id: 'masters',
      name: "40 UPPER'S/MASTER'S CATEGORY",
      events: [
        { id: 'road-race', name: 'ROAD RACE', distance: '10KM', fee: 800 },
        { id: 'half-marathon', name: 'HALF MARATHON', distance: '21KM', fee: 1300 }
      ]
    },
    {
      id: 'liloan',
      name: 'LILOAN ONLY CATEGORY',
      events: [
        { id: 'fun-run', name: 'FUN RUN', distance: '6KM', fee: 500 }
      ]
    }
  ]
};

export const PAYMENT_METHODS = [
  { id: 'landbank', name: 'LANDBANK', icon: '🏦' },
  { id: 'maya', name: 'MAYA', icon: '💳' },
  { id: 'gcash', name: 'GCASH', icon: '📱' }
];