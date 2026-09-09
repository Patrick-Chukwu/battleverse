export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  subject: Subject;
  difficulty: "easy" | "medium" | "hard";
  ageGroup: "6-8" | "9-12" | "13-16";
}

export type Subject = "tech" | "ai" | "math" | "general";

export interface SubjectInfo {
  id: Subject;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export const subjects: SubjectInfo[] = [
  { id: "tech", name: "Tech & Coding", emoji: "💻", color: "game-blue", description: "Computers, internet & coding basics" },
  { id: "ai", name: "AI & Future Tech", emoji: "🤖", color: "game-purple", description: "Artificial intelligence & the future" },
  { id: "math", name: "Mathematics", emoji: "➗", color: "game-orange", description: "Numbers, puzzles & logic" },
  { id: "general", name: "General Knowledge", emoji: "🌍", color: "game-green", description: "Science, facts & reasoning" },
];

export const questions: Question[] = [
  // Tech & Coding
  { id: "t1", question: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Power Unit", "Core Processing Utility"], correctIndex: 0, explanation: "CPU stands for Central Processing Unit — the brain of your computer!", subject: "tech", difficulty: "easy", ageGroup: "6-8" },
  { id: "t2", question: "Which of these is a programming language?", options: ["HTML", "Python", "Windows", "Chrome"], correctIndex: 1, explanation: "Python is a popular programming language used to build apps, games, and AI!", subject: "tech", difficulty: "easy", ageGroup: "6-8" },
  { id: "t3", question: "What does 'www' stand for?", options: ["World Wide Web", "Wide World Web", "Web World Wide", "World Web Wide"], correctIndex: 0, explanation: "WWW stands for World Wide Web — the system of websites on the internet.", subject: "tech", difficulty: "easy", ageGroup: "6-8" },
  { id: "t4", question: "What is the main purpose of RAM in a computer?", options: ["Store files permanently", "Temporary fast memory", "Connect to internet", "Display graphics"], correctIndex: 1, explanation: "RAM is temporary memory that helps your computer run programs quickly!", subject: "tech", difficulty: "medium", ageGroup: "9-12" },
  { id: "t5", question: "In Scratch, what does a 'loop' do?", options: ["Stops the program", "Repeats actions", "Deletes a sprite", "Changes the background"], correctIndex: 1, explanation: "A loop repeats a set of instructions over and over — super useful in coding!", subject: "tech", difficulty: "easy", ageGroup: "6-8" },
  { id: "t6", question: "What is an algorithm?", options: ["A type of computer", "A step-by-step set of instructions", "A website", "A video game"], correctIndex: 1, explanation: "An algorithm is like a recipe — step-by-step instructions to solve a problem!", subject: "tech", difficulty: "medium", ageGroup: "9-12" },
  { id: "t7", question: "What does 'debugging' mean in programming?", options: ["Adding bugs to code", "Finding and fixing errors", "Deleting a program", "Making code run faster"], correctIndex: 1, explanation: "Debugging means finding and fixing mistakes (bugs) in your code!", subject: "tech", difficulty: "medium", ageGroup: "9-12" },
  { id: "t8", question: "What is binary code made up of?", options: ["Letters A-Z", "Numbers 0 and 1", "Colors", "Emojis"], correctIndex: 1, explanation: "Binary code uses only 0s and 1s — it's the language computers understand!", subject: "tech", difficulty: "hard", ageGroup: "13-16" },
  { id: "t9", question: "Which device is used to click and point on a computer?", options: ["Keyboard", "Mouse", "Speaker", "Printer"], correctIndex: 1, explanation: "A mouse lets you point and click. Trackpads do a similar job on laptops.", subject: "tech", difficulty: "easy", ageGroup: "6-8" },
  { id: "t10", question: "What does URL stand for?", options: ["Uniform Resource Locator", "Universal Remote Link", "User Random List", "United Router Line"], correctIndex: 0, explanation: "A URL is the address of a page on the web, like a house address for a website.", subject: "tech", difficulty: "medium", ageGroup: "9-12" },
  { id: "t11", question: "Which of these is a web browser?", options: ["Excel", "Chrome", "Photoshop", "Minecraft"], correctIndex: 1, explanation: "Chrome, Firefox, Safari, and Edge are browsers — apps that open websites.", subject: "tech", difficulty: "medium", ageGroup: "9-12" },
  { id: "t12", question: "What does HTTPS add compared with HTTP?", options: ["Faster videos", "Encrypted connection", "Free storage", "Dark mode"], correctIndex: 1, explanation: "The S in HTTPS means the connection is encrypted, which helps keep passwords and data private.", subject: "tech", difficulty: "hard", ageGroup: "13-16" },
  { id: "t13", question: "In programming, what is a variable?", options: ["A forever-fixed number", "A named container for a value", "A type of virus", "The computer's fan"], correctIndex: 1, explanation: "A variable stores a value you can use and change later, like a labelled box.", subject: "tech", difficulty: "hard", ageGroup: "13-16" },
  { id: "t14", question: "What is an IP address used for?", options: ["Colouring a photo", "Identifying a device on a network", "Charging a battery", "Printing a page"], correctIndex: 1, explanation: "An IP address is a numeric label so devices can find each other on a network.", subject: "tech", difficulty: "hard", ageGroup: "13-16" },
  { id: "t15", question: "Which statement about open-source software is true?", options: ["Nobody may read the code", "The source code can be inspected and shared", "It never has bugs", "It only runs offline"], correctIndex: 1, explanation: "Open-source projects publish their source code so others can study, use, and improve it.", subject: "tech", difficulty: "hard", ageGroup: "13-16" },

  // AI & Future Tech
  { id: "a1", question: "Which of these is an example of AI?", options: ["A calculator", "A voice assistant like Siri", "A light bulb", "A bicycle"], correctIndex: 1, explanation: "Voice assistants like Siri use AI to understand and respond to your voice!", subject: "ai", difficulty: "easy", ageGroup: "6-8" },
  { id: "a2", question: "What does AI stand for?", options: ["Awesome Internet", "Artificial Intelligence", "Automatic Input", "Advanced Information"], correctIndex: 1, explanation: "AI stands for Artificial Intelligence — machines that can learn and think!", subject: "ai", difficulty: "easy", ageGroup: "6-8" },
  { id: "a3", question: "Can AI learn from data?", options: ["Yes, that's how it gets smarter", "No, it only follows rules", "Only on weekends", "Only if you ask nicely"], correctIndex: 0, explanation: "AI learns from lots of data to get better at tasks — this is called machine learning!", subject: "ai", difficulty: "medium", ageGroup: "9-12" },
  { id: "a4", question: "What is a robot?", options: ["A type of food", "A machine that can do tasks automatically", "A musical instrument", "A type of cloud"], correctIndex: 1, explanation: "A robot is a machine designed to carry out tasks, sometimes using AI!", subject: "ai", difficulty: "easy", ageGroup: "6-8" },
  { id: "a5", question: "Which technology helps self-driving cars see the road?", options: ["Microphones", "Sensors and cameras", "Speakers", "Keyboards"], correctIndex: 1, explanation: "Self-driving cars use sensors, cameras, and AI to navigate roads safely!", subject: "ai", difficulty: "medium", ageGroup: "9-12" },
  { id: "a6", question: "What is 'machine learning'?", options: ["Teaching machines to read books", "AI that improves by learning from data", "Machines going to school", "A type of exercise"], correctIndex: 1, explanation: "Machine learning is when AI systems learn patterns from data to make predictions!", subject: "ai", difficulty: "hard", ageGroup: "13-16" },
  { id: "a7", question: "Which of these can a simple robot do?", options: ["Feel hungry", "Follow programmed steps", "Dream at night", "Grow taller"], correctIndex: 1, explanation: "Robots follow instructions people (or programs) give them. They do not have human feelings.", subject: "ai", difficulty: "easy", ageGroup: "6-8" },
  { id: "a8", question: "What is a good use of AI at home?", options: ["Guessing your secrets", "Suggesting a playlist you might like", "Locking you out of apps", "Eating your snacks"], correctIndex: 1, explanation: "Recommenders can suggest music or videos from patterns — still check they feel right for you.", subject: "ai", difficulty: "easy", ageGroup: "6-8" },
  { id: "a9", question: "What is a dataset in machine learning?", options: ["A collection of examples used for training", "A single password", "A type of robot joint", "The Wi-Fi password"], correctIndex: 0, explanation: "Models learn from many examples (a dataset). Better, fairer data usually means better results.", subject: "ai", difficulty: "medium", ageGroup: "9-12" },
  { id: "a10", question: "Why might an AI chatbot give a wrong answer?", options: ["It is always joking", "It predicts likely text, and can be incorrect", "The sun is too bright", "Robots cannot use language"], correctIndex: 1, explanation: "Language models guess likely next words. They can sound confident and still be wrong — always check facts.", subject: "ai", difficulty: "medium", ageGroup: "9-12" },
  { id: "a11", question: "What is a neural network inspired by?", options: ["Ocean waves", "Networks of brain cells", "Train timetables", "Paper airplanes"], correctIndex: 1, explanation: "Artificial neural networks are loosely inspired by how neurons connect, but they are math on computers, not brains.", subject: "ai", difficulty: "medium", ageGroup: "9-12" },
  { id: "a12", question: "What does 'training' a model mean?", options: ["Giving it gym exercises", "Adjusting its parameters using examples", "Deleting all data", "Turning the computer off"], correctIndex: 1, explanation: "Training updates the model's internal numbers so its predictions better match the examples.", subject: "ai", difficulty: "hard", ageGroup: "13-16" },
  { id: "a13", question: "What is overfitting?", options: ["The model memorizes training data and fails on new cases", "The computer overheats", "Too many users online", "A cable that is too short"], correctIndex: 0, explanation: "An overfit model looks great on data it has seen and weak on new data — like memorizing answers without understanding.", subject: "ai", difficulty: "hard", ageGroup: "13-16" },
  { id: "a14", question: "Why can AI systems be biased?", options: ["Computers have favourite colours", "Training data and design choices can encode unfair patterns", "Bias only exists in printers", "They refuse to use numbers"], correctIndex: 1, explanation: "If data or labels treat groups unfairly, models can copy that. Careful data and testing help reduce harm.", subject: "ai", difficulty: "hard", ageGroup: "13-16" },
  { id: "a15", question: "What is a prompt in generative AI?", options: ["The instruction or question you give the model", "A type of battery", "The model's cooling fan", "A printed coupon"], correctIndex: 0, explanation: "A prompt is the input text (or other signal) that steers what a generative model produces.", subject: "ai", difficulty: "hard", ageGroup: "13-16" },

  // Mathematics
  { id: "m1", question: "What is 5 × 6?", options: ["25", "30", "35", "56"], correctIndex: 1, explanation: "5 × 6 = 30. Think of it as 5 groups of 6!", subject: "math", difficulty: "easy", ageGroup: "6-8" },
  { id: "m2", question: "What is 144 ÷ 12?", options: ["11", "12", "13", "14"], correctIndex: 1, explanation: "144 ÷ 12 = 12. This is because 12 × 12 = 144!", subject: "math", difficulty: "medium", ageGroup: "9-12" },
  { id: "m3", question: "What shape has 6 sides?", options: ["Pentagon", "Hexagon", "Octagon", "Triangle"], correctIndex: 1, explanation: "A hexagon has 6 sides. 'Hex' means six!", subject: "math", difficulty: "easy", ageGroup: "6-8" },
  { id: "m4", question: "If you have 3 apples and get 7 more, how many do you have?", options: ["8", "9", "10", "11"], correctIndex: 2, explanation: "3 + 7 = 10 apples. Nice addition!", subject: "math", difficulty: "easy", ageGroup: "6-8" },
  { id: "m5", question: "What is 15% of 200?", options: ["15", "25", "30", "35"], correctIndex: 2, explanation: "15% of 200 = 0.15 × 200 = 30!", subject: "math", difficulty: "medium", ageGroup: "9-12" },
  { id: "m6", question: "What is the next number: 2, 4, 8, 16, ...?", options: ["18", "24", "32", "20"], correctIndex: 2, explanation: "Each number doubles! 16 × 2 = 32. This is a geometric sequence.", subject: "math", difficulty: "medium", ageGroup: "9-12" },
  { id: "m7", question: "What is the square root of 81?", options: ["7", "8", "9", "10"], correctIndex: 2, explanation: "√81 = 9 because 9 × 9 = 81!", subject: "math", difficulty: "hard", ageGroup: "13-16" },
  { id: "m8", question: "A triangle's angles always add up to how many degrees?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1, explanation: "The angles of any triangle always sum to 180°!", subject: "math", difficulty: "medium", ageGroup: "9-12" },
  { id: "m9", question: "What is 9 + 8?", options: ["16", "17", "18", "19"], correctIndex: 1, explanation: "9 + 8 = 17. You can think of 10 + 8 = 18, then subtract 1.", subject: "math", difficulty: "easy", ageGroup: "6-8" },
  { id: "m10", question: "How many sides does a square have?", options: ["3", "4", "5", "8"], correctIndex: 1, explanation: "A square has 4 equal sides and 4 right angles.", subject: "math", difficulty: "easy", ageGroup: "6-8" },
  { id: "m11", question: "What is 7 × 8?", options: ["54", "56", "63", "48"], correctIndex: 1, explanation: "7 × 8 = 56. A handy pair: 7 × 8 and 8 × 7 are the same.", subject: "math", difficulty: "medium", ageGroup: "9-12" },
  { id: "m12", question: "Solve for x: 2x + 6 = 20", options: ["5", "7", "8", "14"], correctIndex: 1, explanation: "Subtract 6: 2x = 14, then divide by 2: x = 7.", subject: "math", difficulty: "hard", ageGroup: "13-16" },
  { id: "m13", question: "What is the value of π (pi) approximately?", options: ["2.14", "3.14", "4.14", "1.41"], correctIndex: 1, explanation: "Pi is about 3.14159… — the ratio of a circle's circumference to its diameter.", subject: "math", difficulty: "hard", ageGroup: "13-16" },
  { id: "m14", question: "If a fair coin is flipped, P(heads) is?", options: ["0", "1/4", "1/2", "2"], correctIndex: 2, explanation: "Two equally likely outcomes, heads or tails, so probability of heads is 1/2.", subject: "math", difficulty: "hard", ageGroup: "13-16" },
  { id: "m15", question: "The slope of the line y = 3x − 2 is?", options: ["−2", "3", "1/3", "2"], correctIndex: 1, explanation: "In y = mx + b, m is the slope. Here m = 3.", subject: "math", difficulty: "hard", ageGroup: "13-16" },

  // General Knowledge
  { id: "g1", question: "What should you do if a stranger messages you online?", options: ["Reply immediately", "Share your address", "Tell a trusted adult", "Send them a photo"], correctIndex: 2, explanation: "Always tell a trusted adult if a stranger contacts you online. Stay safe!", subject: "general", difficulty: "easy", ageGroup: "6-8" },
  { id: "g2", question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1, explanation: "Mars is called the Red Planet because of its reddish appearance!", subject: "general", difficulty: "easy", ageGroup: "6-8" },
  { id: "g3", question: "What gas do plants absorb from the air?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Helium"], correctIndex: 1, explanation: "Plants absorb CO₂ and release oxygen — that's photosynthesis!", subject: "general", difficulty: "medium", ageGroup: "9-12" },
  { id: "g4", question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correctIndex: 2, explanation: "There are 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America!", subject: "general", difficulty: "easy", ageGroup: "6-8" },
  { id: "g5", question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3, explanation: "The Pacific Ocean is the largest, covering more area than all land combined!", subject: "general", difficulty: "medium", ageGroup: "9-12" },
  { id: "g6", question: "What is the chemical symbol for water?", options: ["H₂O", "CO₂", "O₂", "NaCl"], correctIndex: 0, explanation: "Water is H₂O — two hydrogen atoms and one oxygen atom!", subject: "general", difficulty: "medium", ageGroup: "9-12" },
  { id: "g7", question: "Which force keeps us on the ground?", options: ["Magnetism", "Friction", "Gravity", "Electricity"], correctIndex: 2, explanation: "Gravity is the force that pulls objects toward Earth's center!", subject: "general", difficulty: "easy", ageGroup: "6-8" },
  { id: "g8", question: "How many bones does an adult human body have?", options: ["106", "206", "306", "406"], correctIndex: 1, explanation: "Adults have 206 bones. Babies actually have more — about 270!", subject: "general", difficulty: "hard", ageGroup: "13-16" },
  { id: "g9", question: "What do we call frozen water?", options: ["Steam", "Ice", "Juice", "Oil"], correctIndex: 1, explanation: "When water freezes it becomes ice. Heat it and it can become steam.", subject: "general", difficulty: "easy", ageGroup: "6-8" },
  { id: "g10", question: "Which organ pumps blood around the body?", options: ["Lungs", "Heart", "Stomach", "Skin"], correctIndex: 1, explanation: "The heart is a muscle that pumps blood through your blood vessels.", subject: "general", difficulty: "medium", ageGroup: "9-12" },
  { id: "g11", question: "What is the smallest planet in our solar system?", options: ["Earth", "Mercury", "Jupiter", "Neptune"], correctIndex: 1, explanation: "Mercury is the smallest planet and the closest to the Sun.", subject: "general", difficulty: "medium", ageGroup: "9-12" },
  { id: "g12", question: "Photosynthesis mainly happens in which plant part?", options: ["Roots", "Leaves", "Flowers only", "Seeds only"], correctIndex: 1, explanation: "Leaves contain chlorophyll, which captures light energy to make food.", subject: "general", difficulty: "hard", ageGroup: "13-16" },
  { id: "g13", question: "What is the main gas in Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctIndex: 1, explanation: "About 78% of the air we breathe is nitrogen; oxygen is about 21%.", subject: "general", difficulty: "hard", ageGroup: "13-16" },
  { id: "g14", question: "DNA is best described as?", options: ["A vitamin", "The molecule that carries genetic instructions", "A type of bone", "A planet"], correctIndex: 1, explanation: "DNA stores the instructions living things use to grow and function.", subject: "general", difficulty: "hard", ageGroup: "13-16" },
  { id: "g15", question: "Which process do cells use to release energy from food with oxygen?", options: ["Photosynthesis", "Aerobic respiration", "Evaporation", "Magnetism"], correctIndex: 1, explanation: "Aerobic respiration uses oxygen to release energy from glucose.", subject: "general", difficulty: "hard", ageGroup: "13-16" },
];

export function getQuestionsBySubject(subject: Subject): Question[] {
  return questions.filter(q => q.subject === subject);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
