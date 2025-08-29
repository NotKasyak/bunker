// Game data for Bunker game

const professions = [
    'Doctor', 'Teacher', 'Engineer', 'Chef', 'Police Officer', 'Firefighter',
    'Programmer', 'Architect', 'Electrician', 'Plumber', 'Mechanic',
    'Farmer', 'Veterinarian', 'Psychologist', 'Journalist', 'Artist',
    'Musician', 'Actor', 'Dancer', 'Writer', 'Librarian',
    'Salesperson', 'Accountant', 'Lawyer', 'Judge', 'Military',
    'Stripper', 'Venereologist', 'Webcam Model', 'YouTuber', 'Sex Shop Salesperson', 
    'Airdrop Hunter', 'Kaito Yapper', 'CT', 'Pilot', 'Flight Attendant', 'Driver', 'Postman', 'Security Guard'
];

const health = [
    'Healthy', 'Nearsightedness', 'Asthma', 'Diabetes', 'Nut allergy',
    'Hypertension', 'Arthritis', 'Migraine', 'Insomnia', 'Depression',
    'Anxiety', 'Sports injury', 'Heart surgery', 'Leg prosthesis',
    'Hearing aid', 'Chronic back pain', 'Epilepsy',
    'Anemia', 'Poor coordination', 'Fatigue'
];

const hobbies = [
    'Reading', 'Sports', 'Cooking', 'Drawing', 'Music', 'Dancing',
    'Photography', 'Gardening', 'Fishing', 'Hunting', 'Travel',
    'Collecting', 'Knitting', 'Chess', 'Video games', 'Movies',
    'Theater', 'Astronomy', 'Geology', 'Archeology', 'History',
    'Languages', 'Programming', 'Robotics', 'Modeling',
    'Rock Climbing', 'Parachuting', 'Diving', 'Surfing', 'Yoga'
];

const phobias = [
    'Arachnophobia (spiders)', 'Claustrophobia (enclosed spaces)', 
    'Acrophobia (heights)', 'Aerophobia (flying)', 'Aquaphobia (water)',
    'Social phobia (people)', 'Agoraphobia (open spaces)',
    'Nyctophobia (darkness)', 'Ophidiophobia (snakes)', 'Cynophobia (dogs)',
    'Misophobia (dirt)', 'Hemophobia (blood)', 'Thanatophobia (death)',
    'Autophobia (loneliness)', 'Phonophobia (loud noises)',
    'Pyrophobia (fire)', 'Trypophobia (holes)', 'Entomophobia (insects)',
    'Meteorophobia (weather)', 'Xenophobia (strangers)'
];

const baggage = [
    'Backpack with food', 'First aid kit', 'Tool kit',
    'Sleeping bag', 'Tent', 'Flashlight with batteries',
    'Radio', 'Compass and maps', '50m rope', 'Knife',
    'Lighter', 'Waterproof matches', 'Canned food', '10l water',
    'Blanket', 'Spare clothes', 'Books', 'Playing cards',
    'Musical instrument', 'Camera', 'Documents',
    'Money', 'Jewelry', 'Family photos', 'Weapons',
    'Alcohol', 'Cigarettes', 'Medicine', 'Plant seeds', 'Fishing rod'
];

const facts = [
    'Served in the army', 'Knows martial arts', 'Can cook',
    'Speaks 3 languages', 'Has a driver\'s license', 'Can sew',
    'Knows first aid', 'Can repair appliances', 'Is a good shot',
    'Knows how to survive in the wild', 'Knows psychology', 'Can sing',
    'Is a good dancer', 'Can play an instrument', 'Knows history',
    'Can count quickly', 'Has a good memory', 'Knows geography',
    'Can draw maps', 'Knows astronomy', 'Can predict the weather',
    'Has a good sense of direction', 'Can climb trees', 'Runs fast',
    'Strong arms', 'Good eyesight', 'Keen hearing', 'Can sense danger',
    'Can persuade people', 'Good leader'
];

const genders = ['Male', 'Female'];

// Function to generate a random player card
function generatePlayerCard() {
  // Helper function to get random item from array
  const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
  
  // Generate random age between 21 and 111
  const age = Math.floor(Math.random() * 91) + 21;
  
  return {
    profession: getRandomItem(professions),
    health: getRandomItem(health),
    hobby: getRandomItem(hobbies),
    phobia: getRandomItem(phobias),
    baggage: getRandomItem(baggage),
    fact1: getRandomItem(facts),
    fact2: (() => {
      // Make sure fact2 is different from fact1
      let fact;
      do {
        fact = getRandomItem(facts);
      } while (fact === fact1);
      return fact;
    })(),
    gender: getRandomItem(genders),
    age: age
  };
}

// Export all data
module.exports = {
  professions,
  health,
  hobbies,
  phobias,
  baggage,
  facts,
  genders,
  generatePlayerCard
};
