import { AppData, Artist, Album, Track, Playlist, Show, Episode, Notice, PaymentMethod, BillingInvoice } from '../types';

const NOW = Date.now();
const DAY = 86400000;

export const INITIAL_ARTISTS: Artist[] = [
  { id: 'juniper', name: 'Juniper Hollow', genre: 'lofi', listeners: 2410330, followed: true, cover: 'latte', from: 'Bristol' },
  { id: 'mara', name: 'Mara Okonkwo', genre: 'pop', listeners: 8904112, followed: true, cover: 'sunset', from: 'Lagos' },
  { id: 'ferns', name: 'The Velvet Ferns', genre: 'rock', listeners: 1207455, followed: false, cover: 'cabin', from: 'Portland' },
  { id: 'kofi', name: 'Kofi Mensah', genre: 'hiphop', listeners: 5118902, followed: true, cover: 'ember', from: 'Accra' },
  { id: 'saltwater', name: 'Saltwater Rooms', genre: 'lofi', listeners: 963284, followed: false, cover: 'tide', from: 'Lisbon' },
  { id: 'calder', name: 'Ines Calder', genre: 'jazz', listeners: 412067, followed: false, cover: 'lamp', from: 'Montréal' },
  { id: 'orchard', name: 'Low Orchard', genre: 'rock', listeners: 734590, followed: false, cover: 'garden', from: 'Glasgow' },
  { id: 'yuki', name: 'Yuki Arai', genre: 'pop', listeners: 6302841, followed: true, cover: 'pagoda', from: 'Osaka' },
  { id: 'dune', name: 'Dune Static', genre: 'hiphop', listeners: 2080716, followed: false, cover: 'dune', from: 'Phoenix' },
  { id: 'ottoline', name: 'Ottoline Rue', genre: 'jazz', listeners: 288412, followed: true, cover: 'shot', from: 'New Orleans' },
  { id: 'moss', name: 'Moss & Linen', genre: 'lofi', listeners: 1544009, followed: true, cover: 'moss', from: 'Utrecht' },
  { id: 'teo', name: 'Teo Vance', genre: 'pop', listeners: 4771380, followed: false, cover: 'white', from: 'Melbourne' }
];

export const INITIAL_ALBUMS: Album[] = [
  { id: 'steam', title: 'Steam & Static', artist: 'juniper', year: 2026, cover: 'pour', genre: 'lofi' },
  { id: 'golden', title: 'Golden Hour Club', artist: 'mara', year: 2025, cover: 'sunset', genre: 'pop' },
  { id: 'woodsmoke', title: 'Woodsmoke', artist: 'ferns', year: 2024, cover: 'cabin', genre: 'rock' },
  { id: 'redmoon', title: 'Red Moon Freestyle', artist: 'kofi', year: 2026, cover: 'ember', genre: 'hiphop' },
  { id: 'lowtide', title: 'Low Tide Tapes', artist: 'saltwater', year: 2025, cover: 'tide', genre: 'lofi' },
  { id: 'afterhours', title: 'After Hours at Calder’s', artist: 'calder', year: 2023, cover: 'lamp', genre: 'jazz' },
  { id: 'glasshouse', title: 'Glasshouse', artist: 'orchard', year: 2026, cover: 'garden', genre: 'rock' },
  { id: 'lantern', title: 'Lantern Town', artist: 'yuki', year: 2025, cover: 'pagoda', genre: 'pop' },
  { id: 'nightdunes', title: 'Night Dunes', artist: 'dune', year: 2026, cover: 'dune', genre: 'hiphop' },
  { id: 'espresso', title: 'Espresso Blue', artist: 'ottoline', year: 2024, cover: 'shot', genre: 'jazz' },
  { id: 'softgreen', title: 'Soft Green Rooms', artist: 'moss', year: 2026, cover: 'moss', genre: 'lofi' },
  { id: 'whitenoise', title: 'White Noise Summer', artist: 'teo', year: 2025, cover: 'white', genre: 'pop' },
  { id: 'sundays', title: 'Coffee Shop Sundays', artist: 'juniper', year: 2024, cover: 'latte', genre: 'lofi' },
  { id: 'slowsunday', title: 'Slow Sunday', artist: 'moss', year: 2025, cover: 'linen', genre: 'lofi' },
  { id: 'roastery', title: 'Roastery Sessions', artist: 'ottoline', year: 2025, cover: 'roast', genre: 'jazz' }
];

// YouTube IDs for real video playback & rich Lo-Fi music (verified embeddable finite tracks)
const YT_LOFI_IDS = [
  'jfKfPfyJRdk', // Lofi Girl Relaxing Beats
  '5qap5aO4i9A', // Lofi Hip Hop Chilled
  'DWcJFNfaw9c', // Study Session Chill
  'WPni755-Krg', // Cozy Winter Lofi
  'DeumyOzKqgI', // Peaceful Piano Rain
  '81WBzpwK1dQ', // Late Night Jazz Lofi
  'n61ULEU7SU0', // Cozy Room Beats
  '7NOSDKb0HlU', // Evening Breeze Chill
  'MCkTebktHVc', // Sunset Coffee Lo-Fi
  'S_MOd40zlsk'  // Midnight Forest Focus
];

// High quality local audio streams (instant 0ms response, zero network 403s)
const AUDIO_STREAMS = [
  '/audio/lofi-1.wav',
  '/audio/lofi-2.wav',
  '/audio/lofi-3.wav',
  '/audio/lofi-4.wav',
  '/audio/lofi-5.wav'
];

export const INITIAL_TRACKS: Track[] = [
  // Steam & Static (Juniper)
  { id: 'steam-1', title: 'Milk Foam Clouds', artist: 'juniper', album: 'steam', genre: 'lofi', dur: 154, loved: false, youtubeId: YT_LOFI_IDS[0], audioUrl: AUDIO_STREAMS[0] },
  { id: 'steam-2', title: 'Window Seat', artist: 'juniper', album: 'steam', genre: 'lofi', dur: 172, loved: false, youtubeId: YT_LOFI_IDS[1], audioUrl: AUDIO_STREAMS[1] },
  { id: 'steam-3', title: 'Two Sugars', artist: 'juniper', album: 'steam', genre: 'lofi', dur: 139, loved: false, youtubeId: YT_LOFI_IDS[2], audioUrl: AUDIO_STREAMS[2] },
  { id: 'steam-4', title: 'Rainy Commute', artist: 'juniper', album: 'steam', genre: 'lofi', dur: 188, loved: false, youtubeId: YT_LOFI_IDS[3], audioUrl: AUDIO_STREAMS[3] },

  // Golden Hour Club (Mara)
  { id: 'golden-1', title: 'Golden Hour Club', artist: 'mara', album: 'golden', genre: 'pop', dur: 201, loved: false, youtubeId: YT_LOFI_IDS[4], audioUrl: AUDIO_STREAMS[4] },
  { id: 'golden-2', title: 'Sunset Drive', artist: 'mara', album: 'golden', genre: 'pop', dur: 214, loved: false, youtubeId: YT_LOFI_IDS[5], audioUrl: AUDIO_STREAMS[0] },
  { id: 'golden-3', title: 'Paper Planes Home', artist: 'mara', album: 'golden', genre: 'pop', dur: 187, loved: false, youtubeId: YT_LOFI_IDS[6], audioUrl: AUDIO_STREAMS[1] },
  { id: 'golden-4', title: 'Let It Ring', artist: 'mara', album: 'golden', genre: 'pop', dur: 196, loved: false, youtubeId: YT_LOFI_IDS[7], audioUrl: AUDIO_STREAMS[2] },

  // Woodsmoke (Velvet Ferns)
  { id: 'woodsmoke-1', title: 'Cabin Lights', artist: 'ferns', album: 'woodsmoke', genre: 'rock', dur: 236, loved: false, youtubeId: YT_LOFI_IDS[8], audioUrl: AUDIO_STREAMS[3] },
  { id: 'woodsmoke-2', title: 'Pinewood', artist: 'ferns', album: 'woodsmoke', genre: 'rock', dur: 251, loved: false, youtubeId: YT_LOFI_IDS[9], audioUrl: AUDIO_STREAMS[4] },
  { id: 'woodsmoke-3', title: 'Northbound', artist: 'ferns', album: 'woodsmoke', genre: 'rock', dur: 219, loved: false, youtubeId: YT_LOFI_IDS[0], audioUrl: AUDIO_STREAMS[0] },

  // Red Moon Freestyle (Kofi)
  { id: 'redmoon-1', title: 'Red Moon', artist: 'kofi', album: 'redmoon', genre: 'hiphop', dur: 177, loved: false, explicit: true, youtubeId: YT_LOFI_IDS[1], audioUrl: AUDIO_STREAMS[1] },
  { id: 'redmoon-2', title: 'Hourglass Flow', artist: 'kofi', album: 'redmoon', genre: 'hiphop', dur: 163, loved: false, youtubeId: YT_LOFI_IDS[2], audioUrl: AUDIO_STREAMS[2] },
  { id: 'redmoon-3', title: 'Ember Talk', artist: 'kofi', album: 'redmoon', genre: 'hiphop', dur: 191, loved: false, explicit: true, youtubeId: YT_LOFI_IDS[3], audioUrl: AUDIO_STREAMS[3] },
  { id: 'redmoon-4', title: 'Kumasi Nights', artist: 'kofi', album: 'redmoon', genre: 'hiphop', dur: 205, loved: false, youtubeId: YT_LOFI_IDS[4], audioUrl: AUDIO_STREAMS[4] },

  // Low Tide Tapes (Saltwater)
  { id: 'lowtide-1', title: 'Low Tide', artist: 'saltwater', album: 'lowtide', genre: 'lofi', dur: 166, loved: false, youtubeId: YT_LOFI_IDS[5], audioUrl: AUDIO_STREAMS[0] },
  { id: 'lowtide-2', title: 'Salt on the Sill', artist: 'saltwater', album: 'lowtide', genre: 'lofi', dur: 148, loved: false, youtubeId: YT_LOFI_IDS[6], audioUrl: AUDIO_STREAMS[1] },
  { id: 'lowtide-3', title: 'Harbour Lights', artist: 'saltwater', album: 'lowtide', genre: 'lofi', dur: 181, loved: false, youtubeId: YT_LOFI_IDS[7], audioUrl: AUDIO_STREAMS[2] },

  // After Hours (Calder)
  { id: 'afterhours-1', title: 'Last Table', artist: 'calder', album: 'afterhours', genre: 'jazz', dur: 244, loved: false, youtubeId: YT_LOFI_IDS[8], audioUrl: AUDIO_STREAMS[3] },
  { id: 'afterhours-2', title: 'Brass & Velvet', artist: 'calder', album: 'afterhours', genre: 'jazz', dur: 268, loved: false, youtubeId: YT_LOFI_IDS[9], audioUrl: AUDIO_STREAMS[4] },
  { id: 'afterhours-3', title: 'Lamp-lit', artist: 'calder', album: 'afterhours', genre: 'jazz', dur: 231, loved: false, youtubeId: YT_LOFI_IDS[0], audioUrl: AUDIO_STREAMS[0] },

  // Glasshouse (Low Orchard)
  { id: 'glasshouse-1', title: 'Glasshouse', artist: 'orchard', album: 'glasshouse', genre: 'rock', dur: 228, loved: false, youtubeId: YT_LOFI_IDS[1], audioUrl: AUDIO_STREAMS[1] },
  { id: 'glasshouse-2', title: 'Evergreen Static', artist: 'orchard', album: 'glasshouse', genre: 'rock', dur: 207, loved: false, youtubeId: YT_LOFI_IDS[2], audioUrl: AUDIO_STREAMS[2] },
  { id: 'glasshouse-3', title: 'Lawn Party', artist: 'orchard', album: 'glasshouse', genre: 'rock', dur: 199, loved: false, youtubeId: YT_LOFI_IDS[3], audioUrl: AUDIO_STREAMS[3] },

  // Lantern Town (Yuki)
  { id: 'lantern-1', title: 'Lantern Town', artist: 'yuki', album: 'lantern', genre: 'pop', dur: 192, loved: false, youtubeId: YT_LOFI_IDS[4], audioUrl: AUDIO_STREAMS[4] },
  { id: 'lantern-2', title: 'Mountain Mail', artist: 'yuki', album: 'lantern', genre: 'pop', dur: 183, loved: false, youtubeId: YT_LOFI_IDS[5], audioUrl: AUDIO_STREAMS[0] },
  { id: 'lantern-3', title: 'Moon Over Gion', artist: 'yuki', album: 'lantern', genre: 'pop', dur: 205, loved: false, youtubeId: YT_LOFI_IDS[6], audioUrl: AUDIO_STREAMS[1] },
  { id: 'lantern-4', title: 'Little Fireflies', artist: 'yuki', album: 'lantern', genre: 'pop', dur: 176, loved: false, youtubeId: YT_LOFI_IDS[7], audioUrl: AUDIO_STREAMS[2] },

  // Night Dunes (Dune Static)
  { id: 'nightdunes-1', title: 'Night Dunes', artist: 'dune', album: 'nightdunes', genre: 'hiphop', dur: 185, loved: false, explicit: true, youtubeId: YT_LOFI_IDS[8], audioUrl: AUDIO_STREAMS[3] },
  { id: 'nightdunes-2', title: 'Sandglass', artist: 'dune', album: 'nightdunes', genre: 'hiphop', dur: 171, loved: false, youtubeId: YT_LOFI_IDS[9], audioUrl: AUDIO_STREAMS[4] },
  { id: 'nightdunes-3', title: 'Full Moon Cypher', artist: 'dune', album: 'nightdunes', genre: 'hiphop', dur: 199, loved: false, explicit: true, youtubeId: YT_LOFI_IDS[0], audioUrl: AUDIO_STREAMS[0] },

  // Espresso Blue (Ottoline)
  { id: 'espresso-1', title: 'Espresso Blue', artist: 'ottoline', album: 'espresso', genre: 'jazz', dur: 256, loved: false, youtubeId: YT_LOFI_IDS[1], audioUrl: AUDIO_STREAMS[1] },
  { id: 'espresso-2', title: 'Crema', artist: 'ottoline', album: 'espresso', genre: 'jazz', dur: 232, loved: false, youtubeId: YT_LOFI_IDS[2], audioUrl: AUDIO_STREAMS[2] },
  { id: 'espresso-3', title: 'Bitter & Sweet', artist: 'ottoline', album: 'espresso', genre: 'jazz', dur: 245, loved: false, youtubeId: YT_LOFI_IDS[3], audioUrl: AUDIO_STREAMS[3] },

  // Soft Green Rooms (Moss)
  { id: 'softgreen-1', title: 'Fern Light', artist: 'moss', album: 'softgreen', genre: 'lofi', dur: 158, loved: false, youtubeId: YT_LOFI_IDS[4], audioUrl: AUDIO_STREAMS[4] },
  { id: 'softgreen-2', title: 'Velvet Couch', artist: 'moss', album: 'softgreen', genre: 'lofi', dur: 171, loved: false, youtubeId: YT_LOFI_IDS[5], audioUrl: AUDIO_STREAMS[0] },
  { id: 'softgreen-3', title: 'Green Hour', artist: 'moss', album: 'softgreen', genre: 'lofi', dur: 149, loved: false, youtubeId: YT_LOFI_IDS[6], audioUrl: AUDIO_STREAMS[1] },
  { id: 'softgreen-4', title: 'Slow Leaves', artist: 'moss', album: 'softgreen', genre: 'lofi', dur: 163, loved: false, youtubeId: YT_LOFI_IDS[7], audioUrl: AUDIO_STREAMS[2] },

  // White Noise Summer (Teo)
  { id: 'whitenoise-1', title: 'White Noise Summer', artist: 'teo', album: 'whitenoise', genre: 'pop', dur: 198, loved: false, youtubeId: YT_LOFI_IDS[8], audioUrl: AUDIO_STREAMS[3] },
  { id: 'whitenoise-2', title: 'Open Plan', artist: 'teo', album: 'whitenoise', genre: 'pop', dur: 186, loved: false, youtubeId: YT_LOFI_IDS[9], audioUrl: AUDIO_STREAMS[4] },
  { id: 'whitenoise-3', title: 'Daylight Savings', artist: 'teo', album: 'whitenoise', genre: 'pop', dur: 207, loved: false, youtubeId: YT_LOFI_IDS[0], audioUrl: AUDIO_STREAMS[0] },
  { id: 'whitenoise-4', title: 'Linen Shirt', artist: 'teo', album: 'whitenoise', genre: 'pop', dur: 191, loved: false, youtubeId: YT_LOFI_IDS[1], audioUrl: AUDIO_STREAMS[1] },

  // Coffee Shop Sundays (Juniper)
  { id: 'sundays-1', title: 'Coffee Shop', artist: 'juniper', album: 'sundays', genre: 'lofi', dur: 162, loved: false, youtubeId: YT_LOFI_IDS[2], audioUrl: AUDIO_STREAMS[2] },
  { id: 'sundays-2', title: 'Latte Art', artist: 'juniper', album: 'sundays', genre: 'lofi', dur: 151, loved: false, youtubeId: YT_LOFI_IDS[3], audioUrl: AUDIO_STREAMS[3] },
  { id: 'sundays-3', title: 'Corner Booth', artist: 'juniper', album: 'sundays', genre: 'lofi', dur: 177, loved: false, youtubeId: YT_LOFI_IDS[4], audioUrl: AUDIO_STREAMS[4] },

  // Slow Sunday (Moss)
  { id: 'slowsunday-1', title: 'Unmade Bed', artist: 'moss', album: 'slowsunday', genre: 'lofi', dur: 169, loved: false, youtubeId: YT_LOFI_IDS[5], audioUrl: AUDIO_STREAMS[0] },
  { id: 'slowsunday-2', title: 'Linen Morning', artist: 'moss', album: 'slowsunday', genre: 'lofi', dur: 184, loved: false, youtubeId: YT_LOFI_IDS[6], audioUrl: AUDIO_STREAMS[1] },
  { id: 'slowsunday-3', title: 'Nap Time', artist: 'moss', album: 'slowsunday', genre: 'lofi', dur: 156, loved: false, youtubeId: YT_LOFI_IDS[7], audioUrl: AUDIO_STREAMS[2] },

  // Roastery Sessions (Ottoline)
  { id: 'roastery-1', title: 'Green Beans', artist: 'ottoline', album: 'roastery', genre: 'jazz', dur: 239, loved: false, youtubeId: YT_LOFI_IDS[8], audioUrl: AUDIO_STREAMS[3] },
  { id: 'roastery-2', title: 'First Crack', artist: 'ottoline', album: 'roastery', genre: 'jazz', dur: 222, loved: false, youtubeId: YT_LOFI_IDS[9], audioUrl: AUDIO_STREAMS[4] }
];

export const INITIAL_SHOWS: Show[] = [
  { id: 'quiet', name: 'The Quiet Hour', host: 'Amara Bello', cover: 'lamp', topic: 'Wellbeing', followed: true, about: 'Slow conversations about rest, routines and doing less, better.' },
  { id: 'liner', name: 'Liner Notes', host: 'Theo Marsh & Priya Nair', cover: 'roast', topic: 'Music', followed: true, about: 'One album a week, track by track, with the people who made it.' },
  { id: 'rooms', name: 'Small Rooms', host: 'Lena Fischer', cover: 'chair', topic: 'Design', followed: false, about: 'Tiny homes, small studios and the people who make them feel big.' },
  { id: 'night', name: 'Night Shift Radio', host: 'Kenji Watanabe', cover: 'pagoda', topic: 'Stories', followed: true, about: 'Stories from people who work while the city sleeps.' },
  { id: 'second', name: 'Second Cup', host: 'Rosa Delgado', cover: 'pour', topic: 'Food', followed: false, about: 'Coffee, the people who grow it and the mornings it makes.' }
];

export const INITIAL_EPISODES: Episode[] = [
  { id: 'quiet-1', show: 'quiet', title: 'Why boredom is good for you', dur: 2710, t: NOW - 1 * DAY, progress: 1200 },
  { id: 'quiet-2', show: 'quiet', title: 'The ten-minute evening reset', dur: 1986, t: NOW - 8 * DAY, played: true },
  { id: 'quiet-3', show: 'quiet', title: 'Sleep like a cat', dur: 2420, t: NOW - 15 * DAY },
  { id: 'quiet-4', show: 'quiet', title: 'Saying no without guilt', dur: 2235, t: NOW - 22 * DAY },

  { id: 'liner-1', show: 'liner', title: 'How “Golden Hour Club” got its horns', dur: 3160, t: NOW - 2 * DAY, progress: 840 },
  { id: 'liner-2', show: 'liner', title: 'Lo-fi’s secret ingredient: tape hiss', dur: 2884, t: NOW - 9 * DAY },
  { id: 'liner-3', show: 'liner', title: 'The 90-second song', dur: 2512, t: NOW - 16 * DAY },
  { id: 'liner-4', show: 'liner', title: 'Making a record in a cabin', dur: 3345, t: NOW - 23 * DAY },

  { id: 'rooms-1', show: 'rooms', title: 'A studio flat in Utrecht', dur: 1834, t: NOW - 3 * DAY },
  { id: 'rooms-2', show: 'rooms', title: 'Light is the cheapest furniture', dur: 1655, t: NOW - 10 * DAY },
  { id: 'rooms-3', show: 'rooms', title: 'The one-chair living room', dur: 1720, t: NOW - 17 * DAY },

  { id: 'night-1', show: 'night', title: 'The 3am baker', dur: 2190, t: NOW - 4 * DAY },
  { id: 'night-2', show: 'night', title: 'Lighthouse keeper, retired', dur: 2604, t: NOW - 11 * DAY },
  { id: 'night-3', show: 'night', title: 'Night nurse, ward 9', dur: 2347, t: NOW - 18 * DAY },

  { id: 'second-1', show: 'second', title: 'What “single origin” really means', dur: 1490, t: NOW - 5 * DAY },
  { id: 'second-2', show: 'second', title: 'A day at a roastery', dur: 1720, t: NOW - 12 * DAY },
  { id: 'second-3', show: 'second', title: 'Cold brew, warm hands', dur: 1366, t: NOW - 19 * DAY }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'morning',
    name: 'Morning pages',
    desc: 'Soft starts for writing before work',
    cover: 'hchair',
    mine: true,
    made: NOW - 210 * DAY,
    tracks: ['steam-1', 'steam-2', 'sundays-2', 'softgreen-1', 'slowsunday-2', 'lowtide-1', 'afterhours-3', 'softgreen-4']
  },
  {
    id: 'deepwork',
    name: 'Deep work',
    desc: 'No words, no surprises',
    cover: 'detail',
    mine: true,
    made: NOW - 160 * DAY,
    tracks: ['steam-4', 'lowtide-2', 'lowtide-3', 'softgreen-3', 'sundays-3', 'slowsunday-3', 'steam-3', 'espresso-2', 'roastery-1']
  },
  {
    id: 'sunday',
    name: 'Sunday reset',
    desc: 'Laundry, plants, a long lunch',
    cover: 'throw',
    mine: true,
    made: NOW - 95 * DAY,
    tracks: ['golden-1', 'whitenoise-4', 'lantern-4', 'glasshouse-3', 'afterhours-1', 'slowsunday-1', 'espresso-1']
  },
  {
    id: 'walk',
    name: 'Long walk home',
    desc: 'For the scenic route',
    cover: 'living',
    mine: true,
    made: NOW - 41 * DAY,
    tracks: ['golden-2', 'woodsmoke-3', 'redmoon-4', 'nightdunes-1', 'lantern-2', 'whitenoise-1', 'glasshouse-1', 'woodsmoke-1', 'redmoon-1']
  },
  {
    id: 'mix1',
    name: 'Chill vibes',
    desc: 'Daily mix 1 · Juniper Hollow, Moss & Linen and more',
    cover: 'lounge',
    mine: false,
    made: NOW,
    tracks: ['sundays-1', 'softgreen-2', 'lowtide-1', 'steam-2', 'slowsunday-1', 'softgreen-1', 'sundays-2', 'lowtide-3', 'steam-1', 'slowsunday-2']
  },
  {
    id: 'mix2',
    name: 'Soft pop',
    desc: 'Daily mix 2 · Mara Okonkwo, Yuki Arai and more',
    cover: 'sofa',
    mine: false,
    made: NOW,
    tracks: ['golden-1', 'lantern-1', 'whitenoise-1', 'golden-3', 'lantern-3', 'whitenoise-2', 'golden-4', 'lantern-4']
  },
  {
    id: 'mix3',
    name: 'Late night jazz',
    desc: 'Daily mix 3 · Ottoline Rue, Ines Calder',
    cover: 'roast',
    mine: false,
    made: NOW,
    tracks: ['espresso-1', 'afterhours-1', 'espresso-3', 'roastery-2', 'afterhours-2', 'espresso-2', 'roastery-1']
  },
  {
    id: 'fresh',
    name: 'Fresh finds',
    desc: 'New songs picked from what you love',
    cover: 'chair',
    mine: false,
    made: NOW - 1 * DAY,
    tracks: ['glasshouse-2', 'nightdunes-2', 'woodsmoke-2', 'nightdunes-3', 'glasshouse-1', 'redmoon-3', 'afterhours-3']
  },
  {
    id: 'repeat',
    name: 'On repeat',
    desc: 'The songs you can’t stop playing',
    cover: 'linen',
    mine: false,
    made: NOW - 2 * DAY,
    tracks: ['steam-1', 'golden-2', 'sundays-1', 'softgreen-1', 'lantern-1', 'redmoon-2', 'steam-2']
  },
  {
    id: 'youtube-lofi',
    name: 'YouTube Lo-Fi Beats',
    desc: 'Stream live YouTube Lo-Fi radios with synchronized vinyl playback',
    cover: 'sunset',
    mine: true,
    made: NOW,
    tracks: ['steam-1', 'steam-2', 'steam-4', 'golden-1', 'afterhours-3'],
    isYouTube: true
  }
];

export const INITIAL_NOTICES: Notice[] = [
  { id: 'n1', t: NOW - 120 * 60000, tone: 'good', icon: 'sparkles', title: 'Welcome to FONO lofi', body: 'Connect Spotify & YouTube to stream your music library', read: false, href: 'settings' },
  { id: 'n2', t: NOW - 360 * 60000, tone: 'plain', icon: 'podcast', title: 'New Liner Notes', body: 'How “Golden Hour Club” got its horns', read: false, href: 'podcasts' },
  { id: 'n3', t: NOW - 560 * 60000, tone: 'good', icon: 'flame', title: 'Seven days in a row', body: 'Your longest streak this month', read: false, href: 'stats' },
  { id: 'n4', t: NOW - 1500 * 60000, tone: 'plain', icon: 'music', title: 'Glasshouse is out', body: 'Low Orchard released a new album', read: true, href: 'library' }
];

export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm-apple-pay',
    type: 'apple_pay',
    isDefault: true,
    addedAt: NOW - 14 * DAY
  },
  {
    id: 'pm-stripe-card-1',
    type: 'stripe',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2028,
    cardholderName: 'Noor Haddad',
    isDefault: false,
    addedAt: NOW - 30 * DAY
  }
];

export const INITIAL_INVOICES: BillingInvoice[] = [
  {
    id: 'inv-1082',
    date: NOW - 14 * DAY,
    amount: '$5.99',
    planId: 'plus',
    planName: 'VIP Max Lifetime Pass',
    paymentMethodLabel: 'Apple Pay (Touch ID)',
    status: 'paid',
    receiptNumber: 'REC-2026-9812'
  },
  {
    id: 'inv-1054',
    date: NOW - 60 * DAY,
    amount: '$5.99',
    planId: 'plus',
    planName: 'VIP Studio Supporter',
    paymentMethodLabel: 'Visa ending in 4242',
    status: 'paid',
    receiptNumber: 'REC-2026-4401'
  }
];

export function getInitialData(): AppData {
  return {
    tracks: INITIAL_TRACKS,
    albums: INITIAL_ALBUMS,
    artists: INITIAL_ARTISTS,
    playlists: INITIAL_PLAYLISTS,
    shows: INITIAL_SHOWS,
    episodes: INITIAL_EPISODES,
    history: [],
    notices: INITIAL_NOTICES,
    tickets: [],
    player: {
      kind: 'track',
      id: 'steam-1',
      pos: 0,
      playing: false,
      queue: INITIAL_PLAYLISTS[0].tracks.slice(),
      shuffle: false,
      repeat: 'off',
      volume: 0.85,
      showVideo: false
    },
    goal: 30, // 30 minutes daily goal
    plan: 'free', // VIP Max mode activated
    prefs: {
      crossfade: 4,
      quality: 'high',
      autoplay: true,
      normalise: true,
      explicit: true,
      digest: true,
      newMusic: true,
      podcastAlerts: true,
      theme: 'light',
      sidebarRail: false
    },
    profile: {
      name: 'Guest Listener',
      handle: 'guest',
      email: 'guest@fono.fm',
      city: 'Online Room',
      isRegistered: false,
      provider: 'guest'
    },
    paymentMethods: INITIAL_PAYMENT_METHODS,
    invoices: INITIAL_INVOICES,
    seq: 1
  };
}
