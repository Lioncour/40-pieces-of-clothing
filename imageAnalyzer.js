class ImageAnalyzer {
    constructor() {
        this.model = null;
        this.modelLoaded = false;
        this.loadModel();
    }

    async loadModel() {
        try {
            console.log('Loading MobileNet model...');
            this.model = await mobilenet.load();
            this.modelLoaded = true;
            console.log('MobileNet model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
        }
    }

    async analyzeImage(imageUrl) {
        try {
            if (!this.modelLoaded) {
                console.log('Waiting for model to load...');
                await this.loadModel();
            }

            console.log('Creating image element for:', imageUrl);
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
            
            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = (e) => {
                    console.error('Error loading image:', e);
                    resolve();
                };
            });

            console.log('Classifying image...');
            const predictions = await this.model.classify(img);
            console.log('Predictions:', predictions);
            return this.processAnalysis(predictions);
        } catch (error) {
            console.error('Error analyzing image:', error);
            return null;
        }
    }

    processAnalysis(predictions) {
        const tags = [];
        let category = 'other';
        let description = '';

        // Define clothing keywords for each category
        const categoryKeywords = {
            top: ['shirt', 'tshirt', 't-shirt', 'sweater', 'blouse', 'tank top', 'polo'],
            bottom: ['pants', 'jeans', 'trousers', 'slacks'],
            outerwear: ['jacket', 'coat', 'hoodie', 'blazer', 'cardigan'],
            shorts: ['shorts', 'swim trunks', 'swimming trunks'],
            shoes: ['shoe', 'sneaker', 'boot', 'sandal', 'slipper'],
            gloves: ['glove', 'mitten'],
            hat: ['hat', 'cap', 'beanie', 'fedora']
        };

        predictions.forEach(pred => {
            const label = pred.className.toLowerCase();
            
            // Check each category for matching keywords
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                if (keywords.some(keyword => label.includes(keyword))) {
                    tags.push(category);
                    break;
                }
            }
        });

        // If no specific category was found, add 'other'
        if (tags.length === 0) {
            tags.push('other');
        }

        // Use the first detected category as the main category
        category = tags[0];

        // Create description from top prediction
        description = `This appears to be a ${predictions[0].className.toLowerCase()} 
                      (${Math.round(predictions[0].probability * 100)}% confidence)`;

        return {
            tags: [...new Set(tags)], // Remove duplicates
            description: description,
            category: category
        };
    }
} 