window.CalorieData = window.CalorieData || {};

window.CalorieData.categories = [
  { id: "all", label: "全部" },
  { id: "staple", label: "主食" },
  { id: "chinese", label: "中式餐食" },
  { id: "fastfood", label: "快餐小吃" },
  { id: "protein", label: "肉蛋水产" },
  { id: "beans", label: "豆类坚果" },
  { id: "dairy", label: "奶类" },
  { id: "vegetable", label: "蔬菜" },
  { id: "fruit", label: "水果" },
  { id: "drink", label: "饮品" },
  { id: "other", label: "其他" }
];

window.CalorieData.categoryRules = [
  {
    id: "fastfood",
    pattern: /hamburger|burger|pizza|fried chicken|chicken nugget|wing|fries|hot dog|sandwich|wrap|taco|fastfood|kfc|mcdonald|subway|shake/
  },
  {
    id: "chinese",
    pattern: /chinese|baozi|dumpling|wonton|fried rice|chow mein|fried noodle|rice noodle|roujiamo|jianbing|shaobing|youtiao|zongzi|hot pot|malatang|maocai|luosifen|liangpi|rice roll|claypot|congee|porridge|lamian|ramen|noodle soup|moon cake|tangyuan|yuanxiao|mantou|siu mai|shumai/
  },
  {
    id: "fruit",
    pattern: /apple|banana|orange|grape|watermelon|strawberry|blueberry|mango|pineapple|peach|pear|kiwi|avocado|grapefruit|cherry|lemon|cantaloupe|papaya|coconut|pomegranate|plum|raspberry|blackberry|lychee|persimmon|dragon|guava|fig|apricot|dates|raisins|cranberry|mandarin|tangerine|nectarine|passion|starfruit|durian|jackfruit|rambutan|longan|mangosteen|mulberry|prune|pomelo|kumquat|honeydew|plantain|fruit/
  },
  {
    id: "vegetable",
    pattern: /broccoli|spinach|lettuce|cabbage|carrot|tomato|cucumber|onion|pepper|mushroom|cauliflower|eggplant|zucchini|pumpkin|peas|asparagus|celery|garlic|beet|radish|lotus|bok|kale|okra|yam|taro|cassava|kelp|chives|leek|scallion|bamboo|sprouts|winter|bitter|chayote|pickle|sauerkraut|watercress|fennel|endive|artichoke|turnip|kohlrabi|parsley|cilantro|basil|mint|ginger|vegetable/
  },
  {
    id: "protein",
    pattern: /chicken|beef|pork|bacon|lamb|ham|duck|salmon|tuna|cod|shrimp|tilapia|sardine|crab|scallop|squid|turkey|egg|sausage|liver|fish|trout|mackerel|herring|eel|oyster|mussel|clam|lobster|octopus|abalone|meat/
  },
  {
    id: "beans",
    pattern: /tofu|soy|edamame|lentils|chickpeas|beans|peanut|almond|walnut|cashew|sesame|sunflower|pistachio|macadamia|hazelnut|pecan|pine nuts|pumpkin seeds|chia|flaxseed|hemp|tempeh|seitan/
  },
  {
    id: "dairy",
    pattern: /milk|yogurt|cheese|cream|ice cream|buttermilk|mozzarella|parmesan|feta|brie|ricotta|gouda|swiss|kefir|dairy/
  },
  {
    id: "staple",
    pattern: /rice|oat|bread|pasta|noodle|corn|potato|quinoa|barley|millet|flour|bagel|pita|tortilla|pancake|waffle|cornflakes|granola|cereal|buckwheat|couscous|bulgur|sourdough|croissant|donut|cracker|pretzel|udon|soba|vermicelli|polenta|cornmeal/
  },
  {
    id: "drink",
    pattern: /coffee|tea|cola|juice|water|beer|wine|milk tea|bubble tea|soda|latte|cappuccino|espresso|drink/
  }
];
