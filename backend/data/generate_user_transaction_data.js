const fs = require('fs');

const preprocessedData = JSON.parse(fs.readFileSync('preprocessed.json', 'utf8'));
const categorizedData = JSON.parse(fs.readFileSync('categorized_descriptions.json', 'utf8'));

// Create a mapping from descriptions to categories and budget groups
const categoryMap = {};
categorizedData.forEach(item => {
    categoryMap[item.description] = {
        category: item.category,
        budget_group: item.budget_group
    };
});

// Combine data based on description
const combinedData = preprocessedData.map(item => ({
    ...item,
    category: categoryMap[item.description]?.category || "Unknown",
    budget_group: categoryMap[item.description]?.budget_group || "Unknown"
}));

// Write combined data to a new JSON file
fs.writeFileSync('combined.json', JSON.stringify(combinedData, null, 2));

console.log('Combined data saved to combined.json');