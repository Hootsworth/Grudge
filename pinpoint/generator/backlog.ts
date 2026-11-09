// 14-Day Vetted Backlog of Puzzles for Pinpoint
import type { SpotCandidate } from './filter.ts';

export interface BacklogDay {
  plate: number;
  dateOffset: number; // offset from base date
  spots: SpotCandidate[];
}

export const BACKLOG_PUZZLES: BacklogDay[] = [
  {
    plate: 1,
    dateOffset: 0,
    spots: [
      { id: 'spot_01_1', name: 'Strait of Gibraltar', lat: 35.96, lon: -5.6, continent: 'Europe', difficulty: 1, fact: 'The Strait of Gibraltar connects the Atlantic Ocean to the Mediterranean Sea and separates Europe from Africa.', sourceUrl: 'https://en.wikipedia.org/wiki/Strait_of_Gibraltar' },
      { id: 'spot_01_2', name: 'Sinai Peninsula', lat: 29.5, lon: 33.8, continent: 'Asia', difficulty: 2, fact: 'The triangular Sinai Peninsula serves as the land bridge between the continents of Asia and Africa.', sourceUrl: 'https://en.wikipedia.org/wiki/Sinai_Peninsula' },
      { id: 'spot_01_3', name: 'Baja California', lat: 28.0, lon: -113.5, continent: 'North America', difficulty: 2, fact: 'The narrow Baja California peninsula separates the Pacific Ocean from the Gulf of California.', sourceUrl: 'https://en.wikipedia.org/wiki/Baja_California_Peninsula' },
      { id: 'spot_01_4', name: 'Cape of Good Hope', lat: -34.35, lon: 18.49, continent: 'Africa', difficulty: 3, fact: 'The Cape of Good Hope marks the rocky headland on the Atlantic coast of South Africa navigated by early Portuguese explorers.', sourceUrl: 'https://en.wikipedia.org/wiki/Cape_of_Good_Hope' },
      { id: 'spot_01_5', name: 'Cook Strait', lat: -41.25, lon: 174.5, continent: 'Oceania', difficulty: 3, fact: 'Cook Strait connects the Tasman Sea with the South Pacific Ocean between New Zealand’s North and South Islands.', sourceUrl: 'https://en.wikipedia.org/wiki/Cook_Strait' },
    ],
  },
  {
    plate: 2,
    dateOffset: 1,
    spots: [
      { id: 'spot_02_1', name: 'Bosphorus Strait', lat: 41.1, lon: 29.05, continent: 'Europe', difficulty: 1, fact: 'The Bosphorus Strait forms part of the continental boundary between Europe and Asia, dividing the historic city of Istanbul.', sourceUrl: 'https://en.wikipedia.org/wiki/Bosphorus' },
      { id: 'spot_02_2', name: 'Cape Horn', lat: -55.98, lon: -67.27, continent: 'South America', difficulty: 2, fact: 'Cape Horn is the southernmost headland of the Tierra del Fuego archipelago, marking the northern boundary of the Drake Passage.', sourceUrl: 'https://en.wikipedia.org/wiki/Cape_Horn' },
      { id: 'spot_02_3', name: 'Korean Peninsula', lat: 37.5, lon: 127.5, continent: 'Asia', difficulty: 2, fact: 'The Korean Peninsula extends southward from the Asian continent between the Sea of Japan and the Yellow Sea.', sourceUrl: 'https://en.wikipedia.org/wiki/Korean_Peninsula' },
      { id: 'spot_02_4', name: 'Strait of Malacca', lat: 2.5, lon: 101.5, continent: 'Asia', difficulty: 3, fact: 'The Strait of Malacca is a narrow maritime stretch between the Malay Peninsula and the Indonesian island of Sumatra.', sourceUrl: 'https://en.wikipedia.org/wiki/Strait_of_Malacca' },
      { id: 'spot_02_5', name: 'Florida Keys', lat: 24.7, lon: -81.0, continent: 'North America', difficulty: 1, fact: 'The Florida Keys are a coral cay archipelago extending southwest from the tip of the Florida peninsula.', sourceUrl: 'https://en.wikipedia.org/wiki/Florida_Keys' },
    ],
  },
  {
    plate: 3,
    dateOffset: 2,
    spots: [
      { id: 'spot_03_1', name: 'Peloponnese Peninsula', lat: 37.5, lon: 22.3, continent: 'Europe', difficulty: 2, fact: 'The Peloponnese peninsula in southern Greece is separated from the central mainland by the narrow Corinth Canal.', sourceUrl: 'https://en.wikipedia.org/wiki/Peloponnese' },
      { id: 'spot_03_2', name: 'Yucatan Peninsula', lat: 20.0, lon: -89.0, continent: 'North America', difficulty: 2, fact: 'The Yucatan Peninsula separates the Gulf of Mexico from the Caribbean Sea and is composed predominantly of limestone.', sourceUrl: 'https://en.wikipedia.org/wiki/Yucat%C3%A1n_Peninsula' },
      { id: 'spot_03_3', name: 'Strait of Hormuz', lat: 26.6, lon: 56.4, continent: 'Asia', difficulty: 3, fact: 'The Strait of Hormuz connects the Persian Gulf with the Gulf of Oman and the Arabian Sea.', sourceUrl: 'https://en.wikipedia.org/wiki/Strait_of_Hormuz' },
      { id: 'spot_03_4', name: 'Mozambique Channel', lat: -18.0, lon: 41.0, continent: 'Africa', difficulty: 3, fact: 'The Mozambique Channel is an arm of the Indian Ocean located between the island of Madagascar and southeast Africa.', sourceUrl: 'https://en.wikipedia.org/wiki/Mozambique_Channel' },
      { id: 'spot_03_5', name: 'Tasmania', lat: -42.0, lon: 146.5, continent: 'Oceania', difficulty: 2, fact: 'Tasmania is an island state of Australia separated from the mainland by the rough waters of Bass Strait.', sourceUrl: 'https://en.wikipedia.org/wiki/Tasmania' },
    ],
  },
  {
    plate: 4,
    dateOffset: 3,
    spots: [
      { id: 'spot_04_1', name: 'Kattegat Strait', lat: 57.0, lon: 11.5, continent: 'Europe', difficulty: 2, fact: 'The Kattegat is a shallow sea area bounded by the Jutland peninsula in the west and Sweden in the east.', sourceUrl: 'https://en.wikipedia.org/wiki/Kattegat' },
      { id: 'spot_04_2', name: 'Kamchatka Peninsula', lat: 56.0, lon: 160.0, continent: 'Asia', difficulty: 3, fact: 'The Kamchatka Peninsula lies in the Russian Far East between the Pacific Ocean and the Sea of Okhotsk.', sourceUrl: 'https://en.wikipedia.org/wiki/Kamchatka_Peninsula' },
      { id: 'spot_04_3', name: 'Isthmus of Panama', lat: 8.9, lon: -79.6, continent: 'North America', difficulty: 1, fact: 'The narrow Isthmus of Panama connects North and South America and is traversed by the Panama Canal.', sourceUrl: 'https://en.wikipedia.org/wiki/Isthmus_of_Panama' },
      { id: 'spot_04_4', name: 'Cape York Peninsula', lat: -12.5, lon: 142.5, continent: 'Oceania', difficulty: 4, fact: 'Cape York Peninsula is a large remote peninsula located in Far North Queensland, Australia.', sourceUrl: 'https://en.wikipedia.org/wiki/Cape_York_Peninsula' },
      { id: 'spot_04_5', name: 'Bab-el-Mandeb', lat: 12.6, lon: 43.3, continent: 'Africa', difficulty: 3, fact: 'The Bab-el-Mandeb strait connects the Red Sea to the Gulf of Aden between Yemen and Djibouti.', sourceUrl: 'https://en.wikipedia.org/wiki/Bab-el-Mandeb' },
    ],
  },
  {
    plate: 5,
    dateOffset: 4,
    spots: [
      { id: 'spot_05_1', name: 'Dardanelles Strait', lat: 40.2, lon: 26.4, continent: 'Europe', difficulty: 2, fact: 'The Dardanelles connects the Aegean Sea with the Sea of Marmara and has served as a strategic military choke point.', sourceUrl: 'https://en.wikipedia.org/wiki/Dardanelles' },
      { id: 'spot_05_2', name: 'Vancouver Island', lat: 49.5, lon: -125.5, continent: 'North America', difficulty: 2, fact: 'Vancouver Island lies along Canada’s Pacific Coast, separated from the mainland by the Strait of Georgia.', sourceUrl: 'https://en.wikipedia.org/wiki/Vancouver_Island' },
      { id: 'spot_05_3', name: 'Falkland Islands', lat: -51.7, lon: -59.5, continent: 'South America', difficulty: 3, fact: 'The Falkland Islands are an archipelago in the South Atlantic Ocean on the Patagonian Shelf.', sourceUrl: 'https://en.wikipedia.org/wiki/Falkland_Islands' },
      { id: 'spot_05_4', name: 'Sri Lanka / Palk Strait', lat: 9.5, lon: 80.0, continent: 'Asia', difficulty: 2, fact: 'The Palk Strait is a shallow water body between the Tamil Nadu state of India and the northern tip of Sri Lanka.', sourceUrl: 'https://en.wikipedia.org/wiki/Palk_Strait' },
      { id: 'spot_05_5', name: 'Gulf of Guinea Coast', lat: 5.5, lon: -0.2, continent: 'Africa', difficulty: 4, fact: 'The Gulf of Guinea represents the northeasternmost part of the tropical Atlantic Ocean off western Africa.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_Guinea' },
    ],
  },
  {
    plate: 6,
    dateOffset: 5,
    spots: [
      { id: 'spot_06_1', name: 'Crimean Peninsula', lat: 45.0, lon: 34.0, continent: 'Europe', difficulty: 2, fact: 'The Crimean Peninsula extends into the Black Sea and is connected to the mainland by the narrow Isthmus of Perekop.', sourceUrl: 'https://en.wikipedia.org/wiki/Crimean_Peninsula' },
      { id: 'spot_06_2', name: 'Taiwan Strait', lat: 24.0, lon: 119.5, continent: 'Asia', difficulty: 2, fact: 'The Taiwan Strait separates the island of Taiwan from the continental Asian mainland.', sourceUrl: 'https://en.wikipedia.org/wiki/Taiwan_Strait' },
      { id: 'spot_06_3', name: 'Great Australian Bight', lat: -32.5, lon: 130.0, continent: 'Oceania', difficulty: 3, fact: 'The Great Australian Bight is a vast open bay off the southern coastline of the Australian continent.', sourceUrl: 'https://en.wikipedia.org/wiki/Great_Australian_Bight' },
      { id: 'spot_06_4', name: 'Newfoundland', lat: 48.5, lon: -55.0, continent: 'North America', difficulty: 3, fact: 'Newfoundland is a large island off the eastern coast of North America, blocking the mouth of the Saint Lawrence River.', sourceUrl: 'https://en.wikipedia.org/wiki/Newfoundland_(island)' },
      { id: 'spot_06_5', name: 'Cape Agulhas', lat: -34.83, lon: 20.0, continent: 'Africa', difficulty: 4, fact: 'Cape Agulhas is the true southernmost point of the African continent and the official dividing line between the Atlantic and Indian Oceans.', sourceUrl: 'https://en.wikipedia.org/wiki/Cape_Agulhas' },
    ],
  },
  {
    plate: 7,
    dateOffset: 6,
    spots: [
      { id: 'spot_07_1', name: 'Corsica and Sardinia Strait', lat: 41.3, lon: 9.2, continent: 'Europe', difficulty: 3, fact: 'The Strait of Bonifacio is the international strait separating the French island of Corsica from the Italian island of Sardinia.', sourceUrl: 'https://en.wikipedia.org/wiki/Strait_of_Bonifacio' },
      { id: 'spot_07_2', name: 'Tsugaru Strait', lat: 41.5, lon: 140.5, continent: 'Asia', difficulty: 3, fact: 'The Tsugaru Strait is a channel between Honshu and Hokkaido in northern Japan, traversed underground by the Seikan Tunnel.', sourceUrl: 'https://en.wikipedia.org/wiki/Tsugaru_Strait' },
      { id: 'spot_07_3', name: 'Beagle Channel', lat: -54.9, lon: -68.2, continent: 'South America', difficulty: 4, fact: 'The Beagle Channel is a strait in the Tierra del Fuego archipelago on the extreme southern tip of South America.', sourceUrl: 'https://en.wikipedia.org/wiki/Beagle_Channel' },
      { id: 'spot_07_4', name: 'Cape Canaveral', lat: 28.4, lon: -80.6, continent: 'North America', difficulty: 2, fact: 'Cape Canaveral is a prominent barrier island promontory on the Atlantic coast of Florida used for major space launches.', sourceUrl: 'https://en.wikipedia.org/wiki/Cape_Canaveral' },
      { id: 'spot_07_5', name: 'Gulf of Aden', lat: 12.0, lon: 48.0, continent: 'Africa', difficulty: 3, fact: 'The Gulf of Aden is a deepwater gulf between the Arabian Peninsula and the Horn of Africa.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_Aden' },
    ],
  },
  {
    plate: 8,
    dateOffset: 7,
    spots: [
      { id: 'spot_08_1', name: 'Jutland Peninsula', lat: 56.0, lon: 9.0, continent: 'Europe', difficulty: 2, fact: 'The Jutland peninsula comprises the continental mainland part of Denmark and northern Germany.', sourceUrl: 'https://en.wikipedia.org/wiki/Jutland' },
      { id: 'spot_08_2', name: 'Gulf of Aqaba', lat: 28.5, lon: 34.7, continent: 'Asia', difficulty: 3, fact: 'The Gulf of Aqaba is a northeastern arm of the Red Sea extending between the Sinai Peninsula and the Arabian Peninsula.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_Aqaba' },
      { id: 'spot_08_3', name: 'Gulf of California', lat: 26.5, lon: -110.5, continent: 'North America', difficulty: 3, fact: 'The Gulf of California is a marginal sea of the Pacific Ocean that separates the Baja California Peninsula from the Mexican mainland.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_California' },
      { id: 'spot_08_4', name: 'Cape Leeuwin', lat: -34.37, lon: 115.14, continent: 'Oceania', difficulty: 4, fact: 'Cape Leeuwin is the most south-westerly mainland point of the Australian continent.', sourceUrl: 'https://en.wikipedia.org/wiki/Cape_Leeuwin' },
      { id: 'spot_08_5', name: 'Cape Verde Peninsula', lat: 14.7, lon: -17.4, continent: 'Africa', difficulty: 3, fact: 'The Cap-Vert peninsula is the westernmost point of the African continent, upon which the city of Dakar is situated.', sourceUrl: 'https://en.wikipedia.org/wiki/Cap-Vert' },
    ],
  },
  {
    plate: 9,
    dateOffset: 8,
    spots: [
      { id: 'spot_09_1', name: 'Skagerrak Strait', lat: 58.0, lon: 9.5, continent: 'Europe', difficulty: 3, fact: 'The Skagerrak is a strait running between the southeast coast of Norway, the Bohuslän coast of Sweden and the Jutland peninsula of Denmark.', sourceUrl: 'https://en.wikipedia.org/wiki/Skagerrak' },
      { id: 'spot_09_2', name: 'Strait of Magellan', lat: -53.5, lon: -71.0, continent: 'South America', difficulty: 3, fact: 'The Strait of Magellan is a navigable sea route in southern Chile separating mainland South America to the north and Tierra del Fuego to the south.', sourceUrl: 'https://en.wikipedia.org/wiki/Strait_of_Magellan' },
      { id: 'spot_09_3', name: 'Torres Strait', lat: -10.0, lon: 142.5, continent: 'Oceania', difficulty: 4, fact: 'Torres Strait is a strait which lies between Australia and the Melanesian island of New Guinea.', sourceUrl: 'https://en.wikipedia.org/wiki/Torres_Strait' },
      { id: 'spot_09_4', name: 'Gulf of Oman', lat: 24.5, lon: 58.5, continent: 'Asia', difficulty: 3, fact: 'The Gulf of Oman connects the Arabian Sea with the Strait of Hormuz, running along the coast of Oman, the UAE, and Iran.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_Oman' },
      { id: 'spot_09_5', name: 'Chesapeake Bay', lat: 37.5, lon: -76.0, continent: 'North America', difficulty: 2, fact: 'Chesapeake Bay is an estuary in the Mid-Atlantic region of the United States surrounded by Maryland and Virginia.', sourceUrl: 'https://en.wikipedia.org/wiki/Chesapeake_Bay' },
    ],
  },
  {
    plate: 10,
    dateOffset: 9,
    spots: [
      { id: 'spot_10_1', name: 'Brittany Peninsula', lat: 48.2, lon: -3.0, continent: 'Europe', difficulty: 2, fact: 'Brittany is a rugged peninsula extending from western France into the Atlantic Ocean toward the Celtic Sea.', sourceUrl: 'https://en.wikipedia.org/wiki/Brittany' },
      { id: 'spot_10_2', name: 'Gulf of Suez', lat: 28.5, lon: 33.0, continent: 'Africa', difficulty: 3, fact: 'The Gulf of Suez is a gulf at the northern end of the Red Sea, leading into the southern terminus of the Suez Canal.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_Suez' },
      { id: 'spot_10_3', name: 'Aleutian Islands', lat: 52.5, lon: -174.0, continent: 'North America', difficulty: 4, fact: 'The volcanic Aleutian Islands extend westward from the Alaska Peninsula into the northern Pacific Ocean toward the Kamchatka Peninsula.', sourceUrl: 'https://en.wikipedia.org/wiki/Aleutian_Islands' },
      { id: 'spot_10_4', name: 'Korean Strait / Busan', lat: 35.0, lon: 129.0, continent: 'Asia', difficulty: 3, fact: 'The Korea Strait is a sea passage between South Korea and Japan, connecting the East China Sea and the Sea of Japan.', sourceUrl: 'https://en.wikipedia.org/wiki/Korea_Strait' },
      { id: 'spot_10_5', name: 'Bass Strait', lat: -39.5, lon: 146.0, continent: 'Oceania', difficulty: 3, fact: 'Bass Strait is a strait separating the island state of Tasmania from the Australian mainland state of Victoria.', sourceUrl: 'https://en.wikipedia.org/wiki/Bass_Strait' },
    ],
  },
  {
    plate: 11,
    dateOffset: 10,
    spots: [
      { id: 'spot_11_1', name: 'English Channel / Strait of Dover', lat: 51.0, lon: 1.4, continent: 'Europe', difficulty: 1, fact: 'The Strait of Dover is the narrowest part of the English Channel, marking the boundary between the Channel and the North Sea.', sourceUrl: 'https://en.wikipedia.org/wiki/Strait_of_Dover' },
      { id: 'spot_11_2', name: 'Reykjanes Peninsula', lat: 63.9, lon: -22.0, continent: 'Europe', difficulty: 3, fact: 'The Reykjanes peninsula in southwestern Iceland is characterized by active volcanism and extensive post-glacial lava fields.', sourceUrl: 'https://en.wikipedia.org/wiki/Reykjanes' },
      { id: 'spot_11_3', name: 'Andaman and Nicobar Islands', lat: 11.5, lon: 92.7, continent: 'Asia', difficulty: 4, fact: 'The Andaman Islands form an archipelago in the northeastern Indian Ocean separating the Bay of Bengal from the Andaman Sea.', sourceUrl: 'https://en.wikipedia.org/wiki/Andaman_Islands' },
      { id: 'spot_11_4', name: 'Puget Sound', lat: 47.7, lon: -122.5, continent: 'North America', difficulty: 2, fact: 'Puget Sound is a complex estuarine inlet along the northwestern coast of the U.S. state of Washington.', sourceUrl: 'https://en.wikipedia.org/wiki/Puget_Sound' },
      { id: 'spot_11_5', name: 'Stewart Island', lat: -47.0, lon: 167.8, continent: 'Oceania', difficulty: 4, fact: 'Stewart Island is the third-largest island of New Zealand, located south of the South Island across Foveaux Strait.', sourceUrl: 'https://en.wikipedia.org/wiki/Stewart_Island' },
    ],
  },
  {
    plate: 12,
    dateOffset: 11,
    spots: [
      { id: 'spot_12_1', name: 'Gulf of Corinth', lat: 38.3, lon: 22.5, continent: 'Europe', difficulty: 3, fact: 'The Gulf of Corinth is a deep inlet of the Ionian Sea that separates the Peloponnese from western mainland Greece.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_Corinth' },
      { id: 'spot_12_2', name: 'Baffin Island Coast', lat: 65.0, lon: -67.0, continent: 'North America', difficulty: 5, fact: 'Baffin Island in the Canadian territory of Nunavut is the largest island in Canada and is bounded by Baffin Bay.', sourceUrl: 'https://en.wikipedia.org/wiki/Baffin_Island' },
      { id: 'spot_12_3', name: 'Gulf of Thailand', lat: 10.0, lon: 101.0, continent: 'Asia', difficulty: 3, fact: 'The Gulf of Thailand is a shallow inlet in the southwestern South China Sea bounded by Cambodia, Thailand, and Vietnam.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_Thailand' },
      { id: 'spot_12_4', name: 'Walvis Bay', lat: -22.95, lon: 14.5, continent: 'Africa', difficulty: 4, fact: 'Walvis Bay is a coastal port on the Atlantic coast of Namibia sheltered by the Pelican Point sand spit.', sourceUrl: 'https://en.wikipedia.org/wiki/Walvis_Bay' },
      { id: 'spot_12_5', name: 'North Island / Bay of Plenty', lat: -37.5, lon: 177.0, continent: 'Oceania', difficulty: 3, fact: 'The Bay of Plenty is a bight along the northern coast of New Zealand’s North Island renowned for geothermal activity.', sourceUrl: 'https://en.wikipedia.org/wiki/Bay_of_Plenty' },
    ],
  },
  {
    plate: 13,
    dateOffset: 12,
    spots: [
      { id: 'spot_13_1', name: 'Kola Peninsula', lat: 67.5, lon: 36.0, continent: 'Europe', difficulty: 4, fact: 'The Kola Peninsula in northwestern Russia lies almost entirely north of the Arctic Circle between the Barents and White Seas.', sourceUrl: 'https://en.wikipedia.org/wiki/Kola_Peninsula' },
      { id: 'spot_13_2', name: 'Hokkaido / Nemuro Strait', lat: 43.5, lon: 145.5, continent: 'Asia', difficulty: 4, fact: 'The Nemuro Strait is a channel separating the Japanese island of Hokkaido from the Kuril Islands.', sourceUrl: 'https://en.wikipedia.org/wiki/Nemuro_Strait' },
      { id: 'spot_13_3', name: 'Gulf of Saint Lawrence', lat: 48.0, lon: -62.0, continent: 'North America', difficulty: 3, fact: 'The Gulf of Saint Lawrence is the outlet of the North American Great Lakes via the Saint Lawrence River into the Atlantic Ocean.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_Saint_Lawrence' },
      { id: 'spot_13_4', name: 'Zanzibar Archipelago', lat: -6.1, lon: 39.3, continent: 'Africa', difficulty: 3, fact: 'The Zanzibar Archipelago is a group of islands off the coast of East Africa in the Indian Ocean.', sourceUrl: 'https://en.wikipedia.org/wiki/Zanzibar_Archipelago' },
      { id: 'spot_13_5', name: 'Gulf of Carpentaria', lat: -14.0, lon: 138.0, continent: 'Oceania', difficulty: 4, fact: 'The Gulf of Carpentaria is a large, shallow sea enclosed on three sides by northern Australia and bounded on the north by the Arafura Sea.', sourceUrl: 'https://en.wikipedia.org/wiki/Gulf_of_Carpentaria' },
    ],
  },
  {
    plate: 14,
    dateOffset: 13,
    spots: [
      { id: 'spot_14_1', name: 'Tarifa / Punta de Tarifa', lat: 36.0, lon: -5.61, continent: 'Europe', difficulty: 2, fact: 'Punta de Tarifa in Andalusia is the southernmost point of the Iberian Peninsula and of continental Europe.', sourceUrl: 'https://en.wikipedia.org/wiki/Punta_de_Tarifa' },
      { id: 'spot_14_2', name: 'Red Sea / Dahlak Archipelago', lat: 15.8, lon: 40.2, continent: 'Africa', difficulty: 4, fact: 'The Dahlak Archipelago is an island group off the coast of Eritrea in the southern Red Sea known for marine pearl fisheries.', sourceUrl: 'https://en.wikipedia.org/wiki/Dahlak_Archipelago' },
      { id: 'spot_14_3', name: 'Galapagos Islands', lat: -0.6, lon: -90.5, continent: 'South America', difficulty: 3, fact: 'The Galapagos Islands are an isolated volcanic archipelago in the Pacific Ocean distributed on both sides of the equator.', sourceUrl: 'https://en.wikipedia.org/wiki/Gal%C3%A1pagos_Islands' },
      { id: 'spot_14_4', name: 'Persian Gulf / Musandam', lat: 26.0, lon: 56.3, continent: 'Asia', difficulty: 3, fact: 'The Musandam peninsula is an exclave of Oman projecting into the Strait of Hormuz characterized by dramatic fjord-like khors.', sourceUrl: 'https://en.wikipedia.org/wiki/Musandam_Peninsula' },
      { id: 'spot_14_5', name: 'Whitsunday Islands', lat: -20.2, lon: 148.9, continent: 'Oceania', difficulty: 3, fact: 'The Whitsunday Islands are a collection of continental islands off the central coast of Queensland, Australia, bordered by the Great Barrier Reef.', sourceUrl: 'https://en.wikipedia.org/wiki/Whitsunday_Islands' },
    ],
  },
];
