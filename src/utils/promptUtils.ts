
export const randomPrompts = [
  "Adults addicted to social media validation, neglecting real-life interactions",
  "The irony of 'save the environment' messages on disposable plastic cups",
  "People taking photos of their food instead of eating it",
  "Everyone being 'busy' but scrolling social media for hours",
  "Complaining about privacy while sharing everything online",
  "Buying organic food but driving gas-guzzling cars",
  "Preaching minimalism while having rooms full of stuff",
  "Working from home but never leaving the desk",
  "Digital detox retreats advertised on social media",
  "Fast fashion promoting sustainability",
  "Influencers selling authenticity",
  "Online activism without real-world action",
  "Subscription services we forgot we have",
  "Smart homes that make us dumber",
  "Mindfulness apps causing stress notifications",
  "Eco-friendly packaging for unnecessary products",
  "Virtual meetings that could have been emails",
  "Self-help books gathering dust",
  "Fitness apps while sitting all day",
  "Instant everything in a world that needs patience"
];

export const getRandomPrompt = (): string => {
  return randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
};

export const enhancePrompt = (originalPrompt: string): string => {
  const enhancements = [
    `The deeper irony of ${originalPrompt.toLowerCase()} in modern society`,
    `A satirical take on how ${originalPrompt.toLowerCase()} reflects our times`,
    `The contradiction between what we say and do: ${originalPrompt.toLowerCase()}`,
    `Modern life paradox: ${originalPrompt.toLowerCase()} and its social implications`,
    `The absurdity of ${originalPrompt.toLowerCase()} in today's world`,
    `A social commentary on ${originalPrompt.toLowerCase()} and human behavior`,
    `The disconnect between intention and reality: ${originalPrompt.toLowerCase()}`,
    `Contemporary society's blind spot: ${originalPrompt.toLowerCase()}`
  ];
  
  return enhancements[Math.floor(Math.random() * enhancements.length)];
};
