const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const natural = require('natural');

// Paths
const csvFilePath = path.join('categorized_descriptions.csv');
const outputFilePath = path.join('categorized_descriptions_features.csv');

// Function to encode categories to numerical values
function encodeCategories(data) {
    const categorySet = new Set();

    // Collect unique categories
    data.forEach(row => {
        categorySet.add(row.category);
    });

    // Create mapping for categories
    const categoryMap = Array.from(categorySet).reduce((acc, cat, index) => {
        acc[cat] = index;
        return acc;
    }, {});

    return categoryMap;
}

// Function to preprocess descriptions by replacing spaces with underscores
function preprocessDescription(description) {
    return description.replace(/ /g, '_');
}

// Function to apply TF-IDF on descriptions and convert to feature matrix
function applyTFIDF(data, categoryMap) {
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();

    // Add each description to the TF-IDF model
    data.forEach(row => {
        const processedDescription = preprocessDescription(row.description);
        tfidf.addDocument(processedDescription);
    });

    // Create a set of all terms to form the feature matrix columns
    const allTerms = new Set();
    data.forEach((_, index) => {
        tfidf.listTerms(index).forEach(item => {
            allTerms.add(item.term);
        });
    });

    const termsArray = Array.from(allTerms);

    // Calculate TF-IDF for each description and create feature vectors
    const featureData = data.map((row, index) => {
        const featureVector = new Array(termsArray.length).fill(0);
        tfidf.listTerms(index).forEach(item => {
            const termIndex = termsArray.indexOf(item.term);
            featureVector[termIndex] = item.tfidf;
        });

        // Append the encoded category to the feature vector
        const encodedCategory = categoryMap[row.category];

        return {
            description: row.description,
            features: featureVector,
            category: encodedCategory
        };
    });

    return { featureData, termsArray };
}

// Read CSV and apply TF-IDF
function processCSV() {
    const data = [];

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            data.push(row);
        })
        .on('end', () => {
            const categoryMap = encodeCategories(data);
            const { featureData, termsArray } = applyTFIDF(data, categoryMap);

            // Write feature data to a new CSV file
            const csvHeader = `description,${termsArray.join(',')},category\n`;
            const csvContent = featureData.map(row => {
                return `${row.description},${row.features.join(',')},${row.category}`;
            }).join('\n');
            fs.writeFileSync(outputFilePath, csvHeader + csvContent);

            console.log('CSV file successfully processed with TF-IDF features.');
        });
}

processCSV();
