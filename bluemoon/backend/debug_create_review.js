const db = require('./config/db');
const Review = require('./models/Review');

async function run() {
    try {
        const reviewData = {
            resident_id: 'R0001',
            rating: 5,
            feedback: 'Test feedback from debug script',
            survey_response: { q1: 'good' }
        };

        console.log('Attempting to create review with data:', reviewData);
        await Review.create(reviewData);
        console.log('✅ Review created successfully via model.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating review:', error);
        process.exit(1);
    }
}

run();
